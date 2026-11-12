import React from 'react';
import {
  Sparkles,
  BookOpen,
  Code2,
  Calendar,
  GraduationCap,
  Lightbulb,
  FileText,
  ArrowRight,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    mode: 'concept',
    category: 'Concept Explainer',
    icon: Lightbulb,
    prompt: 'Explain the Feynman Technique and Quantum Superposition in simple English with an analogy.',
  },
  {
    mode: 'code',
    category: 'Python / Algorithms',
    icon: Code2,
    prompt: "Write a complete Python implementation of Dijkstra's Shortest Path algorithm with Big-O complexity.",
  },
  {
    mode: 'code',
    category: 'Java / Data Structures',
    icon: Code2,
    prompt: 'Write a Java program implementing a Binary Search Tree with insert, search, and in-order traversal.',
  },
  {
    mode: 'exam',
    category: 'Exam Prep & Quiz',
    icon: GraduationCap,
    prompt: 'Generate 4 high-yield exam practice questions on Operating System Deadlocks with step-by-step answers.',
  },
  {
    mode: 'timetable',
    category: 'Study Timetable',
    icon: Calendar,
    prompt: 'Create an intensive 7-day revision timetable for engineering finals using the Pomodoro technique.',
  },
  {
    mode: 'academic',
    category: 'Academic Deep Dive',
    icon: BookOpen,
    prompt: 'Explain the Second Law of Thermodynamics, entropy, and why time only moves forward.',
  },
];

export const WelcomeScreen = ({ onSelectPrompt }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-badge">
        <Sparkles size={14} />
        <span>Powered by Google Gemini & MongoDB</span>
      </div>

      <h1 className="welcome-title">AI Student Assistant</h1>

      <p className="welcome-desc">
        Your 24/7 academic copilot. Master challenging coursework, explain difficult concepts simply,
        generate programs in Python, Java, C, and JavaScript, prepare for exams, and analyze uploaded PDFs.
      </p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="suggestion-card"
              onClick={() => onSelectPrompt(item.prompt, item.mode)}
            >
              <div className="suggestion-header">
                <Icon size={16} />
                <span>{item.category}</span>
              </div>
              <div className="suggestion-title">{item.prompt}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginTop: 'auto',
                }}
              >
                <span>Ask now</span>
                <ArrowRight size={12} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
