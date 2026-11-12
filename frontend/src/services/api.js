const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
      const res = await fetch(`${API_BASE}/chat`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
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
      const res = await fetch(`${API_BASE}/chat/conversations/${id}/clear`, {
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
      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      const token = localStorage.getItem('ai_student_token');
      const guestId = localStorage.getItem('ai_student_guest_id');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (guestId) headers['x-guest-id'] = guestId;

      const res = await fetch(`${API_BASE}/upload/pdf`, {
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
      const res = await fetch(`${API_BASE}/auth/login`, {
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
      const res = await fetch(`${API_BASE}/auth/register`, {
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
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse(res);
    } catch (err) {
      console.error('[API] getHealth failed:', err);
      return { status: 'offline', error: err.message };
    }
  },
};
