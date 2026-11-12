import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, Copy, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export const MessageBubble = ({ message, onShowToast }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (onShowToast) onShowToast('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'concept':
        return '💡 Concept Explainer';
      case 'code':
        return '💻 Code Tutor';
      case 'exam':
        return '🎯 Exam Prep';
      case 'timetable':
        return '📅 Study Timetable';
      case 'pdf':
        return '📄 PDF Document Context';
      default:
        return '📚 Academic Assistant';
    }
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? <User size={18} /> : <Sparkles size={18} />}
      </div>

      <div className="message-bubble-content">
        <div className="message-header-bar">
          <span className="message-author">{isUser ? 'You' : 'AI Student Assistant'}</span>
          <span>•</span>
          <span>{formatTime(message.createdAt || new Date())}</span>
          {!isUser && message.studyMode && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                {getModeLabel(message.studyMode)}
              </span>
            </>
          )}
          {message.hasPdfContext && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                color: 'var(--accent-blue)',
                fontWeight: 600,
              }}
            >
              <FileText size={12} />
              {message.pdfName || 'Document Attached'}
            </span>
          )}
          {message.hasImage && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--accent-purple)',
                fontWeight: 600,
              }}
            >
              <ImageIcon size={12} />
              {message.imageName || 'Image Attached'}
            </span>
          )}
        </div>

        <div className="message-body">
          {message.imageData && (
            <div className="message-image-preview-wrapper">
              <img
                src={message.imageData}
                alt={message.imageName || 'Uploaded preview'}
                className="message-image-img"
              />
            </div>
          )}
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {!isUser && (
          <div className="message-actions-bar">
            <button className="action-chip-btn" onClick={handleCopy} title="Copy response">
              {copied ? (
                <>
                  <Check size={13} color="#10b981" />
                  <span style={{ color: '#10b981' }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Response</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
