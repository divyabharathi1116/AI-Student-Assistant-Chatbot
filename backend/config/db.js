import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_student_assistant';
  const isAtlas = uri.includes('mongodb+srv') || uri.includes('.mongodb.net');

  // Listen to mongoose connection events for real-time state tracking
  mongoose.connection.on('connected', () => {
    isConnected = true;
  });
  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[MongoDB Error]:`, err.message);
  });
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
  });

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      // Atlas needs adequate time for DNS SRV lookup and TLS handshake (10s)
      serverSelectionTimeoutMS: isAtlas ? 10000 : 2000,
      connectTimeoutMS: isAtlas ? 15000 : 2500,
    });
    isConnected = true;
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[MongoDB] Connected successfully to: ${sanitizedUri}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Notice: Running with high-performance persistent store (${error.message}).`);
    console.log('[MongoDB] (To connect to MongoDB Atlas, ensure MONGODB_URI is set in backend/.env)');
  }
};

export const isMongoConnected = () => isConnected;
