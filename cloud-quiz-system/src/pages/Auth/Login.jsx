import { useState, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, googleProvider, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import "../../styles/login-split.css";

// Demo accounts config
const DEMO_ACCOUNTS = {
  admin:   { email: 'admin@quiz.com',   password: 'admin123',   role: 'admin',   approved: true },
  teacher: { email: 'teacher@quiz.com', password: 'teacher123', role: 'teacher', approved: true },
  student: { email: 'student@quiz.com', password: 'student123', role: 'student', approved: true },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoLoading, setDemoLoading] = useState(null);
  const [showResendVerify, setShowResendVerify] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // { type: 'pending'|'not_registered', role?, name? }
  const navigate = useNavigate();
  const { success, error, info, warning } = useContext(ToastContext);

  const redirectByRole = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    const role = userDoc.data()?.role;
    if (role === "admin") navigate("/admin");
    else if (role === "teacher") navigate("/teacher");
    else navigate("/student");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      // Block login if email not verified
      if (!userCred.user.emailVerified) {
        await auth.signOut();
        setShowResendVerify(true);
        warning('Please verify your email first. Check your inbox for the verification link.', 5000);
        return;
      }

      // Check Firestore for approval status
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));

      if (!userDoc.exists()) {
        // Signed in via Firebase Auth but no Firestore record
        await auth.signOut();
        setStatusModal({ type: 'not_registered' });
        return;
      }

      const userData = userDoc.data();

      if (!userData.approved) {
        // Account exists but admin hasn't approved yet
        await auth.signOut();
        setStatusModal({ type: 'pending', role: userData.role, name: userData.name });
        return;
      }

      // All good — redirect
      const role = userData.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else navigate('/student');

    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        // Check if email exists in Firestore but wrong password
        setStatusModal({ type: 'invalid' });
      } else {
        error(err.message, 4000);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const existingUser = await getDoc(userRef);
      if (!existingUser.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: "student",
          approved: false,
          createdAt: Date.now(),
        });
      }
      redirectByRole(user.uid);
    } catch (err) {
      error(err.message, 4000);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      info("Enter your email first.", 3000);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      success("Password reset email sent!", 3000);
    } catch (err) {
      error(err.message, 4000);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) { info('Enter your email and password first.', 3000); return; }
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await auth.signOut();
      success('Verification email resent! Check your inbox.', 4000);
      setShowResendVerify(false);
    } catch (err) {
      error(err.message, 4000);
    }
  };

  /**
   * One-click demo login:
   * 1. Try to sign in directly
   * 2. If account doesn't exist (invalid-credential), create it + Firestore doc, then sign in
   */
  const handleDemoLogin = async (role) => {
    const account = DEMO_ACCOUNTS[role];
    setDemoLoading(role);

    try {
      // Try signing in first
      const userCred = await signInWithEmailAndPassword(auth, account.email, account.password);

      // Make sure Firestore doc exists with correct role
      const userRef = doc(db, "users", userCred.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: account.email,
          role: account.role,
          approved: account.approved,
          createdAt: Date.now(),
        });
      }

      success(`Logged in as ${role}!`, 2000);
      redirectByRole(userCred.user.uid);

    } catch (err) {
      // Account doesn't exist yet — create it automatically
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
          info(`Creating demo ${role} account...`, 2000);

          const newCred = await createUserWithEmailAndPassword(auth, account.email, account.password);

          // Save role to Firestore
          await setDoc(doc(db, "users", newCred.user.uid), {
            email: account.email,
            role: account.role,
            approved: account.approved,
            createdAt: Date.now(),
          });

          success(`Demo ${role} account created! Logging in...`, 2000);

          // Navigate based on role
          if (account.role === 'admin') navigate('/admin');
          else if (account.role === 'teacher') navigate('/teacher');
          else navigate('/student');

        } catch (createErr) {
          error('Failed to create demo account: ' + createErr.message, 5000);
        }
      } else {
        error(err.message, 4000);
      }
    } finally {
      setDemoLoading(null);
    }
  };

  const DEMO_BUTTONS = [
    { role: 'admin',   label: '👨‍💼 Admin',   desc: 'admin@quiz.com' },
    { role: 'teacher', label: '👨‍🏫 Teacher', desc: 'teacher@quiz.com' },
    { role: 'student', label: '👨‍🎓 Student', desc: 'student@quiz.com' },
  ];

  return (
    <div className="ls-root">

      {/* ════════════════════════════════════
          FULLSCREEN BG VIDEO (behind everything)
      ════════════════════════════════════ */}
      <video className="ls-bg-video" autoPlay loop muted playsInline>
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="ls-bg-overlay" />

      {/* ════════════════════════════════════
          STATUS MODAL
      ════════════════════════════════════ */}
      {statusModal && (
        <div className="ls-modal-backdrop" onClick={() => setStatusModal(null)}>
          <div className="ls-modal" onClick={e => e.stopPropagation()}>
            {statusModal.type === 'pending' && (<>
              <div className="ls-modal-icon">⏳</div>
              <h3>Approval Pending</h3>
              <p>Your <strong>{statusModal.role}</strong> account is awaiting admin approval. Check back soon.</p>
              <button className="ls-modal-btn-primary" onClick={() => setStatusModal(null)}>Got it</button>
            </>)}
            {statusModal.type === 'not_registered' && (<>
              <div className="ls-modal-icon">🤔</div>
              <h3>Account Not Found</h3>
              <p>No account for <strong>{email}</strong>. Want to create one?</p>
              <button className="ls-modal-btn-primary" onClick={() => { setStatusModal(null); navigate('/signup'); }}>✨ Create Account</button>
              <button className="ls-modal-btn-ghost" onClick={() => setStatusModal(null)}>Try Again</button>
            </>)}
            {statusModal.type === 'invalid' && (<>
              <div className="ls-modal-icon">❌</div>
              <h3>Wrong Credentials</h3>
              <p>Email or password is incorrect. Try again or reset your password.</p>
              <button className="ls-modal-btn-primary" onClick={() => setStatusModal(null)}>Try Again</button>
              <button className="ls-modal-btn-ghost" onClick={() => { setStatusModal(null); handleForgotPassword(); }}>🔑 Reset Password</button>
            </>)}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          SPLIT CARD
      ════════════════════════════════════ */}
      <div className="ls-card">

        {/* ── LEFT PANEL — lock animation video ── */}
        <div className="ls-left">
          <video className="ls-lock-video" autoPlay loop muted playsInline>
            <source src="/lock-animation.mp4" type="video/mp4" />
          </video>
          <div className="ls-left-content">
            <div className="ls-brand">
              <span className="ls-brand-icon">☁️</span>
              <span className="ls-brand-name">Cloud Quiz</span>
            </div>
            <h2 className="ls-left-title">Secure &amp; Smart<br />Learning Platform</h2>
            <p className="ls-left-sub">Test your knowledge, track progress,<br />and grow every day.</p>
          </div>
        </div>

        {/* ── RIGHT PANEL — login form ── */}
        <div className="ls-right">
          <div className="ls-form-wrap">

            {/* Header */}
            <div className="ls-form-header">
              <h1 className="ls-form-title">Welcome Back 👋</h1>
              <p className="ls-form-sub">Login to continue your Cloud Quiz journey</p>
            </div>

            {/* Demo buttons */}
            <div className="ls-demo-box">
              <p className="ls-demo-label">⚡ One-click demo login</p>
              <div className="ls-demo-btns">
                {DEMO_BUTTONS.map(({ role, label }) => (
                  <button
                    key={role}
                    type="button"
                    className={`ls-demo-btn${demoLoading === role ? ' ls-demo-btn--loading' : ''}`}
                    onClick={() => handleDemoLogin(role)}
                    disabled={demoLoading !== null}
                  >
                    {demoLoading === role ? <span className="ls-spinner" /> : label}
                  </button>
                ))}
              </div>
              <p className="ls-demo-note">Accounts created automatically on first use</p>
            </div>

            {/* Divider */}
            <div className="ls-divider"><span>or sign in manually</span></div>

            {/* Email not verified banner */}
            {showResendVerify && (
              <div className="ls-warn-banner">
                <p>📧 <strong>Email not verified.</strong> Check your inbox.</p>
                <button type="button" onClick={handleResendVerification} className="ls-warn-btn">
                  🔄 Resend email
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="ls-form" noValidate>
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
                  autoComplete="email"
                  className="ls-input"
                />
              </div>
              <div className="ls-field">
                <span className="ls-field-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="ls-input"
                />
              </div>

              <div className="ls-forgot-row">
                <button type="button" className="ls-forgot" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="ls-submit-btn">
                Sign In →
              </button>
            </form>

            {/* Google */}
            <button onClick={handleGoogleLogin} className="ls-google-btn">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
              Continue with Google
            </button>

            {/* Switch to signup */}
            <p className="ls-switch">
              Don't have an account?{' '}
              <span onClick={() => navigate('/signup')} className="ls-switch-link">Sign Up</span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
