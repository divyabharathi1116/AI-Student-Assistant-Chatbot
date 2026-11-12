import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Code2,
  GraduationCap,
  Calendar,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  LogOut,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODES = [
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'concept', label: 'Concept Explainer', icon: Lightbulb },
  { id: 'code', label: 'Code Tutor', icon: Code2 },
  { id: 'exam', label: 'Exam Prep', icon: GraduationCap },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
];

export const Sidebar = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  studyMode,
  setStudyMode,
  onOpenSettings,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const saveRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {isOpen && <div className="mobile-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => onNewChat()}>
            <div className="brand-icon">
              <GraduationCap size={22} />
            </div>
            <div className="brand-info">
              <div className="brand-title">
                AI Student
                <span className="brand-badge">PRO</span>
              </div>
              <div className="brand-subtitle">Academic & Code Copilot</div>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <button className="new-chat-btn" onClick={() => onNewChat()}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Study Mode Filter */}
        <div className="sidebar-modes-section">
          <div className="section-label">Study Modes</div>
          <div className="modes-grid">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = studyMode === mode.id;
              return (
                <div
                  key={mode.id}
                  className={`mode-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setStudyMode(mode.id)}
                >
                  <Icon size={13} />
                  <span>{mode.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat History Section */}
        <div className="sidebar-history-container">
          <div className="section-label">
            <span>Recent Chats</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {conversations.length}
            </span>
          </div>

          {conversations.length === 0 ? (
            <div
              style={{
                padding: '1.5rem 0.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              <MessageSquare
                size={28}
                style={{ opacity: 0.35, margin: '0 auto 0.5rem auto' }}
              />
              <p>No chat history yet.</p>
              <p style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                Ask a question to start learning!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = currentConversationId === conv._id;
              const isEditing = editingId === conv._id;

              return (
                <div
                  key={conv._id}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv._id)}
                >
                  {isEditing ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        width: '100%',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.4rem',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--accent-blue)',
                          borderRadius: '4px',
                          outline: 'none',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(conv._id, e);
                          if (e.key === 'Escape') cancelRename(e);
                        }}
                      />
                      <button
                        className="icon-btn-ghost"
                        onClick={(e) => saveRename(conv._id, e)}
                        title="Save"
                      >
                        <Check size={14} color="#10b981" />
                      </button>
                      <button
                        className="icon-btn-ghost"
                        onClick={cancelRename}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="history-title">
                        <MessageSquare size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
                        <span title={conv.title}>{conv.title}</span>
                      </div>

                      <div className="history-actions">
                        <button
                          className="icon-btn-ghost"
                          onClick={(e) => startEditing(conv, e)}
                          title="Rename chat"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="icon-btn-ghost danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv._id);
                          }}
                          title="Delete chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area: User Profile & Settings */}
        <div className="sidebar-footer">
          <div className="user-profile-card" onClick={onOpenAuth}>
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-major">{user.studentMajor}</div>
            </div>
            {isAuthenticated ? (
              <button
                className="icon-btn-ghost danger"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                }}
              >
                Login
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
