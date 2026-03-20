import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    // On success, Supabase redirects automatically
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-blob blob-1"></div>
      <div className="auth-blob blob-2"></div>

      <div className="auth-card">
        {/* LOGO + BRANDING */}
        <div className="auth-logo-mark">
          <span className="material-symbols-outlined logo-icon">how_to_reg</span>
        </div>
        <h1 className="auth-app-name">AttendX</h1>
        <p className="auth-tagline">Track. Attend. Succeed.</p>

        {/* FORM */}
        <form onSubmit={handleLogin}>
          {error && (
            <div className="auth-error-msg">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

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
                placeholder="Enter your password" 
                autoComplete="current-password"
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
                Sign In
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="auth-divider">
          <div className="auth-line"></div>
          <span className="auth-or-text">or</span>
          <div className="auth-line"></div>
        </div>

        {/* GOOGLE BUTTON */}
        <button type="button" className="auth-google-btn" onClick={handleGoogle}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* REGISTER LINK */}
        <div className="auth-footer-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
