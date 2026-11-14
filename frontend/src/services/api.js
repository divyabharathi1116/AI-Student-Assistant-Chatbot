export const getApiBase = () => {
  // 1. Check custom runtime backend URL stored in localStorage (e.g. configured via SettingsModal)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('ai_student_backend_url');
    if (customUrl && typeof customUrl === 'string' && customUrl.trim().length > 0) {
      const clean = customUrl.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }

  // 2. Check environment variable VITE_API_URL provided at build or run time
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 3. In development or reverse proxy setups, use relative '/api'
  return '/api';
};

const getHeaders = () => {
  const token = localStorage.getItem('ai_student_token');
  const guestId = localStorage.getItem('ai_student_guest_id');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (guestId) {
    headers['x-guest-id'] = guestId;
  }

  return headers;
};

// Safe JSON parser that prevents "Unexpected end of JSON input" errors
const handleResponse = async (res) => {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (readErr) {
    throw new Error('Connection closed prematurely by the server. Please check that the backend is running.');
  }

  let data = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // If response is not JSON (e.g. plain text or HTML error page), format cleanly
      data = { error: rawText.replace(/<[^>]*>/g, '').trim() || `Server error (${res.status}: ${res.statusText})` };
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 405) {
      throw new Error(
        `HTTP 405 Method Not Allowed received from ${res.url}. The request was sent to a static host instead of the Express backend. Please ensure VITE_API_URL is configured in your deployment environment or set your Backend URL in Settings.`
      );
    }
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status} (${res.statusText})`;
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  async sendMessage({
    message,
    conversationId,
    studyMode,
    pdfContext,
    pdfName,
    imageData,
    imageMimeType,
    imageName,
    apiKeyOverride,
  }) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message,
          conversationId,
          studyMode,
          pdfContext,
          pdfName,
          imageData,
          imageMimeType,
          imageName,
          apiKeyOverride,
        }),
      });

      return await handleResponse(res);
    } catch (err) {
      console.error('[API] sendMessage failed:', err);
      throw err;
    }
  },

  async getConversations() {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.conversations || [];
    } catch (err) {
      console.error('[API] getConversations failed:', err);
      return [];
    }
  },

  async getConversation(id) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations/${id}`, {
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] getConversation failed:', err);
      throw err;
    }
  },

  async createConversation(title = 'New Academic Chat', studyMode = 'academic') {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, studyMode }),
      });
      const data = await handleResponse(res);
      return data.conversation;
    } catch (err) {
      console.error('[API] createConversation failed:', err);
      throw err;
    }
  },

  async renameConversation(id, title) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title }),
      });
      const data = await handleResponse(res);
      return data.conversation;
    } catch (err) {
      console.error('[API] renameConversation failed:', err);
      throw err;
    }
  },

  async deleteConversation(id) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] deleteConversation failed:', err);
      throw err;
    }
  },

  async clearConversation(id) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/chat/conversations/${id}/clear`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] clearConversation failed:', err);
      throw err;
    }
  },

  async uploadPdf(file) {
    try {
      const baseUrl = getApiBase();
      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      const token = localStorage.getItem('ai_student_token');
      const guestId = localStorage.getItem('ai_student_guest_id');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (guestId) headers['x-guest-id'] = guestId;

      const res = await fetch(`${baseUrl}/upload/pdf`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await handleResponse(res);
    } catch (err) {
      console.error('[API] uploadPdf failed:', err);
      throw err;
    }
  },

  async login(email, password) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] login failed:', err);
      throw err;
    }
  },

  async register(details) {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] register failed:', err);
      throw err;
    }
  },

  async getHealth() {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/health`);
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] getHealth failed:', err);
      return { status: 'offline', error: err.message };
    }
  },
};
