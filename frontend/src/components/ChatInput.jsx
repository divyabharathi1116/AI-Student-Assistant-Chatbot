import React, { useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  BookOpen,
  Lightbulb,
  Code2,
  GraduationCap,
  Calendar,
  Loader2,
} from 'lucide-react';

const STUDY_MODES = [
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'concept', label: 'Concept Explainer', icon: Lightbulb },
  { id: 'code', label: 'Code Tutor', icon: Code2 },
  { id: 'exam', label: 'Exam Prep', icon: GraduationCap },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
];

export const ChatInput = ({
  inputMessage,
  setInputMessage,
  onSendMessage,
  isLoading,
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
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (inputMessage.trim() || attachedPdf || attachedImage)) {
        onSendMessage();
      }
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachPdf(file);
      e.target.value = '';
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachImage(file);
      e.target.value = '';
    }
  };

  const canSend = !isLoading && (inputMessage.trim() || attachedPdf || attachedImage);

  return (
    <div className="chat-input-area">
      <div className="input-container-capsule">
        {/* Attached PDF Preview Bar */}
        {attachedPdf && (
          <div className="pdf-attachment-chip">
            <div className="pdf-chip-left">
              <FileText size={16} color="var(--accent-purple)" />
              <span className="pdf-chip-title">{attachedPdf.name}</span>
              <span className="pdf-chip-badge">
                {attachedPdf.pages} page{attachedPdf.pages > 1 ? 's' : ''} ({attachedPdf.size})
              </span>
            </div>
            <button
              className="icon-btn-ghost danger"
              onClick={onRemovePdf}
              title="Remove document"
              type="button"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Attached Image Preview Bar */}
        {attachedImage && (
          <div className="image-attachment-chip">
            <div className="image-chip-left">
              <img
                src={attachedImage.dataUrl}
                alt="Preview"
                className="image-chip-thumb"
              />
              <span className="image-chip-title" title={attachedImage.name}>
                {attachedImage.name}
              </span>
              <span className="image-chip-badge">
                {attachedImage.sizeFormatted}
              </span>
            </div>
            <button
              className="icon-btn-ghost danger"
              onClick={onRemoveImage}
              title="Remove image"
              type="button"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="input-row">
          {/* Hidden File Input for PDF */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfChange}
            accept=".pdf"
            style={{ display: 'none' }}
          />

          {/* Hidden File Input for Images */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            style={{ display: 'none' }}
          />

          {/* Image Upload Button */}
          <button
            type="button"
            className="attach-btn"
            onClick={() => imageInputRef.current?.click()}
            title="Upload image / screenshot (JPG, PNG, WEBP)"
            disabled={isUploadingImage || isLoading}
          >
            {isUploadingImage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ImageIcon size={18} />
            )}
          </button>

          {/* PDF Upload Button */}
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF document / syllabus"
            disabled={isUploadingPdf || isLoading}
          >
            {isUploadingPdf ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={
              attachedImage
                ? `Type your question about this image, or press Enter to analyze automatically...`
                : attachedPdf
                ? `Ask questions about "${attachedPdf.name}" or request a study summary...`
                : 'Ask an academic question, upload an image / screenshot, or request code...'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />

          <div className="input-action-buttons">
            <button
              type="button"
              className="send-btn"
              onClick={onSendMessage}
              disabled={!canSend}
              title="Send message (Enter)"
            >
              {isLoading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="input-footer-hints">
        <div className="input-modes-bar">
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Mode:
          </span>
          {STUDY_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = studyMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={`input-mode-btn ${isActive ? 'active' : ''}`}
                onClick={() => setStudyMode(mode.id)}
              >
                <Icon size={12} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
        </div>
      </div>
    </div>
  );
};
