import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

const navTabs = [
  { icon: 'dashboard',   path: '/dashboard',  label: 'Home' },
  { icon: 'menu_book',   path: '/classes',    label: 'Classes' },
  { icon: 'how_to_reg',  path: '/attendance', label: 'Attend' },
  { icon: 'bar_chart',   path: '/stats',      label: 'Stats' },
  { icon: 'timer',       path: '/study',      label: 'Study' },
];

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef(null);
  const menuRef = useRef(null);

  const { user, signOut } = useAuth();
  
  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.email
    || 'User';
  
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        avatarRef.current && !avatarRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // TODO: Replace with real user data from auth context
  // userInitial completely removed in place of active user attributes

  return (
    <div className="layout-shell">
      {/* ── STICKY TOP HEADER ── */}
      <header className="top-header">
        <span className="app-name">AttendX</span>
        <div className="avatar-wrapper">
          <button
            ref={avatarRef}
            className="avatar-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="User menu"
          >
            {avatarLetter}
          </button>

          {menuOpen && (
            <div ref={menuRef} className="avatar-menu">
              <button className="menu-item" onClick={() => setMenuOpen(false)}>
                <span className="material-symbols-outlined">person</span>
                Profile
              </button>
              <button className="menu-item menu-item--danger" onClick={async () => {
                setMenuOpen(false);
                await signOut();
              }}>
                <span className="material-symbols-outlined">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT ── */}
      <main className="content-area">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* ── FIXED BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {navTabs.map((tab) => (
          <NavLink key={tab.path} to={tab.path} className="nav-link-reset">
            {({ isActive }) => (
              <div className={`tab${isActive ? ' active' : ''}`}>
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
