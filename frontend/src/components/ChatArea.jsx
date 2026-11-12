import React, { useRef, useEffect } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

export const ChatArea = ({
  messages,
  isLoading,
  inputMessage,
  setInputMessage,
  onSendMessage,
  onSelectPrompt,
  studyMode,
  setStudyMode,
  attachedPdf,
  onAttachPdf,
  onRemovePdf,
  isUploadingPdf,
  attachedImage,
  onAttachImage,
  onRemoveImage,
  isUploadingImage,
  onShowToast,
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  return (
    <div className="main-wrapper">
      <div className="chat-scroll-area">
        <div className="chat-inner-container">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={onSelectPrompt} />
          ) : (
            messages.map((msg, index) => (
              <MessageBubble
                key={msg._id || index}
                message={msg}
                onShowToast={onShowToast}
              />
            ))
          )}

          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="typing-indicator-container">
                <div className="typing-dots">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
                <span className="typing-text">
                  {attachedImage
                    ? 'AI Student Assistant is analyzing your image & thinking...'
                    : 'AI Student Assistant is thinking...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        attachedPdf={attachedPdf}
        onAttachPdf={onAttachPdf}
        onRemovePdf={onRemovePdf}
        isUploadingPdf={isUploadingPdf}
        attachedImage={attachedImage}
        onAttachImage={onAttachImage}
        onRemoveImage={onRemoveImage}
        isUploadingImage={isUploadingImage}
      />
    </div>
  );
};
