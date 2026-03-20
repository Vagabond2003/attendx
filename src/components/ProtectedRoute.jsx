import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show a full-screen loader while auth state is being determined
  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        gap: '16px'
      }}>
        
        {/* Animated logo */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #4648d4, #6063ee)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(70,72,212,0.35), 0 0 60px rgba(70,72,212,0.2)',
          animation: 'logoPulse 1.5s ease-in-out infinite'
        }}>
          <span className="material-symbols-outlined"
            style={{ color:'white', fontSize:'32px',
                     fontVariationSettings:"'FILL' 1" }}>
            how_to_reg
          </span>
        </div>
        
        <div style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 800, fontSize: '1.1rem',
          color: 'var(--on-surface)', letterSpacing: '-0.02em'
        }}>
          AttendX
        </div>
        
        {/* Shimmer loading bar */}
        <div style={{
          width: '120px', height: '4px',
          borderRadius: '2px', overflow: 'hidden',
          background: 'var(--surface-low)'
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'linear-gradient(90deg, #eff4ff, #4648d4, #eff4ff)',
            backgroundSize: '200% 100%',
            animation: 'loadingBar 1.2s ease-in-out infinite'
          }}/>
        </div>
        
        <style>{`
          @keyframes logoPulse {
            0%,100% { transform: scale(1); box-shadow: 0 12px 32px rgba(70,72,212,.35), 0 0 60px rgba(70,72,212,.2); }
            50% { transform: scale(1.06); box-shadow: 0 18px 48px rgba(70,72,212,.5), 0 0 90px rgba(70,72,212,.3); }
          }
          @keyframes loadingBar {
            from { background-position: 200% 0; }
            to   { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the protected page
  return children;
}
