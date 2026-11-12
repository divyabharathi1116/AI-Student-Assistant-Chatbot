import { storeService } from '../services/storeService.js';
import { generateGeminiResponse } from '../services/geminiService.js';

export const sendMessage = async (req, res) => {
  try {
    const {
      message = '',
      conversationId: existingConversationId,
      studyMode = 'academic',
      pdfContext = '',
      pdfName = '',
      imageData = '',
      imageMimeType = '',
      imageName = '',
      apiKeyOverride = null,
    } = req.body;

    const userId = req.userId;
    const hasImage = !!(imageData && typeof imageData === 'string' && imageData.trim().length > 0);
    const rawText = typeof message === 'string' ? message.trim() : '';

    if (!rawText && !hasImage && !pdfContext) {
      return res.status(400).json({ error: 'Please enter a message, question, or attach an image/document.' });
    }

    let conversationId = existingConversationId;

    // Display text for message history
    const userDisplayContent = rawText || (imageName ? `📷 Image Analysis: ${imageName}` : '📷 [Uploaded Image for Analysis]');

    // Create a new conversation if not provided or doesn't exist
    if (!conversationId) {
      let title = '';
      if (rawText) {
        const cleanPrompt = rawText.replace(/\n/g, ' ');
        title = cleanPrompt.length > 40 ? cleanPrompt.substring(0, 37) + '...' : cleanPrompt;
      } else if (imageName) {
        title = `Image: ${imageName.length > 30 ? imageName.substring(0, 27) + '...' : imageName}`;
      } else {
        title = 'Image Analysis Chat';
      }

      const newConv = await storeService.createConversation({
        userId,
        title,
        studyMode,
      });
      conversationId = newConv._id.toString();
    }

    // Save user's message
    const userMsg = await storeService.addMessage({
      conversationId,
      role: 'user',
      content: userDisplayContent,
      studyMode,
      hasPdfContext: !!pdfContext,
      pdfName: pdfName || '',
      hasImage,
      imageData: hasImage ? imageData : '',
      imageName: hasImage ? (imageName || 'image.png') : '',
      imageMimeType: hasImage ? (imageMimeType || 'image/png') : '',
    });

    // Fetch previous conversation history for conversational context
    const allMessages = await storeService.getMessages(conversationId);
    // Exclude the message we just added when passing history to Gemini
    const history = allMessages.slice(0, -1);

    // Call Gemini Service
    const aiResult = await generateGeminiResponse({
      prompt: rawText,
      history,
      studyMode,
      pdfContext,
      imageData: hasImage ? imageData : '',
      imageMimeType: hasImage ? imageMimeType : '',
      imageName: hasImage ? imageName : '',
      apiKeyOverride,
    });

    // Save assistant's message
    const assistantMsg = await storeService.addMessage({
      conversationId,
      role: 'assistant',
      content: aiResult.text,
      studyMode,
      hasPdfContext: !!pdfContext,
      pdfName: pdfName || '',
    });

    res.json({
      conversationId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      modelUsed: aiResult.modelUsed || 'default',
      isSetupGuide: !!aiResult.isSetupGuide,
    });
  } catch (error) {
    console.error('[ChatController] Error:', error.message);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        error: error.message || 'An error occurred while generating the AI response.',
      });
    }
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await storeService.getConversations(userId);
    res.json({ conversations });
  } catch (error) {
    console.error('[GetConversations] Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const conversation = await storeService.getConversationById(id, userId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const messages = await storeService.getMessages(id);
    res.json({ conversation, messages });
  } catch (error) {
    console.error('[GetConversation] Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation details.' });
  }
};

export const createConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { title = 'New Academic Chat', studyMode = 'academic' } = req.body;

    const conversation = await storeService.createConversation({
      userId,
      title,
      studyMode,
    });

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('[CreateConversation] Error:', error);
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
};

export const renameConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }

    const updated = await storeService.updateConversation(id, userId, {
      title: title.trim(),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ conversation: updated });
  } catch (error) {
    console.error('[RenameConversation] Error:', error);
    res.status(500).json({ error: 'Failed to rename conversation.' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const success = await storeService.deleteConversation(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (error) {
    console.error('[DeleteConversation] Error:', error);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
};

export const clearConversation = async (req, res) => {
  try {
    const { id } = req.params;
    await storeService.clearMessages(id);
    res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('[ClearConversation] Error:', error);
    res.status(500).json({ error: 'Failed to clear conversation.' });
  }
};
