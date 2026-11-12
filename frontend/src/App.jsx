import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

export function App() {
  const { apiKeyOverride, selectedModel, token } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [inputMessage, setInputMessage] = useState('');
  const [studyMode, setStudyMode] = useState('academic');
  const [isLoading, setIsLoading] = useState(false);

  // File Attachments State
  const [attachedPdf, setAttachedPdf] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Modals & Feedback
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load conversations on mount and when token changes
  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (id) => {
    if (id === currentConversationId) return;
    try {
      setIsLoading(true);
      const data = await api.getConversation(id);
      setCurrentConversationId(id);
      setCurrentConversation(data.conversation);
      setMessages(data.messages || []);
      if (data.conversation.studyMode) {
        setStudyMode(data.conversation.studyMode);
      }
      setSidebarOpen(false);
    } catch (err) {
      showToast('Could not load chat session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setCurrentConversation(null);
    setMessages([]);
    setAttachedPdf(null);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
      showToast('Chat deleted.');
    } catch (err) {
      showToast('Failed to delete chat.');
    }
  };

  const handleRenameConversation = async (id, title) => {
    try {
      const updated = await api.renameConversation(id, title);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: updated.title } : c))
      );
      if (currentConversationId === id) {
        setCurrentConversation((prev) => (prev ? { ...prev, title: updated.title } : prev));
      }
      showToast('Chat renamed.');
    } catch (err) {
      showToast('Failed to rename chat.');
    }
  };

  const handleClearChat = async () => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }
    try {
      await api.clearConversation(currentConversationId);
      setMessages([]);
      showToast('Chat history cleared.');
    } catch (err) {
      showToast('Failed to clear chat.');
    }
  };

  const handleAttachPdf = async (file) => {
    setIsUploadingPdf(true);
    try {
      const res = await api.uploadPdf(file);
      setAttachedPdf({
        name: res.file.name,
        size: res.file.size,
        pages: res.file.pages,
        text: res.extractedText,
      });
      setStudyMode('pdf');
      showToast(`Document "${res.file.name}" uploaded successfully!`);
    } catch (err) {
      showToast(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleRemovePdf = () => {
    setAttachedPdf(null);
    if (studyMode === 'pdf') {
      setStudyMode('academic');
    }
  };

  const handleAttachImage = (file) => {
    if (!file) return;

    // Allowed image formats
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      showToast('Please upload a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    // 10MB size limit
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB. Please choose a smaller file.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const sizeKB = Math.round(file.size / 1024);
      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${sizeKB} KB`;

      setAttachedImage({
        file,
        dataUrl,
        name: file.name,
        sizeFormatted,
        mimeType: file.type || 'image/png',
      });
      showToast(`Image "${file.name}" attached successfully!`);
      setIsUploadingImage(false);
    };

    reader.onerror = () => {
      showToast('Failed to read image file.');
      setIsUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  const handleSendMessage = async (customPrompt, customMode) => {
    const textToSend = customPrompt || inputMessage;
    const modeToUse = customMode || studyMode;
    const imageToSend = attachedImage;

    if (!textToSend.trim() && !attachedPdf && !imageToSend) return;

    const userMessageContent = textToSend.trim();
    setInputMessage('');
    if (imageToSend) {
      setAttachedImage(null);
    }

    // Determine intuitive user prompt label in chat UI
    const displayContent = userMessageContent || (imageToSend ? `📷 Image Analysis: ${imageToSend.name}` : '');

    // Optimistically create temporary user message in UI
    const tempUserMsg = {
      _id: 'temp_' + Date.now(),
      role: 'user',
      content: displayContent,
      studyMode: modeToUse,
      hasPdfContext: !!attachedPdf,
      pdfName: attachedPdf?.name || '',
      hasImage: !!imageToSend,
      imageData: imageToSend?.dataUrl || '',
      imageName: imageToSend?.name || '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await api.sendMessage({
        message: userMessageContent,
        conversationId: currentConversationId,
        studyMode: modeToUse,
        pdfContext: attachedPdf?.text || '',
        pdfName: attachedPdf?.name || '',
        imageData: imageToSend?.dataUrl || '',
        imageMimeType: imageToSend?.mimeType || '',
        imageName: imageToSend?.name || '',
        apiKeyOverride: apiKeyOverride || undefined,
      });

      // Update current conversation ID if newly created
      if (!currentConversationId && res.conversationId) {
        setCurrentConversationId(res.conversationId);
        loadConversations();
      }

      // Replace or update messages with persisted records safely
      const validNewMessages = [res.userMessage, res.assistantMessage].filter(Boolean);
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempUserMsg._id),
        ...validNewMessages,
      ]);

      // Celebrate study plans and timetable generation with gentle confetti!
      if (modeToUse === 'timetable' || modeToUse === 'exam') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#2563eb', '#7c3aed', '#60a5fa', '#a78bfa'],
        });
      }
    } catch (err) {
      console.error('Send message failed:', err);
      // Append an informative assistant error message
      setMessages((prev) => [
        ...prev,
        {
          _id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Error:** ${err.message || 'Failed to reach AI service. Please check your Gemini API key in Settings.'}`,
          studyMode: modeToUse,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt, mode) => {
    setStudyMode(mode);
    handleSendMessage(prompt, mode);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          currentConversation={currentConversation}
          studyMode={studyMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onClearChat={handleClearChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          hasMessages={messages.length > 0}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={() => handleSendMessage()}
          onSelectPrompt={handleSelectPrompt}
          studyMode={studyMode}
          setStudyMode={setStudyMode}
          attachedPdf={attachedPdf}
          onAttachPdf={handleAttachPdf}
          onRemovePdf={handleRemovePdf}
          isUploadingPdf={isUploadingPdf}
          attachedImage={attachedImage}
          onAttachImage={handleAttachImage}
          onRemoveImage={handleRemoveImage}
          isUploadingImage={isUploadingImage}
          onShowToast={showToast}
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={showToast}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
