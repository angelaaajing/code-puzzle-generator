import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CodeBlock } from '@/lib/types';
import { GRID_CONFIG } from '@/lib/config';
import type { CSSProperties } from 'react';
import { CodeBlockWithExplanation } from '@/components/CodeBlockWithExplanation';

interface DraggableBlockProps {
  block: CodeBlock;
  indentation: number;
  row: number;
  isIncorrect?: boolean;
  hintArrows?: Array<'up' | 'down' | 'left' | 'right'>;
  language?: string;
}

const SortableBlock = ({ block, indentation, row, isIncorrect, hintArrows, language }: DraggableBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `canvas-${block.id}`,
    data: {
      type: 'canvas',
      block,
      indentation,
      row,
    }
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${indentation * GRID_CONFIG.INDENT_SIZE}rem`,
    top: `${row * GRID_CONFIG.ROW_HEIGHT}rem`,
    width: 'fit-content',
    opacity: isDragging ? 0.5 : 1,
    position: 'absolute' as const,
    zIndex: isDragging ? 100 : 1,
    willChange: 'transform, opacity, margin-left, top',
  };

  const getArrowStyle = (direction: 'up' | 'down' | 'left' | 'right'): CSSProperties => {
    const baseStyle: CSSProperties = {
      width: 0,
      height: 0,
      position: 'absolute',
      borderStyle: 'solid',
    };

    switch (direction) {
      case 'up':
        return {
          ...baseStyle,
          bottom: `calc(100% + 0.75rem)`,
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 0,
          borderWidth: '0 0.5rem 0.5rem 0.5rem',
          borderColor: 'transparent transparent rgb(248, 23, 23) transparent',
        };
      case 'down':
        return {
          ...baseStyle,
          top: `calc(100% + 0.75rem)`,
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 0,
          borderWidth: '0.5rem 0.5rem 0 0.5rem',
          borderColor: 'rgb(248, 23, 23) transparent transparent transparent',
        };
      case 'left':
        return {
          ...baseStyle,
          top: '50%',
          right: `calc(100% + 1.25rem)`,
          transform: 'translateY(-50%)',
          marginRight: 0,
          borderWidth: '0.5rem 0.5rem 0.5rem 0',
          borderColor: 'transparent rgb(248, 23, 23) transparent transparent',
        };
      case 'right':
        return {
          ...baseStyle,
          top: '50%',
          left: `calc(100% + 1.25rem)`,
          transform: 'translateY(-50%)',
          marginLeft: 0,
          borderWidth: '0.5rem 0 0.5rem 0.5rem',
          borderColor: 'transparent transparent transparent rgb(248, 23, 23)',
        };
    }
  };

  // Simplified version during dragging to prevent monaco editor issues
  const renderBlockContent = () => {
    if (isDragging) {
      // Render simpler version during drag to avoid editor instantiation/disposal issues
      return (
        <div className="relative code-block-placeholder p-2">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {block.code}
          </pre>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <CodeBlockWithExplanation block={block} language={language} className="!overflow-visible" />
        {hintArrows?.map((direction) => (
          <div 
            key={direction}
            className="animate-bounce"
            style={getArrowStyle(direction)}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`py-1 px-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border cursor-move hover:shadow select-none group transition-all duration-200 relative
        ${isIncorrect ? 'border-red-500 border-2' : 'border-gray-200 dark:border-gray-700'}
        ${hintArrows?.length ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
      data-row={row}
      data-indentation={indentation}
    >
      {renderBlockContent()}
      {/* Indentation controls */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 px-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('adjust-indentation', {
              detail: { blockId: block.id, change: -1 }
            });
            window.dispatchEvent(event);
          }}
          className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300"
          title="Decrease indentation"
        >
          ←
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('adjust-indentation', {
              detail: { blockId: block.id, change: 1 }
            });
            window.dispatchEvent(event);
          }}
          className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300"
          title="Increase indentation"
        >
          →
        </button>
      </div>
    </div>
  );
};

interface CanvasProps {
  placedBlocks: Array<{
    block: CodeBlock;
    indentation: number;
    row: number;
  }>;
  incorrectBlocks?: Set<number>;
  hintBlock?: {
    id: number;
    directions: Array<'up' | 'down' | 'left' | 'right'>;
  };
  language?: string;
}

export const Canvas = ({ placedBlocks, incorrectBlocks = new Set(), hintBlock, language }: CanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      type: 'canvas'
    }
  });

  return (
    <div 
      ref={setNodeRef}
      data-droppable-id="canvas"
      className={`w-3/5 h-full bg-yellow-50 dark:bg-yellow-900/20 p-8 overflow-auto relative transition-colors duration-200 ${
        isOver ? 'bg-yellow-100 dark:bg-yellow-800/20' : ''
      }`}
    >
      <SortableContext 
        items={placedBlocks.map(item => item.block.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="relative min-h-full">
          {placedBlocks.map(({ block, indentation }, _) => (
            <SortableBlock
              key={block.id}
              block={block}
              indentation={indentation}
              row={_}
              isIncorrect={incorrectBlocks.has(block.id)}
              hintArrows={hintBlock?.id === block.id ? hintBlock.directions : undefined}
              language={language}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};