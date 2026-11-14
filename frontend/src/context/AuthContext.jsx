import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ai_student_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ai_student_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [guestId, setGuestId] = useState(() => {
    let id = localStorage.getItem('ai_student_guest_id');
    if (!id) {
      id = 'std_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('ai_student_guest_id', id);
    }
    return id;
  });

  // Settings
  const [apiKeyOverride, setApiKeyOverride] = useState(() => {
    return localStorage.getItem('ai_student_gemini_key') || '';
  });

  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('ai_student_backend_url') || import.meta.env.VITE_API_URL || '';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('ai_student_gemini_model');
    if (saved && (saved.includes('1.5') || saved.includes('2.0') || saved.includes('pro'))) {
      localStorage.setItem('ai_student_gemini_model', 'gemini-3.8-flash');
      return 'gemini-3.8-flash';
    }
    return saved || 'gemini-3.8-flash';
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('ai_student_token', token);
    } else {
      localStorage.removeItem('ai_student_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ai_student_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ai_student_user');
    }
  }, [user]);

  const saveApiKey = (key) => {
    setApiKeyOverride(key);
    localStorage.setItem('ai_student_gemini_key', key);
  };

  const saveBackendUrl = (url) => {
    const clean = (url || '').trim().replace(/\/+$/, '');
    setBackendUrl(clean);
    if (clean) {
      localStorage.setItem('ai_student_backend_url', clean);
    } else {
      localStorage.removeItem('ai_student_backend_url');
    }
  };

  const saveModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem('ai_student_gemini_model', model);
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ai_student_token');
    localStorage.removeItem('ai_student_user');
  };

  const activeUser = user || {
    name: 'Student Guest',
    email: `student_${guestId.slice(0, 4)}@guest.local`,
    studentMajor: 'Computer Science & Engineering',
    studyGoal: 'Master courses & ace exams',
    isGuest: true,
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user: activeUser,
        isAuthenticated: !!token,
        guestId,
        apiKeyOverride,
        backendUrl,
        selectedModel,
        saveApiKey,
        saveBackendUrl,
        saveModel,
        loginSuccess: handleLoginSuccess,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
