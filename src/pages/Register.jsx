import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Register.css'; // We will share the visual styles mostly from Login but isolate the import

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth();
  
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-blob blob-1"></div>
      <div className="auth-blob blob-2"></div>

      <div className="auth-card">
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="success-icon-circle">
              <span className="material-symbols-outlined">mark_email_read</span>
            </div>
            <h2 className="success-title">Check your email!</h2>
            <p className="success-body">We sent a confirmation link to</p>
            <div className="success-email-chip">{email}</div>
            <p className="success-note">Click the link in the email to activate your account.</p>
            
            <Link to="/login" className="link-btn-cancel">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-logo-mark">
              <span className="material-symbols-outlined logo-icon">how_to_reg</span>
            </div>
            <h1 className="auth-app-name">AttendX</h1>
            <p className="auth-tagline">Track. Attend. Succeed.</p>

            <form onSubmit={handleRegister}>
              {error && (
                <div className="auth-error-msg">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="auth-field-group">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">person</span>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="Your full name" 
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">mail</span>
                  <input 
                    type="email" 
                    className="auth-input" 
                    placeholder="your@email.com" 
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">lock</span>
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="auth-input" 
                    placeholder="Min. 6 characters" 
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus={false}
                    required
                  />
                  <button 
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <span className="material-symbols-outlined auth-input-icon">lock_reset</span>
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="auth-input" 
                    placeholder="Repeat your password" 
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoFocus={false}
                    required
                  />
                </div>
                {confirm !== '' && confirm !== password && (
                  <span className="auth-error-hint">Passwords don't match</span>
                )}
              </div>

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.85 : 1 }}
              >
                {loading ? (
                  <div className="auth-spinner"></div>
                ) : (
                  <>
                    Create Account
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <div className="auth-line"></div>
              <span className="auth-or-text">or</span>
              <div className="auth-line"></div>
            </div>

            <button type="button" className="auth-google-btn" onClick={handleGoogle}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-footer-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
