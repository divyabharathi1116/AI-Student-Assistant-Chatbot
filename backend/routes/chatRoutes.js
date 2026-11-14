import express from 'express';
import {
  sendMessage,
  getConversations,
  getConversation,
  createConversation,
  renameConversation,
  deleteConversation,
  clearConversation,
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Ensure OPTIONS preflight passes without authentication delay
router.options('*', (req, res) => res.sendStatus(204));

router.use(authMiddleware);

// Handle POST /api/chat with or without trailing slash
router.post('/', sendMessage);
router.post('', sendMessage);

// Conversations endpoints
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.patch('/conversations/:id', renameConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/conversations/:id/clear', clearConversation);

export default router;
