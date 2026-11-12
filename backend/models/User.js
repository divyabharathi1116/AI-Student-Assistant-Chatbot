import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    studentMajor: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    studyGoal: {
      type: String,
      default: 'Master key concepts & excel in exams',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
