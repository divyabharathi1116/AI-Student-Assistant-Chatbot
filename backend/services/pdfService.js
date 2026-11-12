import pdfParse from 'pdf-parse';

/**
 * Fallback parser for corrupted or non-standard PDF streams
 */
const fallbackExtractText = (buffer) => {
  try {
    const raw = buffer.toString('latin1');
    const matches = raw.match(/\(([^)]+)\)\s*Tj/g) || [];
    const textPieces = matches.map((m) => {
      const inner = m.match(/\(([^)]+)\)\s*Tj/);
      return inner ? inner[1] : '';
    });

    if (textPieces.length > 0) {
      const combined = textPieces.join(' ');
      return {
        success: true,
        pages: 1,
        info: {},
        text: combined,
        preview: combined.slice(0, 300) + (combined.length > 300 ? '...' : ''),
      };
    }
  } catch (e) {
    // ignore fallback failure
  }
  return null;
};

export const extractTextFromPdfBuffer = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const cleanedText = (data.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      success: true,
      pages: data.numpages || 1,
      info: data.info || {},
      text: cleanedText,
      preview: cleanedText.slice(0, 300) + (cleanedText.length > 300 ? '...' : ''),
    };
  } catch (error) {
    console.warn('[PDF Parser] Standard parser encountered issue:', error.message);
    const fallback = fallbackExtractText(buffer);
    if (fallback && fallback.text.trim()) {
      return fallback;
    }
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};
