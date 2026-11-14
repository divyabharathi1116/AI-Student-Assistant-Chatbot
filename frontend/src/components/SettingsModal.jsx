import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Server,
  Globe,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getApiBase } from '../services/api';

export const SettingsModal = ({ isOpen, onClose, onShowToast }) => {
  const { apiKeyOverride, saveApiKey, backendUrl, saveBackendUrl, selectedModel, saveModel } = useAuth();
  const [keyInput, setKeyInput] = useState(apiKeyOverride || '');
  const [urlInput, setUrlInput] = useState(backendUrl || '');
  const [modelInput, setModelInput] = useState(selectedModel || 'gemini-3.8-flash');
  const [showKey, setShowKey] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyInput(apiKeyOverride || '');
      setUrlInput(backendUrl || '');
      setModelInput(selectedModel || 'gemini-3.8-flash');
      checkHealth();
    }
  }, [isOpen, apiKeyOverride, backendUrl, selectedModel]);

  const checkHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const data = await api.getHealth();
      setBackendHealth(data);
    } catch (err) {
      setBackendHealth({ status: 'offline', error: err.message });
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(keyInput.trim());
    saveBackendUrl(urlInput.trim());
    saveModel(modelInput);
    if (onShowToast) onShowToast('Settings saved successfully!');
    onClose();
  };

  if (!isOpen) return null;

  const currentApiBase = getApiBase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} color="var(--accent-purple)" />
            <h2 className="modal-title">Settings & AI Configuration</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Backend Server URL */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Server size={14} />
                <span>Backend API Server URL</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Active: <code>{currentApiBase}</code>
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%' }}
              placeholder="e.g. https://your-backend.onrender.com or http://localhost:5000"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <span className="form-hint">
              Leave blank to use default <code>/api</code> (or <code>VITE_API_URL</code>). In production, set to your deployed Express backend URL.
            </span>
          </div>

          {/* Gemini API Key */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={14} />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  textDecoration: 'none',
                }}
              >
                <span>Get Free Key</span>
                <ExternalLink size={11} />
              </a>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem' }}
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button
                type="button"
                className="icon-btn-ghost"
                style={{ position: 'absolute', right: '0.5rem' }}
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="form-hint">
              Can also be securely configured in <code>backend/.env</code> as <code>GEMINI_API_KEY</code>.
            </span>
          </div>

          {/* Model Selection */}
          <div className="form-group">
            <label className="form-label">Gemini Model</label>
            <select
              className="form-select"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Fastest, High-Quality - Recommended)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            </select>
          </div>

          {/* System Health Status */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>System Diagnostics</div>
              <button
                type="button"
                onClick={checkHealth}
                className="icon-btn-ghost"
                style={{ padding: '2px 6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                title="Test backend connection"
              >
                <RefreshCw size={11} className={isLoadingHealth ? 'spin' : ''} />
                <span>Test Connection</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Database Status:</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>
                {backendHealth?.database || (isLoadingHealth ? 'Checking...' : 'Active')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Backend Status:</span>
              <span
                style={{
                  color: backendHealth?.status === 'online' ? '#10b981' : '#ef4444',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {backendHealth?.status === 'online' ? (
                  <>
                    <CheckCircle2 size={13} /> Online ({backendHealth?.appName || 'Connected'})
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} /> {isLoadingHealth ? 'Connecting...' : 'Unreachable'}
                  </>
                )}
              </span>
            </div>

            {backendHealth?.geminiKeyConfigured !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Server Gemini Key:</span>
                <span style={{ color: backendHealth.geminiKeyConfigured ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                  {backendHealth.geminiKeyConfigured ? 'Configured on Server' : 'Not Set in backend/.env'}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
};
