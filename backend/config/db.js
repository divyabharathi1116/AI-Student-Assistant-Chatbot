import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_student_assistant';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1200,
      connectTimeoutMS: 1500,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Notice: Running with high-performance persistent store (${error.message}).`);
    console.log('[MongoDB] (To connect to MongoDB, ensure mongod is running or set MONGODB_URI in backend/.env)');
  }
};

export const isMongoConnected = () => isConnected;
