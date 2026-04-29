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
    <div className="login-wrapper">

      {/* ── Status Modal ── */}
      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '36px 32px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

            {statusModal.type === 'pending' && (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Approval Pending</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '8px' }}>
                  Your <strong style={{ color: '#667eea' }}>{statusModal.role}</strong> account has been created and your email is verified.
                </p>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                  An admin needs to approve your account before you can access the platform. Please check back later.
                </p>
                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#1e40af' }}>
                  📧 You'll be able to log in once an admin approves your request.
                </div>
                <button onClick={() => setStatusModal(null)}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '13px', fontWeight: '700', fontSize: '15px', color: 'white', border: 'none', cursor: 'pointer' }}>
                  OK, Got it
                </button>
              </>
            )}

            {statusModal.type === 'not_registered' && (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🤔</div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Account Not Found</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                  No account found for <strong>{email}</strong>. Would you like to create a new account?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => { setStatusModal(null); navigate('/signup'); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '12px', padding: '13px', fontWeight: '700', fontSize: '15px', color: 'white', border: 'none', cursor: 'pointer' }}>
                    ✨ Create Account
                  </button>
                  <button onClick={() => setStatusModal(null)}
                    style={{ width: '100%', background: '#f1f5f9', borderRadius: '12px', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#374151', border: 'none', cursor: 'pointer' }}>
                    Try Again
                  </button>
                </div>
              </>
            )}

            {statusModal.type === 'invalid' && (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Wrong Credentials</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                  The email or password is incorrect. Double-check and try again, or reset your password.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => setStatusModal(null)}
                    style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '13px', fontWeight: '700', fontSize: '15px', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Try Again
                  </button>
                  <button onClick={() => { setStatusModal(null); handleForgotPassword(); }}
                    style={{ width: '100%', background: '#f1f5f9', borderRadius: '12px', padding: '12px', fontWeight: '600', fontSize: '14px', color: '#374151', border: 'none', cursor: 'pointer' }}>
                    🔑 Reset Password
                  </button>
                  <button onClick={() => { setStatusModal(null); navigate('/signup'); }}
                    style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '4px' }}>
                    Don't have an account? Sign Up
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <div className="login-card">
        <h2 className="login-title">Cloud Quiz System</h2>

        {/* Demo login section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          color: 'white',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', opacity: 0.9 }}>
            🎯 One-click demo login:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DEMO_BUTTONS.map(({ role, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDemoLogin(role)}
                disabled={demoLoading !== null}
                style={{
                  flex: '1',
                  minWidth: '90px',
                  padding: '10px 8px',
                  background: demoLoading === role ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: demoLoading !== null ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {demoLoading === role ? '⏳' : label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', opacity: 0.75, margin: '10px 0 0', textAlign: 'center' }}>
            Accounts are created automatically on first use
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {showResendVerify && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#c2410c' }}>
              <p style={{ margin: '0 0 8px', fontWeight: '600' }}>📧 Email not verified</p>
              <p style={{ margin: '0 0 10px', color: '#9a3412' }}>Check your inbox for the verification link, or resend it.</p>
              <button type="button" onClick={handleResendVerification}
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                🔄 Resend verification email
              </button>
            </div>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary-btn">
            Sign In
          </button>
        </form>

        <div className="forgot-password">
          <span onClick={handleForgotPassword}>Forgot Password?</span>
        </div>

        <div className="divider">OR</div>

        <button onClick={handleGoogleLogin} className="google-btn">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google" />
          Continue with Google
        </button>

        <p className="signup-link">
          Don't have an account?
          <span onClick={() => navigate("/signup")}> Sign Up</span>
        </p>
      </div>
    </div>
  );
}
