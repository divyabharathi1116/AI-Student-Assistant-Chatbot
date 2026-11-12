import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Academic Chat',
      trim: true,
    },
    studyMode: {
      type: String,
      enum: ['academic', 'concept', 'code', 'exam', 'timetable', 'pdf'],
      default: 'academic',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
