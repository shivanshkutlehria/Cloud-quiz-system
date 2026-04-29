import { useState, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import "../../styles/login-split.css";

const ROLES = [
  { key: "student", label: "🎓 Student", desc: "Take quizzes & track progress", color: "#10b981", border: "rgba(16,185,129,0.4)", bg: "rgba(16,185,129,0.08)" },
  { key: "teacher", label: "👨‍🏫 Teacher", desc: "Create quizzes & manage classes", color: "#667eea", border: "rgba(102,126,234,0.4)", bg: "rgba(102,126,234,0.08)" },
];

export default function Signup() {
  const [step, setStep]           = useState(1);
  const [role, setRole]           = useState("student");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const navigate = useNavigate();
  const { success, error, warning } = useContext(ToastContext);

  const pwLen = password.length;
  const pwStrength = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : pwLen < 14 ? 3 : 4;
  const pwColor  = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][pwStrength];
  const pwLabel  = ["", "Too short", "Weak", "Good", "Strong"][pwStrength];

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) { warning("Password must be at least 6 characters.", 3000); return; }
    if (password !== confirm) { warning("Passwords do not match.", 3000); return; }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user, { url: `${window.location.origin}/`, handleCodeInApp: false });
      await setDoc(doc(db, "users", userCred.user.uid), {
        email, name: name.trim(), role, approved: false, emailVerified: false, createdAt: Date.now(),
      });
      setCreatedUser(userCred.user);
      setStep(2);
      success("Verification email sent! Check your inbox. 📧", 4000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") error("This email is already registered. Try logging in.", 4000);
      else error(err.message, 4000);
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!createdUser) return;
    setResending(true);
    try { await sendEmailVerification(createdUser); success("Verification email resent! 📬", 3000); }
    catch { error("Could not resend. Try again in a minute.", 3000); }
    finally { setResending(false); }
  };

  const handleCancel = async () => {
    if (createdUser) { try { await deleteUser(createdUser); } catch {} }
    setStep(1); setCreatedUser(null);
  };

  /* ── Shared left panel ── */
  const LeftPanel = () => (
    <div className="ls-left">
      <video className="ls-lock-video" autoPlay loop muted playsInline>
        <source src="/lock-animation.mp4" type="video/mp4" />
      </video>
      <div className="ls-left-content">
        <div className="ls-brand">
          <span className="ls-brand-icon">☁️</span>
          <span className="ls-brand-name">Cloud Quiz</span>
        </div>
        <h2 className="ls-left-title">
          {step === 2 ? "Almost There! 🎉" : "Join the\nCommunity 🚀"}
        </h2>
        <p className="ls-left-sub">
          {step === 2
            ? "Just verify your email and wait for admin approval."
            : "Create your account and start your learning journey today."}
        </p>
      </div>
    </div>
  );

  /* ══════════════ STEP 2: Email verification ══════════════ */
  if (step === 2) {
    return (
      <div className="ls-root">
        <video className="ls-bg-video" autoPlay loop muted playsInline>
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>
        <div className="ls-bg-overlay" />
        <div className="ls-card">
          <LeftPanel />
          <div className="ls-right">
            <div className="ls-form-wrap" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px", animation: "ls-float 3s ease-in-out infinite" }}>📧</div>
              <h1 className="ls-form-title">Verify your email</h1>
              <p className="ls-form-sub" style={{ marginBottom: "28px" }}>
                We sent a link to <strong style={{ color: "#a78bfa" }}>{email}</strong>
              </p>

              {/* Steps */}
              <div className="ls-verify-steps">
                {[
                  "Open the email we sent you",
                  "Click the verification link",
                  "Come back and log in",
                  "Wait for admin approval",
                ].map((s, i) => (
                  <div key={i} className="ls-verify-step">
                    <div className="ls-verify-num">{i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                <button className="ls-submit-btn" onClick={() => navigate("/")}>
                  Go to Login →
                </button>
                <button
                  className="ls-google-btn"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ marginBottom: 0 }}
                >
                  {resending ? "Sending..." : "🔄 Resend verification email"}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ background: "transparent", border: "none", color: "#475569", fontSize: "13px", cursor: "pointer", padding: "8px", fontFamily: "inherit" }}
                >
                  ← Use a different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════ STEP 1: Signup form ══════════════ */
  return (
    <div className="ls-root">
      <video className="ls-bg-video" autoPlay loop muted playsInline>
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="ls-bg-overlay" />

      <div className="ls-card">
        <LeftPanel />

        <div className="ls-right">
          <div className="ls-form-wrap">

            <div className="ls-form-header">
              <h1 className="ls-form-title">Create Account ✨</h1>
              <p className="ls-form-sub">Email verification + admin approval required</p>
            </div>

            {/* Role selector */}
            <div className="ls-role-row">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className="ls-role-btn"
                  onClick={() => setRole(r.key)}
                  style={role === r.key
                    ? { borderColor: r.border, background: r.bg, color: r.color }
                    : {}}
                >
                  <span className="ls-role-label">{r.label}</span>
                  <span className="ls-role-desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSignup} className="ls-form" noValidate>
              {/* Name */}
              <div className="ls-field">
                <span className="ls-field-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="ls-input"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="ls-field">
                <span className="ls-field-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="ls-input"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="ls-field">
                <span className="ls-field-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="ls-input"
                  style={{ paddingRight: "44px" }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="ls-eye-btn"
                  aria-label="Toggle password"
                >
                  {showPass
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {/* Password strength */}
              {pwLen > 0 && (
                <div className="ls-pw-strength">
                  <div className="ls-pw-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="ls-pw-bar" style={{ background: pwStrength >= i ? pwColor : "#1e293b" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: pwColor, fontWeight: 600 }}>{pwLabel}</span>
                </div>
              )}

              {/* Confirm password */}
              <div className="ls-field">
                <span className="ls-field-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="ls-input"
                  style={{ borderColor: confirm && confirm !== password ? "#ef4444" : undefined }}
                  autoComplete="new-password"
                />
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "-4px" }}>Passwords do not match</p>
              )}

              <button
                type="submit"
                className="ls-submit-btn"
                disabled={loading || (confirm.length > 0 && confirm !== password)}
                style={{ marginTop: "4px", opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? <><span className="ls-spinner" /> Creating account...</>
                  : `Create ${role === "teacher" ? "Teacher" : "Student"} Account →`}
              </button>
            </form>

            <p className="ls-switch" style={{ marginTop: "20px" }}>
              Already have an account?{" "}
              <span onClick={() => navigate("/")} className="ls-switch-link">Sign In</span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
