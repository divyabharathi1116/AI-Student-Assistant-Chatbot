import React from 'react';
import {
  Menu,
  Moon,
  Sun,
  Trash2,
  Settings,
  Sparkles,
  User,
  GraduationCap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Header = ({
  currentConversation,
  studyMode,
  onToggleSidebar,
  onClearChat,
  onOpenSettings,
  onOpenAuth,
  hasMessages,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const getModeTitle = (mode) => {
    switch (mode) {
      case 'concept':
        return '💡 Concept Explainer';
      case 'code':
        return '💻 Code Tutor';
      case 'exam':
        return '🎯 Exam Prep';
      case 'timetable':
        return '📅 Timetable Planner';
      case 'pdf':
        return '📄 PDF Document Tutor';
      default:
        return '📚 Academic Assistant';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-btn-ghost"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          style={{ padding: '0.4rem' }}
        >
          <Menu size={20} />
        </button>

        <div className="header-title-container">
          <span className="header-title">
            {currentConversation ? currentConversation.title : 'AI Student Assistant'}
          </span>
          <span className="header-mode-badge">{getModeTitle(studyMode)}</span>
        </div>
      </div>

      <div className="header-right">
        {hasMessages && (
          <button
            className="header-action-btn"
            onClick={onClearChat}
            title="Clear Chat History"
          >
            <Trash2 size={15} color="#ef4444" />
            <span>Clear Chat</span>
          </button>
        )}

        <button
          className="header-action-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="header-action-btn"
          onClick={onOpenSettings}
          title="Assistant Settings & API Key"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <button
          className="header-action-btn"
          onClick={onOpenAuth}
          style={{
            background: isAuthenticated ? 'var(--accent-blue-light)' : 'var(--bg-tertiary)',
            color: isAuthenticated ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}
          title={isAuthenticated ? 'Student Account' : 'Sign In / Register'}
        >
          {isAuthenticated ? <GraduationCap size={16} /> : <User size={16} />}
          <span>{isAuthenticated ? user.name.split(' ')[0] : 'Sign In'}</span>
        </button>
      </div>
    </header>
  );
};
