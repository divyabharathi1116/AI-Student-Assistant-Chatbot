import React, { useState } from 'react';
import { X, GraduationCap, Lock, Mail, User, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthModal = ({ isOpen, onClose, onShowToast }) => {
  const { loginSuccess } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentMajor, setStudentMajor] = useState('Computer Science & Engineering');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const data = await api.login(email.trim(), password);
        loginSuccess(data.token, data.user);
        if (onShowToast) onShowToast(`Welcome back, ${data.user.name}!`);
        onClose();
      } else {
        const data = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          studentMajor,
        });
        loginSuccess(data.token, data.user);
        if (onShowToast) onShowToast(`Account created! Welcome, ${data.user.name}!`);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={22} color="var(--accent-purple)" />
            <h2 className="modal-title">Student Portal</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setTab('signup');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.8rem',
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Student Email</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Major / Field of Study</label>
              <select
                className="form-select"
                value={studentMajor}
                onChange={(e) => setStudentMajor(e.target.value)}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Data Science & Artificial Intelligence">Data Science & AI</option>
                <option value="Electrical & Electronics Engineering">Electrical Engineering</option>
                <option value="Mechanical & Civil Engineering">Mechanical / Civil Engineering</option>
                <option value="Mathematics & Physics">Mathematics & Physics</option>
                <option value="Business Administration & Finance">Business & Finance</option>
                <option value="Medicine & Biology">Medicine & Biology</option>
                <option value="General Studies">General Studies</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : tab === 'login' ? (
              'Sign In to Assistant'
            ) : (
              'Create Student Profile'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {tab === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <a
                href="#signup"
                style={{ color: 'var(--accent-blue)', fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault();
                  setTab('signup');
                }}
              >
                Sign Up
              </a>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <a
                href="#login"
                style={{ color: 'var(--accent-blue)', fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault();
                  setTab('login');
                }}
              >
                Sign In
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
