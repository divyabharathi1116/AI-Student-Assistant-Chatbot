import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={14} color="#89b4fa" />
          <span className="code-lang-tag">{language}</span>
        </div>
        <button
          className="copy-code-btn"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} color="#a6e3a1" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
};
