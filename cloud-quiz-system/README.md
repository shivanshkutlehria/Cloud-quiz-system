# ☁️ CloudQuiz — AI-Powered Quiz & Learning Management System

A full-stack web application for educational institutions to manage quizzes, syllabi, and student performance — with AI quiz generation, real-time camera proctoring, and an AI tutor built in.

**Live Stack:** React + Vite (Vercel) · Node.js/Express (Render) · Firebase (Auth + Firestore) · Groq LLaMA 3.3-70B · TensorFlow.js BlazeFace

---

## Live Link: https://cloud-quiz-systemmm.vercel.app/

## Table of Contents

1. [Quick Start](#quick-start)
2. [Demo Credentials](#demo-credentials)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [API Reference](#api-reference)
7. [AI Monitoring](#ai-monitoring)
8. [Camera Troubleshooting](#camera-troubleshooting)
9. [Deployment](#deployment)
10. [Roadmap](#roadmap)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project (Auth + Firestore enabled)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & install

```bash
git clone <repo-url>
cd cloud-quiz-system
npm install
cd backend && npm install && cd ..
```

### 2. Configure frontend

Create `.env` in the root:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Update `src/firebase/firebase.js` with your Firebase project config.

### 3. Configure backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
GROQ_API_KEY=gsk_...
PORT=5000
FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> Get Firebase Admin credentials: Firebase Console → Project Settings → Service Accounts → Generate new private key

### 4. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
npm run dev
```

---

## Demo Credentials

One-click demo login buttons are on the login page. Accounts are created automatically on first use.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 👨‍💼 Admin | `admin@quiz.com` | `admin123` | Full system — approve users, manage roles, analytics |
| 👨‍🏫 Teacher | `teacher@quiz.com` | `teacher123` | Create quizzes, upload syllabus, view reports |
| 🎓 Student | `student@quiz.com` | `student123` | Take quizzes, AI tutor, goals, study groups |

> ⚠️ Change these credentials before any production deployment.

---

## Features

### 👨‍💼 Admin
- Approve/reject student registrations, promote users to teacher
- Bulk user management (approve/delete multiple at once)
- System-wide announcements (info / warning / urgent)
- Flagged attempt review with AI detection logs
- Analytics: user breakdown, score distribution, teacher performance

### 👨‍🏫 Teacher
- Create subjects with syllabus upload (text, image, PDF, DOCX)
- AI parses syllabus → auto-creates structured units and topics
- Generate 3–30 MCQs from syllabus using Groq LLaMA 3.3-70B
- Review AI-generated draft questions before publishing
- Set quiz deadlines — expired quizzes auto-block students
- View per-student analytics, confidence analysis, reported questions
- Real-time chat inbox for student messages

### 🎓 Student
- Browse subjects, view syllabus, take quizzes
- Live camera proctoring during quiz attempts
- Confidence tracking (Sure / Guess) per answer
- Report problematic questions with reason
- Post-quiz: full answer explanations + AI Tutor chat
- Personal analytics, goal setting, achievement badges
- Daily streak, level system (Beginner → Legend)
- Study groups with real-time chat
- Direct messaging to teachers

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Vercel)                       │
│         React 19 + Vite + TensorFlow.js (BlazeFace)      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS REST API
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Render)                        │
│              Node.js + Express.js                        │
│    /api/ai    /api/syllabus    /api/subjects              │
│         └──── Groq LLaMA 3.3-70B ────┘                  │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼────────────────┐
│  Firebase Firestore  │   │   Firebase Authentication   │
└─────────────────────┘   └─────────────────────────────┘
```

### Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Profiles, roles, approval status |
| `quizzes` | Quiz metadata (title, topic, duration, deadline) |
| `quizzes/{id}/questions` | Published MCQs |
| `quizzes/{id}/ai_drafts` | AI-generated pending questions |
| `attempts` | Student submissions with AI detection logs |
| `subjects` | Subject/course data with syllabus |
| `subjects/{id}/units` | Structured syllabus units |
| `messages` | Teacher-student direct messages |
| `studyGroups` | Group metadata |
| `studyGroups/{id}/messages` | Group chat |
| `studentGoals` | Personal learning goals |
| `tutor_interactions` | AI tutor chat logs |
| `announcements` | Admin announcements |

---

## Tech Stack

### Frontend
| Package | Purpose |
|---------|---------|
| React 19 + Vite | UI framework + build tool |
| React Router v7 | Client-side routing |
| Framer Motion | Animations |
| React Icons | Icon library |
| React CountUp | Animated number counters |
| TensorFlow.js + BlazeFace | In-browser face detection |
| Firebase SDK | Auth + Firestore client |

### Backend
| Package | Purpose |
|---------|---------|
| Express.js | Web framework |
| Firebase Admin SDK | Server-side Firestore (bypasses security rules) |
| Groq SDK | LLaMA 3.3-70B API |
| pdf-parse | PDF text extraction |
| JSZip | DOCX text extraction |
| Multer | File upload handling |
| express-rate-limit | Rate limiting for AI endpoints |

---

## API Reference

### AI — `/api/ai`

| Method | Endpoint | Role | Description |
|--------|---------|------|-------------|
| POST | `/generate-quiz` | Teacher | Generate MCQs from syllabus text |
| POST | `/publish-all` | Teacher | Bulk publish all draft questions |
| POST | `/publish-question` | Teacher | Publish single draft question |
| DELETE | `/reject-question` | Teacher | Reject a draft question |
| GET | `/drafts/:quizId` | Teacher | Get pending draft questions |
| POST | `/tutor` | Student | Ask AI tutor a question |
| POST | `/adaptive-next` | Student | Get adaptive difficulty suggestion |

### Syllabus — `/api/syllabus`

| Method | Endpoint | Role | Description |
|--------|---------|------|-------------|
| POST | `/parse-text` | Teacher | Parse plain text syllabus |
| POST | `/parse-image` | Teacher | Extract text from image |
| POST | `/parse-document` | Teacher | Extract text from PDF/DOCX/TXT |

### Subjects — `/api/subjects`

| Method | Endpoint | Role | Description |
|--------|---------|------|-------------|
| GET | `/` | Teacher | Get teacher's subjects |
| GET | `/all` | Any | Get all subjects |
| POST | `/` | Teacher | Create subject |
| DELETE | `/:id` | Teacher | Delete subject |
| GET | `/:id/detail` | Any | Get subject + units + quizzes |
| POST | `/:id/units` | Teacher | Add unit |
| PUT | `/:id/units/:uid` | Teacher | Update unit |
| DELETE | `/:id/units/:uid` | Teacher | Delete unit |

---

## AI Monitoring

The quiz attempt page uses **TensorFlow.js + BlazeFace** for real-time camera proctoring.

### What it detects

| Event | Trigger | Action |
|-------|---------|--------|
| No face | Student not visible | Log + alert |
| Multiple faces | More than 1 person | Log + immediate alert |
| Head movement | Face moves >150px | Log |
| Tab switch | Window loses focus | Log + count |
| Copy attempt | Right-click / Ctrl+C | Block + log |
| Auto-submit | 10 incidents reached | Force submit |

### Detection runs every 5 seconds. All events are saved to the `attempts` document in Firestore for teacher review.

### Adjusting sensitivity

In `src/utils/aiMonitoring.js`:
```js
// Movement threshold (default 150px — increase to reduce sensitivity)
if (distance > 150) { ... }
```

In `src/pages/Student/QuizAttempt.jsx`:
```js
// Detection interval (default 5000ms)
setInterval(performFaceDetection, 5000);
```

### Fallback mode
If TensorFlow fails to load, the system continues with tab-switch and copy detection only. No quiz blocking occurs.

### Privacy
- Video is processed **locally in the browser** — no video is sent to the server
- Only detection metadata (timestamps, counts, reasons) is stored
- No facial recognition or identity matching

---

## Camera Troubleshooting

### Black screen / no video

1. **Check permissions** — click the lock icon in the address bar → set Camera to Allow → refresh
2. **Check if camera is in use** — close other apps (Zoom, Teams, etc.)
3. **Test in browser console:**
```js
navigator.mediaDevices.getUserMedia({ video: true })
  .then(s => { console.log('✅ Camera works'); s.getTracks().forEach(t => t.stop()); })
  .catch(e => console.error('❌', e.name, e.message));
```

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NotAllowedError` | Permission denied | Grant camera permission in browser settings |
| `NotFoundError` | No camera detected | Connect/enable camera |
| `NotReadableError` | Camera in use by another app | Close other apps using camera |

### Requirements
- HTTPS (or localhost) — camera API requires a secure context
- Chrome 53+, Firefox 36+, Safari 11+, Edge 79+
- iOS 11+ for Safari on iPhone/iPad

### Still not working?
Try: different browser → restart browser → test camera in another app → check antivirus blocking camera → try incognito mode

---

## Deployment

### Frontend — Vercel

```bash
npm run build
# Deploy dist/ folder to Vercel
# Set environment variable: VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Backend — Render

1. Connect your GitHub repo to Render
2. Set root directory to `backend/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables from `backend/.env`

### Firebase

- Enable **Email/Password** and **Google** authentication
- Create Firestore database in production mode
- Deploy security rules: `firebase deploy --only firestore:rules`

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + D` | Toggle dark mode |
| `Esc` | Close modals |
| Arrow keys | Navigate quiz questions |

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Video recording during exam for post-review
- [ ] YOLO object detection (phone/book detection)
- [ ] Multi-language support
- [ ] LMS integration (Google Classroom, Moodle)
- [ ] Offline quiz mode with sync
- [ ] Email notifications for deadlines
- [ ] Blockchain certificates

---

## License

MIT — free to use for educational purposes.
