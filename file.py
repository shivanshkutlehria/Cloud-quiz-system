import cv2
import numpy as np

# ─── Initialize ───────────────────────────────────────────────────────────────
cap = cv2.VideoCapture(0)

orb = cv2.ORB_create(2000)
bf  = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

ret, prev_frame = cap.read()
if not ret:
    print("Error: Could not access webcam.")
    cap.release()
    exit()

prev_gray       = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
kp1, des1       = orb.detectAndCompute(prev_gray, None)

# ─── Trajectory canvas ────────────────────────────────────────────────────────
trajectory = np.zeros((600, 600, 3), dtype=np.uint8)
x, y       = 300, 300          # start at centre of canvas

print("Visual SLAM running. Press 'q' to quit.")

# ─── Main loop ────────────────────────────────────────────────────────────────
while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray    = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    kp2, des2 = orb.detectAndCompute(gray, None)

    if des2 is not None and des1 is not None:

        # ── Feature matching ──────────────────────────────────────────────────
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda m: m.distance)

        if len(matches) > 10:

            # ── Extract matched point coordinates ─────────────────────────────
            pts1 = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
            pts2 = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

            # ── Estimate Essential Matrix (RANSAC) ────────────────────────────
            E, mask = cv2.findEssentialMat(
                pts2, pts1,
                focal=1.0, pp=(0., 0.),
                method=cv2.RANSAC, prob=0.999, threshold=1.0
            )

            # ── Recover camera pose (R, t) ────────────────────────────────────
            if E is not None:
                _, R, t, _ = cv2.recoverPose(E, pts2, pts1)

                # Scale translation and update position
                x += int(t[0][0] * 50)
                y += int(t[2][0] * 50)

                # Keep position within canvas bounds
                x = np.clip(x, 0, 599)
                y = np.clip(y, 0, 599)

                # Plot trajectory point
                cv2.circle(trajectory, (x, y), 2, (0, 255, 0), -1)

        # ── Draw top 20 feature matches ───────────────────────────────────────
        img_matches = cv2.drawMatches(
            prev_gray, kp1,
            gray,      kp2,
            matches[:20], None,
            flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
        )

        # ── Overlay keypoint count on live frame ──────────────────────────────
        cv2.putText(img_matches,
                    f"Matches: {len(matches)}",
                    (10, 25), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 255, 0), 2)

        # ── Overlay position on trajectory canvas ─────────────────────────────
        traj_display = trajectory.copy()
        cv2.putText(traj_display,
                    f"Pos: ({x}, {y})",
                    (10, 20), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (255, 255, 255), 1)
        cv2.circle(traj_display, (x, y), 5, (0, 0, 255), -1)   # current pos in red

        # ── Display windows ───────────────────────────────────────────────────
        cv2.imshow("ORB Feature Matching", img_matches)
        cv2.imshow("Camera Trajectory",    traj_display)

        # ── Slide window: current frame becomes previous ──────────────────────
        kp1, des1  = kp2, des2
        prev_gray  = gray

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ─── Cleanup ──────────────────────────────────────────────────────────────────
cap.release()
cv2.destroyAllWindows()
print("SLAM session ended.")