import express from 'express';
import { uploadPdf, uploadMiddleware } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/pdf', (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error uploading file' });
    }
    next();
  });
}, uploadPdf);

export default router;
