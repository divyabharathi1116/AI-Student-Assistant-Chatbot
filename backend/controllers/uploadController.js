import multer from 'multer';
import { extractTextFromPdfBuffer } from '../services/pdfService.js';

// Setup multer memory storage
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'));
    }
  },
});

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a valid PDF file.' });
    }

    const { originalname, size, buffer } = req.file;

    const parsed = await extractTextFromPdfBuffer(buffer);

    // Limit extracted text to first 30,000 characters to fit Gemini context comfortably
    const maxChars = 30000;
    const truncated = parsed.text.length > maxChars;
    const safeText = parsed.text.slice(0, maxChars);

    res.json({
      message: 'PDF processed successfully!',
      file: {
        name: originalname,
        size: (size / (1024 * 1024)).toFixed(2) + ' MB',
        pages: parsed.pages,
        preview: parsed.preview,
        truncated,
      },
      extractedText: safeText,
    });
  } catch (error) {
    console.error('[UploadPdf] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to extract text from the uploaded PDF document.',
    });
  }
};
