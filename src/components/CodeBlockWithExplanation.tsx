import { CodeBlock } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CodeBlockWithExplanationProps {
  block: CodeBlock;
  className?: string;
  style?: React.CSSProperties;
}

export const CodeBlockWithExplanation = ({ block, className = '', style }: CodeBlockWithExplanationProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const questionMarkRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showTooltip && questionMarkRef.current) {
      const rect = questionMarkRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top,
        left: rect.right + 8 // 8px gap
      });
    }
  }, [showTooltip]);

  return (
    <div className={`group relative overflow-visible ${className}`} style={style}>
      <pre className="text-sm font-mono whitespace-pre dark:text-gray-200">
        {block.code}
      </pre>

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