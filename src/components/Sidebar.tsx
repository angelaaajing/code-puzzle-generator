import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CodeBlock } from '@/lib/types';
import type { CSSProperties } from 'react';
import { CodeBlockWithExplanation } from '@/components/CodeBlockWithExplanation';

interface DraggableCodeBlockProps {
  block: CodeBlock;
  language?: string;
}

const DraggableCodeBlock = ({ block, language }: DraggableCodeBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `sidebar-${block.id}`,
    data: {
      type: 'sidebar',
      block,
      rect: null
    }
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    width: 'fit-content',
    opacity: isDragging ? 0 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 100 : 1,
    transition: isDragging ? undefined : 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, opacity',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="py-1 px-2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow select-none"
    >
      <CodeBlockWithExplanation block={block} language={language} className="!overflow-visible" />
    </div>
  );
};

interface SidebarProps {
  blocks: CodeBlock[];
  placedBlocks: Set<number>;
  language?: string;
}

export const Sidebar = ({ blocks, placedBlocks, language }: SidebarProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sidebar',
    data: {
      type: 'sidebar'
    }
  });

  // Filter out blocks that have already been placed
  const availableBlocks = blocks.filter(block => !placedBlocks.has(block.id));

  return (
    <div 
      ref={setNodeRef}
      className={`w-2/5 h-full bg-white dark:bg-gray-900 p-4 overflow-y-auto transition-colors duration-200 ${
        isOver ? 'bg-gray-50 dark:bg-gray-800' : ''
      }`}
    >
      <div className="space-y-2">
        {availableBlocks.map((block) => (
          <DraggableCodeBlock key={block.id} block={block} language={language} />
        ))}
      </div>
    </div>
  );
};