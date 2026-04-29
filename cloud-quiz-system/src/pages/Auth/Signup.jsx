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

const ROLES = [
  {
    key: 'student',
    label: '🎓 Student',
    desc: 'Take quizzes, track progress, learn with AI',
    color: '#10b981',
    bg: '#dcfce7',
    border: '#86efac',
  },
  {
    key: 'teacher',
    label: '👨‍🏫 Teacher',
    desc: 'Create quizzes, upload syllabus, manage classes',
    color: '#3b82f6',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
];

export default function Signup() {
  const [step, setStep]         = useState(1); // 1=form, 2=verify email
  const [role, setRole]         = useState('student');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const navigate = useNavigate();
  const { success, error, warning, info } = useContext(ToastContext);

  /* ── Step 1: Create account + send verification email ── */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      warning('Password must be at least 6 characters.', 3000);
      return;
    }
    if (password !== confirm) {
      warning('Passwords do not match.', 3000);
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Send verification email
      await sendEmailVerification(userCred.user, {
        url: `${window.location.origin}/`,  // redirect after verification
        handleCodeInApp: false,
      });

      // Save user to Firestore (not approved yet, email not verified)
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email,
        name: name.trim(),
        role,
        approved: false,
        emailVerified: false,
        createdAt: Date.now(),
      });

      setCreatedUser(userCred.user);
      setStep(2);
      success('Verification email sent! Check your inbox.', 4000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        error('This email is already registered. Try logging in.', 4000);
      } else {
        error(err.message, 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend verification email ── */
  const handleResend = async () => {
    if (!createdUser) return;
    setResending(true);
    try {
      await sendEmailVerification(createdUser);
      success('Verification email resent!', 3000);
    } catch (err) {
      error('Could not resend. Try again in a minute.', 3000);
    } finally {
      setResending(false);
    }
  };

  /* ── Cancel signup — delete the unverified account ── */
  const handleCancel = async () => {
    if (createdUser) {
      try { await deleteUser(createdUser); } catch {}
    }
    setStep(1);
    setCreatedUser(null);
  };

  const selectedRole = ROLES.find(r => r.key === role);

  /* ══════════════ STEP 2: Email verification waiting screen ══════════════ */
  if (step === 2) {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ maxWidth: '460px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Verify your email
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            We sent a verification link to<br />
            <strong style={{ color: '#0f172a' }}>{email}</strong>
          </p>

          {/* Steps */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            {[
              { n: '1', text: 'Open the email we sent you' },
              { n: '2', text: 'Click the verification link' },
              { n: '3', text: 'Come back and log in' },
              { n: '4', text: 'Wait for admin approval to access the platform' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 3 ? '12px' : '0' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>{s.n}</div>
                <span style={{ fontSize: '14px', color: '#374151' }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Role badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: selectedRole?.bg, border: `1px solid ${selectedRole?.border}`, marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: selectedRole?.color }}>
              Registered as: {selectedRole?.label}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '13px', fontWeight: '700', fontSize: '15px' }}
            >
              Go to Login →
            </button>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: '#f1f5f9', color: '#374151', borderRadius: '12px', padding: '12px', fontWeight: '600', fontSize: '14px', opacity: resending ? 0.6 : 1 }}
            >
              {resending ? '⏳ Sending...' : '🔄 Resend verification email'}
            </button>
            <button
              onClick={handleCancel}
              style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '8px' }}
            >
              ← Use a different email
            </button>
          </div>

          <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
            Didn't receive it? Check your spam folder. The link expires in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════ STEP 1: Signup form ══════════════ */
  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>Create Account</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Join CloudQuiz — verify email + admin approval required</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">

          {/* Role selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
              I am signing up as: *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  style={{
                    padding: '14px 12px', borderRadius: '14px',
                    border: `2px solid ${role === r.key ? r.color : '#e2e8f0'}`,
                    background: role === r.key ? r.bg : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    boxShadow: role === r.key ? `0 0 0 3px ${r.color}20` : 'none',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '14px', color: role === r.key ? r.color : '#374151', marginBottom: '3px' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Agastya Vashisht"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email Address *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8', padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: password.length >= i * 2 + 2 ? (password.length >= 10 ? '#10b981' : password.length >= 6 ? '#f59e0b' : '#ef4444') : '#e2e8f0', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: password.length >= 10 ? '#10b981' : password.length >= 6 ? '#f59e0b' : '#ef4444' }}>
                  {password.length >= 10 ? 'Strong' : password.length >= 6 ? 'Medium' : 'Too short'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Confirm Password *</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', borderColor: confirm && confirm !== password ? '#ef4444' : undefined }}
            />
            {confirm && confirm !== password && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirm && confirm !== password)}
            className="primary-btn"
            style={{ marginTop: '4px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Creating account...' : `Create ${role === 'teacher' ? 'Teacher' : 'Student'} Account →`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/')}
            style={{ background: 'transparent', color: '#667eea', fontWeight: '600', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>
            Login
          </button>
        </div>

        {/* Info box */}
        <div style={{ marginTop: '20px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>
          <div style={{ fontWeight: '700', marginBottom: '6px', color: '#0f172a' }}>📋 How it works:</div>
          <div>1. Create account → verify email</div>
          <div>2. Admin reviews and approves your account</div>
          <div>3. You get full access to the platform</div>
        </div>
      </div>
    </div>
  );
}
