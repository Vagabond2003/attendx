import { useState, useEffect } from 'react';
import './Classes.css';
import ClassModal from '../components/ClassModal';
import { useClasses } from '../hooks/useClasses';

export default function Classes() {
  const {
    classes, loading, error,
    handleAdd, handleUpdate, handleDelete
  } = useClasses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger progress bar animations after mount
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [classes]); // Re-run animation if classes array changes

  const getPct = (cls) => {
    const total = cls.total_classes || cls.totalClasses || 0;
    const attended = cls.attended_classes || cls.attended || 0;
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  };

  const handleSave = async (classData) => {
    if (editingClass !== null) {
      await handleUpdate(editingClass.id, classData);
    } else {
      await handleAdd(classData);
    }
    setModalOpen(false);
    setEditingClass(null);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setModalOpen(true);
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Delete this class? This cannot be undone.')) {
      await handleDelete(classId);
    }
  };

  return (
    <div className="classes-wrapper">
      
      {/* HEADER CARD */}
      <div className="classes-header card-in-first">
        <div className="header-blob"></div>
        <div className="session-badge">
          <div className="pulse-dot"></div>
          {classes.length} Subject{classes.length !== 1 ? 's' : ''}
        </div>
        <h1 className="header-title">My Classes</h1>
        <p className="header-subtitle">Manage your enrolled courses</p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div style={{
          background: 'rgba(186,26,26,0.07)',
          border: '1px solid rgba(186,26,26,0.15)',
          borderRadius: '14px', padding: '12px 16px',
          color: 'var(--error)', fontSize: '0.82rem',
          marginBottom: '16px'
        }}>
          Failed to load classes: {error}. Pull to refresh.
        </div>
      )}

      {/* CLASS LIST */}
      <div className="classes-list">
        {loading ? (
           <>
             {[1, 2, 3].map(i => (
               <div key={i} style={{
                 height: '120px', borderRadius: '24px',
                 background: 'linear-gradient(90deg, #e8eeff 25%, #f0f4ff 50%, #e8eeff 75%)',
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 1.5s infinite',
                 marginBottom: '12px'
               }}></div>
             ))}
           </>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-circle">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <h3 className="empty-title">No classes yet</h3>
            <p className="empty-subtitle">Tap + to add your first class</p>
          </div>
        ) : (
          classes.map((cls, index) => {
            const pct = getPct(cls);
            const total = cls.total_classes || cls.totalClasses || 0;
            const attended = cls.attended_classes || cls.attended || 0;
            const minimum = cls.minimum_attendance || cls.minimum || 75;
            
            let colorKey = 'var(--error)';
            let bgColor = 'var(--error)';
            if (pct >= minimum) {
              colorKey = '#14a33c'; 
              bgColor = '#14a33c';
            } else if (pct >= minimum - 10) {
              colorKey = '#c96e0a';
              bgColor = '#c96e0a';
            }

            return (
              <div 
                className="class-card card-in-first" 
                key={cls.id}
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="class-accent-bar" style={{ background: cls.color || '#6366f1' }}></div>
                <div className="class-card-inner">
                  
                  {/* Top Row */}
                  <div className="class-top-row">
                    <div className="class-info-stack">
                      <h2 className="class-name">{cls.name}</h2>
                      <span className="class-meta">{cls.code || ''} {cls.code && cls.teacher ? '·' : ''} {cls.teacher || ''}</span>
                    </div>
                    <div className="class-actions">
                      <button className="icon-btn edit-btn" onClick={() => handleEdit(cls)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="icon-btn delete-btn" onClick={() => handleDeleteClass(cls.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row - Progress */}
                  <div className="class-progress-section">
                    <div className="progress-top">
                      <span className="progress-pct" style={{ color: colorKey }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: animated ? `${pct}%` : '0%',
                          background: bgColor
                        }}
                      ></div>
                    </div>
                    <span className="progress-meta">
                      {attended}/{total} classes · Min {minimum}%
                    </span>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ADD BUTTON */}
      <button 
        className="fab-add" 
        onClick={() => {
          setEditingClass(null);
          setModalOpen(true);
        }}
        aria-label="Add class"
      >
        <div className="btn-shimmer"></div>
        <span className="material-symbols-outlined">add</span>
      </button>

      {/* EDIT MODAL */}
      <ClassModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingClass={editingClass}
      />
    </div>
  );
}
