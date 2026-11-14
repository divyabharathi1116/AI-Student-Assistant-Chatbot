import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { connectDB, isMongoConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env first, then fallback to current directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Student Assistant Backend is running'
  });
});
const PORT = process.env.PORT || 5000;

// Parse allowed CORS origins from environment
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((u) => u.trim().replace(/\/+$/, '')));

const allowedOrigins = [...new Set(rawOrigins)];

// Configure CORS correctly for deployed frontend domain & local development
// Crucial: When credentials: true, Access-Control-Allow-Origin cannot be '*' in browsers.
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) with no origin
    if (!origin) return callback(null, true);

    // If wildcard '*' is explicitly set in CORS_ORIGIN or development mode, reflect origin
    if (
      process.env.CORS_ORIGIN === '*' ||
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.some((allowed) => origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, '')))
    ) {
      return callback(null, origin);
    }

    // Default: allow and reflect origin to avoid breaking deployed client interfaces
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-guest-id',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Fast-path preflight middleware to ensure OPTIONS never returns 405 or 404
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter for general safety (300 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
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
    corsOrigins: allowedOrigins,
    environment: process.env.NODE_ENV || 'development',
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
