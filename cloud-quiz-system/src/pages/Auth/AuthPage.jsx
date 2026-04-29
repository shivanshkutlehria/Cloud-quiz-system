import { useState, useEffect, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { auth, googleProvider, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import "../../styles/auth-animated.css";

/* ─── Demo accounts ─── */
const DEMO_ACCOUNTS = {
  admin:   { email: "admin@quiz.com",   password: "admin123",   role: "admin",   approved: true },
  teacher: { email: "teacher@quiz.com", password: "teacher123", role: "teacher", approved: true },
  student: { email: "student@quiz.com", password: "student123", role: "student", approved: true },
};

/* ─── Floating quiz icons ─── */
const FLOAT_ICONS = ["🧠", "📚", "🏆", "⚡", "🎯", "💡", "🔥", "✨", "🎓", "📊", "🌟", "🎮"];

/* ─── Animated background blobs ─── */
function AnimatedBlobs() {
  return (
    <div className="aq-blobs" aria-hidden="true">
      <div className="aq-blob aq-blob-1" />
      <div className="aq-blob aq-blob-2" />
      <div className="aq-blob aq-blob-3" />
      <div className="aq-blob aq-blob-4" />
    </div>
  );
}

/* ─── Floating particles ─── */
function FloatingParticles() {
  return (
    <div className="aq-particles" aria-hidden="true">
      {FLOAT_ICONS.map((icon, i) => (
        <span
          key={i}
          className="aq-particle"
          style={{
            left: `${8 + (i * 7.5) % 84}%`,
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${6 + (i % 4)}s`,
            fontSize: `${14 + (i % 3) * 6}px`,
            opacity: 0.15 + (i % 3) * 0.08,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

/* ─── Visual panel illustration ─── */
function VisualPanel({ mode }) {
  return (
    <div className="aq-visual-panel">
      <AnimatedBlobs />
      <FloatingParticles />

      <div className="aq-visual-content">
        {/* Logo mark */}
        <div className="aq-logo-mark">
          <span className="aq-logo-icon">☁️</span>
          <span className="aq-logo-text">Cloud Quiz</span>
        </div>

        {/* Central illustration */}
        <div className="aq-illustration">
          <div className="aq-quiz-card aq-quiz-card-1">
            <div className="aq-quiz-card-header">
              <span className="aq-quiz-dot aq-dot-red" />
              <span className="aq-quiz-dot aq-dot-yellow" />
              <span className="aq-quiz-dot aq-dot-green" />
            </div>
            <div className="aq-quiz-line aq-line-long" />
            <div className="aq-quiz-line aq-line-short" />
            <div className="aq-quiz-options">
              <div className="aq-quiz-opt aq-opt-selected">A</div>
              <div className="aq-quiz-opt">B</div>
              <div className="aq-quiz-opt">C</div>
              <div className="aq-quiz-opt">D</div>
            </div>
          </div>

          <div className="aq-quiz-card aq-quiz-card-2">
            <div className="aq-leaderboard-title">🏆 Leaderboard</div>
            {["Alice", "Bob", "You"].map((name, i) => (
              <div key={name} className="aq-lb-row">
                <span className="aq-lb-rank">{i + 1}</span>
                <span className="aq-lb-name">{name}</span>
                <span className="aq-lb-score">{[980, 870, 760][i]}</span>
              </div>
            ))}
          </div>

          <div className="aq-quiz-card aq-quiz-card-3">
            <div className="aq-score-ring">
              <svg viewBox="0 0 80 80" className="aq-ring-svg">
                <circle cx="40" cy="40" r="32" className="aq-ring-bg" />
                <circle cx="40" cy="40" r="32" className="aq-ring-fill" />
              </svg>
              <span className="aq-ring-label">92%</span>
            </div>
            <div className="aq-score-text">Great Score!</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="aq-tagline">
          {mode === "login" ? (
            <>
              <h2 className="aq-tagline-h">Welcome Back! 👋</h2>
              <p className="aq-tagline-p">Continue your learning journey</p>
            </>
          ) : (
            <>
              <h2 className="aq-tagline-h">Join the Quiz! 🚀</h2>
              <p className="aq-tagline-p">Start your learning adventure today</p>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="aq-stats-row">
          {[
            { icon: "👥", val: "10K+", label: "Students" },
            { icon: "📝", val: "500+", label: "Quizzes" },
            { icon: "🏆", val: "98%", label: "Satisfaction" },
          ].map((s) => (
            <div key={s.label} className="aq-stat-item">
              <span className="aq-stat-icon">{s.icon}</span>
              <span className="aq-stat-val">{s.val}</span>
              <span className="aq-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Input with icon ─── */
function IconInput({ icon, error, success, ...props }) {
  return (
    <div className={`aq-input-wrap ${error ? "aq-input-error" : ""} ${success ? "aq-input-success" : ""}`}>
      <span className="aq-input-icon">{icon}</span>
      <input className="aq-input" {...props} />
      {error && <span className="aq-input-feedback aq-feedback-error">✕</span>}
      {success && <span className="aq-input-feedback aq-feedback-success">✓</span>}
    </div>
  );
}

/* ─── Social login buttons ─── */
function SocialButtons({ onGoogle, label = "Continue" }) {
  return (
    <div className="aq-social-row">
      <button type="button" className="aq-social-btn aq-google-btn" onClick={onGoogle}>
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
        <span>{label} with Google</span>
      </button>
    </div>
  );
}

/* ─── Divider ─── */
function Divider() {
  return (
    <div className="aq-divider">
      <span className="aq-divider-line" />
      <span className="aq-divider-text">or</span>
      <span className="aq-divider-line" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LOGIN FORM
══════════════════════════════════════════════════════════ */
function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [shake, setShake] = useState(false);
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();
  const { success, error, info, warning } = useContext(ToastContext);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const redirectByRole = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    const role = userDoc.data()?.role;
    if (role === "admin") navigate("/admin");
    else if (role === "teacher") navigate("/teacher");
    else navigate("/student");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        await auth.signOut();
        triggerShake();
        warning("Please verify your email first. Check your inbox.", 5000);
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      if (!userDoc.exists()) {
        await auth.signOut();
        setModal({ type: "not_registered" });
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      if (!userData.approved) {
        await auth.signOut();
        setModal({ type: "pending", role: userData.role });
        setLoading(false);
        return;
      }

      success("Welcome back! 🎉", 2000);
      const role = userData.role;
      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      triggerShake();
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setModal({ type: "invalid" });
      } else {
        error(err.message, 4000);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, { email: user.email, role: "student", approved: false, createdAt: Date.now() });
      }
      redirectByRole(user.uid);
    } catch (err) {
      error(err.message, 4000);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { info("Enter your email first.", 3000); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      success("Password reset email sent! 📧", 3000);
    } catch (err) {
      error(err.message, 4000);
    }
  };

  const handleDemoLogin = async (role) => {
    const account = DEMO_ACCOUNTS[role];
    setDemoLoading(role);
    try {
      const userCred = await signInWithEmailAndPassword(auth, account.email, account.password);
      const userRef = doc(db, "users", userCred.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { email: account.email, role: account.role, approved: account.approved, createdAt: Date.now() });
      }
      success(`Logged in as ${role}! 🎉`, 2000);
      redirectByRole(userCred.user.uid);
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, account.email, account.password);
          await setDoc(doc(db, "users", newCred.user.uid), { email: account.email, role: account.role, approved: account.approved, createdAt: Date.now() });
          success(`Demo ${role} ready! 🚀`, 2000);
          if (account.role === "admin") navigate("/admin");
          else if (account.role === "teacher") navigate("/teacher");
          else navigate("/student");
        } catch (ce) { error(ce.message, 5000); }
      } else { error(err.message, 4000); }
    } finally { setDemoLoading(null); }
  };

  return (
    <>
      {/* Modal */}
      {modal && (
        <div className="aq-modal-overlay" onClick={() => setModal(null)}>
          <div className="aq-modal" onClick={(e) => e.stopPropagation()}>
            {modal.type === "pending" && (
              <>
                <div className="aq-modal-icon">⏳</div>
                <h3>Approval Pending</h3>
                <p>Your <strong>{modal.role}</strong> account is awaiting admin approval. Check back soon!</p>
                <button className="aq-btn aq-btn-primary" onClick={() => setModal(null)}>Got it</button>
              </>
            )}
            {modal.type === "not_registered" && (
              <>
                <div className="aq-modal-icon">🤔</div>
                <h3>Account Not Found</h3>
                <p>No account found for <strong>{email}</strong>. Want to create one?</p>
                <button className="aq-btn aq-btn-primary" onClick={() => { setModal(null); onSwitch(); }}>Create Account</button>
                <button className="aq-btn aq-btn-ghost" onClick={() => setModal(null)}>Try Again</button>
              </>
            )}
            {modal.type === "invalid" && (
              <>
                <div className="aq-modal-icon">❌</div>
                <h3>Wrong Credentials</h3>
                <p>Email or password is incorrect. Try again or reset your password.</p>
                <button className="aq-btn aq-btn-primary" onClick={() => setModal(null)}>Try Again</button>
                <button className="aq-btn aq-btn-ghost" onClick={() => { setModal(null); handleForgotPassword(); }}>Reset Password</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`aq-form-inner ${shake ? "aq-shake" : ""}`}>
        {/* Header */}
        <div className="aq-form-header">
          <div className="aq-form-badge">Sign In</div>
          <h1 className="aq-form-title">Welcome Back</h1>
          <p className="aq-form-subtitle">Login to continue your Cloud Quiz journey</p>
        </div>

        {/* Demo buttons */}
        <div className="aq-demo-section">
          <div className="aq-demo-label">⚡ One-click demo login</div>
          <div className="aq-demo-btns">
            {[
              { role: "admin",   emoji: "👨‍💼", label: "Admin" },
              { role: "teacher", emoji: "👨‍🏫", label: "Teacher" },
              { role: "student", emoji: "🎓", label: "Student" },
            ].map(({ role, emoji, label }) => (
              <button
                key={role}
                type="button"
                className="aq-demo-btn"
                onClick={() => handleDemoLogin(role)}
                disabled={demoLoading !== null}
              >
                {demoLoading === role ? <span className="aq-spinner-sm" /> : emoji}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Form */}
        <form onSubmit={handleLogin} className="aq-form" noValidate>
          <IconInput
            icon="✉️"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div className="aq-pass-wrap">
            <IconInput
              icon="🔒"
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="aq-pass-toggle"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="aq-forgot-row">
            <button type="button" className="aq-forgot-link" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="aq-btn aq-btn-primary aq-btn-full" disabled={loading}>
            {loading ? <><span className="aq-spinner-sm" /> Signing in...</> : "Sign In →"}
          </button>
        </form>

        <Divider />
        <SocialButtons onGoogle={handleGoogleLogin} label="Sign in" />

        <p className="aq-switch-text">
          Don't have an account?{" "}
          <button type="button" className="aq-switch-link" onClick={onSwitch}>
            Create one
          </button>
        </p>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   SIGNUP FORM
══════════════════════════════════════════════════════════ */
const ROLES = [
  { key: "student", label: "🎓 Student", desc: "Take quizzes & learn", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "#10b981" },
  { key: "teacher", label: "👨‍🏫 Teacher", desc: "Create & manage quizzes", color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "#6366f1" },
];

function SignupForm({ onSwitch }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const navigate = useNavigate();
  const { success, error, warning } = useContext(ToastContext);

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const pwColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const pwLabels = ["", "Too short", "Weak", "Good", "Strong"];

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
      if (err.code === "auth/email-already-in-use") {
        error("This email is already registered. Try logging in.", 4000);
      } else { error(err.message, 4000); }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!createdUser) return;
    setResending(true);
    try {
      await sendEmailVerification(createdUser);
      success("Verification email resent! 📬", 3000);
    } catch { error("Could not resend. Try again in a minute.", 3000); }
    finally { setResending(false); }
  };

  const handleCancel = async () => {
    if (createdUser) { try { await deleteUser(createdUser); } catch {} }
    setStep(1); setCreatedUser(null);
  };

  /* Step 2 — email verification waiting */
  if (step === 2) {
    return (
      <div className="aq-form-inner aq-verify-screen">
        <div className="aq-verify-icon">📧</div>
        <h2 className="aq-form-title" style={{ fontSize: "22px" }}>Verify your email</h2>
        <p className="aq-form-subtitle">
          We sent a link to <strong style={{ color: "#e879f9" }}>{email}</strong>
        </p>

        <div className="aq-verify-steps">
          {["Open the email we sent you", "Click the verification link", "Come back and log in", "Wait for admin approval"].map((s, i) => (
            <div key={i} className="aq-verify-step">
              <div className="aq-verify-num">{i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="aq-verify-actions">
          <button className="aq-btn aq-btn-primary aq-btn-full" onClick={() => navigate("/")}>
            Go to Login →
          </button>
          <button className="aq-btn aq-btn-outline aq-btn-full" onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "🔄 Resend email"}
          </button>
          <button className="aq-btn aq-btn-ghost" onClick={handleCancel}>
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  /* Step 1 — signup form */
  return (
    <div className="aq-form-inner">
      <div className="aq-form-header">
        <div className="aq-form-badge aq-badge-signup">Sign Up</div>
        <h1 className="aq-form-title">Create Account</h1>
        <p className="aq-form-subtitle">Join Cloud Quiz — verify email + admin approval required</p>
      </div>

      {/* Role selector */}
      <div className="aq-role-selector">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`aq-role-btn ${role === r.key ? "aq-role-active" : ""}`}
            style={role === r.key ? { borderColor: r.color, background: r.bg, color: r.color } : {}}
            onClick={() => setRole(r.key)}
          >
            <span className="aq-role-label">{r.label}</span>
            <span className="aq-role-desc">{r.desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSignup} className="aq-form" noValidate>
        <IconInput icon="👤" type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <IconInput icon="✉️" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

        <div className="aq-pass-wrap">
          <IconInput
            icon="🔒"
            type={showPass ? "text" : "password"}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button type="button" className="aq-pass-toggle" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Password strength */}
        {password.length > 0 && (
          <div className="aq-pw-strength">
            <div className="aq-pw-bars">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aq-pw-bar"
                  style={{ background: pwStrength >= i ? pwColors[pwStrength] : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </div>
            <span className="aq-pw-label" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
          </div>
        )}

        <IconInput
          icon="🔑"
          type={showPass ? "text" : "password"}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={confirm.length > 0 && confirm !== password}
          success={confirm.length > 0 && confirm === password}
          autoComplete="new-password"
        />
        {confirm.length > 0 && confirm !== password && (
          <p className="aq-field-error">Passwords do not match</p>
        )}

        <button
          type="submit"
          className="aq-btn aq-btn-primary aq-btn-full"
          disabled={loading || (confirm.length > 0 && confirm !== password)}
          style={{ marginTop: "4px" }}
        >
          {loading ? <><span className="aq-spinner-sm" /> Creating account...</> : `Create ${role === "teacher" ? "Teacher" : "Student"} Account →`}
        </button>
      </form>

      <p className="aq-switch-text" style={{ marginTop: "16px" }}>
        Already have an account?{" "}
        <button type="button" className="aq-switch-link" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN AUTH PAGE
══════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial mode from route
  const [mode, setMode] = useState(location.pathname === "/signup" ? "signup" : "login");
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Stagger mount animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Sync mode with URL
  useEffect(() => {
    setMode(location.pathname === "/signup" ? "signup" : "login");
  }, [location.pathname]);

  const switchMode = () => {
    if (animating) return;
    setAnimating(true);
    const next = mode === "login" ? "signup" : "login";
    setTimeout(() => {
      setMode(next);
      navigate(next === "signup" ? "/signup" : "/");
      setAnimating(false);
    }, 350);
  };

  const isLogin = mode === "login";

  return (
    <div className={`aq-root ${mounted ? "aq-mounted" : ""}`}>
      {/* Global background gradient */}
      <div className="aq-bg-gradient" aria-hidden="true" />

      <div className={`aq-container ${isLogin ? "aq-login-layout" : "aq-signup-layout"}`}>

        {/* ── Form panel ── */}
        <div className={`aq-panel aq-form-panel ${animating ? "aq-panel-exit" : "aq-panel-enter"}`}>
          <div className="aq-form-scroll">
            {isLogin
              ? <LoginForm onSwitch={switchMode} />
              : <SignupForm onSwitch={switchMode} />
            }
          </div>
        </div>

        {/* ── Visual panel ── */}
        <div className={`aq-panel aq-right-panel ${animating ? "aq-panel-exit" : "aq-panel-enter"}`}>
          <VisualPanel mode={mode} />
        </div>

      </div>
    </div>
  );
}
