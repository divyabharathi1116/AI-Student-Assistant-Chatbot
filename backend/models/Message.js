import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    studyMode: {
      type: String,
      default: 'academic',
    },
    hasPdfContext: {
      type: Boolean,
      default: false,
    },
    pdfName: {
      type: String,
      default: '',
    },
    hasImage: {
      type: Boolean,
      default: false,
    },
    imageData: {
      type: String,
      default: '',
    },
    imageName: {
      type: String,
      default: '',
    },
    imageMimeType: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Message =
  mongoose.models.Message || mongoose.model('Message', MessageSchema);
