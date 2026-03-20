import { useState, useEffect } from 'react';
import './Classes.css';
import ClassModal from '../components/ClassModal';

export default function Classes() {
  const [classes, setClasses] = useState([
    {
      id: 1, name: 'Data Structures', code: 'CSE2103',
      teacher: 'Dr. Rahman', color: '#4648d4',
      totalClasses: 18, attended: 15, minimum: 75
    },
    {
      id: 2, name: 'Physics', code: 'PHY1101',
      teacher: 'Prof. Islam', color: '#904900',
      totalClasses: 20, attended: 14, minimum: 75
    },
    {
      id: 3, name: 'Mathematics', code: 'MTH1201',
      teacher: 'Dr. Hossain', color: '#0f766e',
      totalClasses: 16, attended: 13, minimum: 75
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger progress bar animations after mount
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [classes]); // Re-run animation if classes array changes

  const handleSave = (classData) => {
    if (editingClass !== null) {
      setClasses(prev => prev.map(c => 
        c.id === editingClass.id ? { ...c, ...classData } : c
      ));
    } else {
      setClasses(prev => [...prev, {
        ...classData, 
        id: Date.now(),
        totalClasses: 0, 
        attended: 0
      }]);
    }
    setModalOpen(false);
    setEditingClass(null);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setModalOpen(true);
  };

  const handleDelete = (classId) => {
    if (window.confirm('Delete this class? This cannot be undone.')) {
      setClasses(prev => prev.filter(c => c.id !== classId));
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

      {/* CLASS LIST */}
      <div className="classes-list">
        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-circle">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <h3 className="empty-title">No classes yet</h3>
            <p className="empty-subtitle">Tap + to add your first class</p>
          </div>
        ) : (
          classes.map((cls, index) => {
            const pct = cls.totalClasses > 0 
              ? Math.round((cls.attended / cls.totalClasses) * 100) 
              : 0;
            
            let colorKey = 'var(--error)';
            let bgColor = 'var(--error)';
            if (pct >= 75) {
              colorKey = '#14a33c'; 
              bgColor = '#14a33c';
            } else if (pct >= 65) {
              colorKey = '#c96e0a';
              bgColor = '#c96e0a';
            }

            return (
              <div 
                className="class-card" 
                key={cls.id}
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="class-accent-bar" style={{ background: cls.color }}></div>
                <div className="class-card-inner">
                  
                  {/* Top Row */}
                  <div className="class-top-row">
                    <div className="class-info-stack">
                      <h2 className="class-name">{cls.name}</h2>
                      <span className="class-meta">{cls.code} · {cls.teacher}</span>
                    </div>
                    <div className="class-actions">
                      <button className="icon-btn edit-btn" onClick={() => handleEdit(cls)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="icon-btn delete-btn" onClick={() => handleDelete(cls.id)}>
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
                      {cls.attended}/{cls.totalClasses} classes · Min {cls.minimum}%
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
