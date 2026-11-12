import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB, isMongoConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and production
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter for general safety (150 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please slow down and try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'AI Student Assistant',
    database: isMongoConnected() ? 'MongoDB (Connected)' : 'Local File Store (Active)',
    geminiKeyConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    timestamp: new Date().toISOString(),
  });
});

// Root friendly route
app.get('/', (req, res) => {
  res.send('AI Student Assistant Backend API is running.');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected internal server error occurred.',
    });
  }
});

// Guard against unhandled process-level rejections to prevent crashing
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection Caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception Caught]:', err);
});

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 AI Student Assistant Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat Endpoint: POST http://localhost:${PORT}/api/chat`);
    console.log(`📂 PDF Upload:    POST http://localhost:${PORT}/api/upload/pdf`);
    console.log(`===============================================`);
  });
};

export { app, startServer };

// Auto start if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}
