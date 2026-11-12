import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected } from '../config/db.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder and store file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let memoryCache = null;

const getLocalData = () => {
  if (memoryCache) return memoryCache;
  if (!fs.existsSync(STORE_FILE)) {
    const initial = { users: [], conversations: [], messages: [] };
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2));
    } catch (e) {
      console.error('[StoreService] Init error:', e.message);
    }
    memoryCache = initial;
    return initial;
  }
  try {
    memoryCache = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
    return memoryCache;
  } catch (e) {
    memoryCache = { users: [], conversations: [], messages: [] };
    return memoryCache;
  }
};

const saveLocalData = (data) => {
  memoryCache = data;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[StoreService] Save error:', err.message);
  }
};

export const storeService = {
  // USER METHODS
  async findUserByEmail(email) {
    if (isMongoConnected()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    const data = getLocalData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isMongoConnected()) {
      return await User.findById(id).select('-password');
    }
    const data = getLocalData();
    const user = data.users.find((u) => u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ name, email, password, studentMajor, studyGoal }) {
    if (isMongoConnected()) {
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password,
        studentMajor: studentMajor || 'Computer Science & Engineering',
        studyGoal: studyGoal || 'Excel in academics and exams',
      });
      return await newUser.save();
    }
    const data = getLocalData();
    const newUser = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name,
      email: email.toLowerCase(),
      password,
      studentMajor: studentMajor || 'Computer Science & Engineering',
      studyGoal: studyGoal || 'Excel in academics and exams',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    saveLocalData(data);
    return newUser;
  },

  // CONVERSATION METHODS
  async createConversation({ userId, title = 'New Academic Chat', studyMode = 'academic' }) {
    if (isMongoConnected()) {
      const conv = new Conversation({ userId, title, studyMode });
      return await conv.save();
    }
    const data = getLocalData();
    const newConv = {
      _id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      userId,
      title,
      studyMode,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.conversations.unshift(newConv);
    saveLocalData(data);
    return newConv;
  },

  async getConversations(userId) {
    if (isMongoConnected()) {
      return await Conversation.find({ userId }).sort({ updatedAt: -1 });
    }
    const data = getLocalData();
    return data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getConversationById(id, userId) {
    if (isMongoConnected()) {
      return await Conversation.findOne({ _id: id, userId });
    }
    const data = getLocalData();
    return data.conversations.find((c) => c._id === id && c.userId === userId) || null;
  },

  async updateConversation(id, userId, updates) {
    if (isMongoConnected()) {
      return await Conversation.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    }
    const data = getLocalData();
    const idx = data.conversations.findIndex((c) => c._id === id && c.userId === userId);
    if (idx === -1) return null;
    data.conversations[idx] = {
      ...data.conversations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalData(data);
    return data.conversations[idx];
  },

  async deleteConversation(id, userId) {
    if (isMongoConnected()) {
      await Conversation.deleteOne({ _id: id, userId });
      await Message.deleteMany({ conversationId: id });
      return true;
    }
    const data = getLocalData();
    data.conversations = data.conversations.filter(
      (c) => !(c._id === id && c.userId === userId)
    );
    data.messages = data.messages.filter((m) => m.conversationId !== id);
    saveLocalData(data);
    return true;
  },

  // MESSAGE METHODS
  async addMessage({
    conversationId,
    role,
    content,
    studyMode = 'academic',
    hasPdfContext = false,
    pdfName = '',
    hasImage = false,
    imageData = '',
    imageName = '',
    imageMimeType = '',
  }) {
    if (isMongoConnected()) {
      const msg = new Message({
        conversationId,
        role,
        content,
        studyMode,
        hasPdfContext,
        pdfName,
        hasImage,
        imageData,
        imageName,
        imageMimeType,
      });
      const saved = await msg.save();
      await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
      return saved;
    }
    const data = getLocalData();
    const newMsg = {
      _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      conversationId,
      role,
      content,
      studyMode,
      hasPdfContext,
      pdfName,
      hasImage,
      imageData,
      imageName,
      imageMimeType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.messages.push(newMsg);

    const conv = data.conversations.find((c) => c._id === conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    saveLocalData(data);
    return newMsg;
  },

  async getMessages(conversationId) {
    if (isMongoConnected()) {
      return await Message.find({ conversationId }).sort({ createdAt: 1 });
    }
    const data = getLocalData();
    return data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async clearMessages(conversationId) {
    if (isMongoConnected()) {
      await Message.deleteMany({ conversationId });
      return true;
    }
    const data = getLocalData();
    data.messages = data.messages.filter((m) => m.conversationId !== conversationId);
    saveLocalData(data);
    return true;
  },
};
