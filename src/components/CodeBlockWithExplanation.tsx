'use client';

import { CodeBlock } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { detectLanguage } from '@/lib/utils';

// Add global type for monaco loaded via script tags
declare global {
  interface Window {
    monaco: {
      editor: {
        colorize: (code: string, language: string, options: object) => Promise<string>;
      }
    };
    require: {
      config: (options: { paths: Record<string, string> }) => void;
      (modules: string[], callback: () => void): void;
    };
    monacoReady?: boolean;
  }
}

// Helper function to ensure monaco is loaded
const colorizeCode = async (code: string, language: string): Promise<string> => {
  // Wait for monaco to be loaded
  if (typeof window === 'undefined' || !window.monaco || !window.monaco.editor) {
    return `<span>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  }

  try {
    return await window.monaco.editor.colorize(code, language, {});
  } catch (err) {
    console.error('Failed to colorize code:', err);
    return `<span>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  }
};

interface CodeBlockWithExplanationProps {
  block: CodeBlock;
  className?: string;
  style?: React.CSSProperties;
  language?: string;
}

export const CodeBlockWithExplanation = ({ block, className = '', style, language }: CodeBlockWithExplanationProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const questionMarkRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  // Use provided language or detect it if not provided
  const codeLanguage = language || detectLanguage(block.code);
  const [theme, setTheme] = useState('light');
  const codeRef = useRef<HTMLDivElement>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(
    typeof window !== 'undefined' && window.monacoReady === true
  );
  
  // Calculate simple dimensions based on content
  const lines = block.code.split('\n');
  const lineCount = lines.length;
  const maxLineLength = Math.max(...lines.map(line => line.length));
  
  // Simple calculation for dimensions
  const height = `${lineCount * 20}px`; // Approximately 20px per line
  const width = `${maxLineLength * 8 + 32}px`; // Approximate character width plus padding

  // Check if Monaco is loaded
  useEffect(() => {
    // Handle the monaco-ready event
    const handleMonacoReady = () => {
      setIsMonacoLoaded(true);
    };

    // If monaco is already ready, set state immediately
    if (typeof window !== 'undefined' && window.monacoReady) {
      setIsMonacoLoaded(true);
    } else {
      // Otherwise listen for the ready event
      window.addEventListener('monaco-ready', handleMonacoReady);
      
      // Clean up
      return () => {
        window.removeEventListener('monaco-ready', handleMonacoReady);
      };
    }
  }, []);

  useEffect(() => {
    if (showTooltip && questionMarkRef.current) {
      const rect = questionMarkRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top,
        left: rect.right + 8 // 8px gap
      });
    }
  }, [showTooltip]);

  // Set theme based on system preference or app theme
  useEffect(() => {
    const updateTheme = () => {
      // Check if document has a .dark class on html or body, which indicates dark mode
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                         document.body.classList.contains('dark') ||
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'vs-dark' : 'vs');
    };

    updateTheme();
    
    // Listen for changes in color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => updateTheme();
    mediaQuery.addEventListener('change', handleChange);
    
    // Observer for class changes on the document
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  // Apply colorization when Monaco is loaded or code/language changes
  useEffect(() => {
    // Always set the plain text content first for immediate display
    if (codeRef.current) {
      codeRef.current.textContent = block.code;
    }
    
    // Only attempt colorization if Monaco is loaded
    if (isMonacoLoaded && codeRef.current) {
      colorizeCode(block.code, codeLanguage)
        .then(html => {
          if (codeRef.current) {
            codeRef.current.innerHTML = html;
          }
        });
    }
  }, [block.code, codeLanguage, isMonacoLoaded]);

  return (
    <div className={`group relative overflow-visible ${className}`} style={style}>
      <div 
        className="editor-container"
        style={{
          height,
          width,
          minHeight: '12px',
          minWidth: '100px',
          padding: '4px',
          backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'vs-dark' ? '#d4d4d4' : '#000000'
        }}
      >
        <div 
          ref={codeRef}
          className="code-content font-mono text-sm whitespace-pre-wrap"
          style={{ 
            overflow: 'hidden',
            tabSize: 2
          }}
        />
      </div>

      {/* Question mark icon container */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.5rem)] opacity-0 group-hover:opacity-100 transition-opacity">
        <div 
          ref={questionMarkRef}
          className="w-6 h-6 bg-[#c6f6f7] rounded flex items-center justify-center text-blue-600 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          ?
        </div>
      </div>

      {/* Portal for the tooltip */}
      {showTooltip && createPortal(
        <div 
          className="fixed bg-[#c6f6f7] p-3 rounded-lg text-sm text-blue-900 w-64 shadow-lg z-[9999]"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {block.explanation}
        </div>,
        document.body
      )}
    </div>
  );
};