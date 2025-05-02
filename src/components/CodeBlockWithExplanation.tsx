'use client';

import { CodeBlock } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { detectLanguage } from '@/lib/utils';
import * as monaco from 'monaco-editor';

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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  // Calculate simple dimensions based on content
  const lines = block.code.split('\n');
  const lineCount = lines.length;
  const maxLineLength = Math.max(...lines.map(line => line.length));
  
  // Simple calculation for dimensions
  const height = `${lineCount * 20}px`; // Approximately 20px per line
  const width = `${maxLineLength * 8 + 16}px`; // Approximate character width plus padding

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
  
  // Handle editor mount to get reference
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className={`group relative overflow-visible ${className}`} style={style}>
      <div 
        className="editor-container"
        style={{
          height,
          width,
          minHeight: '12px',
          minWidth: '100px'
        }}
      >
        <Editor
          height="100%"
          width="100%"
          value={block.code}
          language={codeLanguage}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            folding: false,
            lineNumbers: 'off',
            glyphMargin: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'none',
            fontSize: 13,
            automaticLayout: true,
            fixedOverflowWidgets: true,
            padding: { top: 4, bottom: 4 },
            wordWrap: 'off',
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