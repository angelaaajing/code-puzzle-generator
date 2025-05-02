import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CodeBlock } from '@/lib/types';
import { GRID_CONFIG } from '@/lib/config';
import type { CSSProperties } from 'react';

interface DraggableBlockProps {
  block: CodeBlock;
  indentation: number;
  row: number;
}

const SortableBlock = ({ block, indentation, row }: DraggableBlockProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="py-1 px-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow select-none group"
      title={block.explanation}
      data-row={row}
      data-indentation={indentation}
    >
      <pre className="text-sm font-mono whitespace-pre">
        {block.code}
      </pre>
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
}

export const Canvas = ({ placedBlocks }: CanvasProps) => {
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
          {placedBlocks.map(({ block, indentation }, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              indentation={indentation}
              row={index}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// import { useDroppable } from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { CodeBlock } from '@/lib/types';
// import { SortableItem } from '@/components/SortableItem';

// interface DropZoneProps {
//   rowIndex: number;
//   columnIndex: number;
//   onDrop?: (rowIndex: number, columnIndex: number) => void;
//   children?: React.ReactNode;
// }

// const DropZone = ({ rowIndex, columnIndex, onDrop, children }: DropZoneProps) => {
//   const { setNodeRef } = useDroppable({
//     id: `${rowIndex}-${columnIndex}`,
//     data: { rowIndex, columnIndex },
//   });

//   return (
//     <div
//       ref={setNodeRef}
//       className={`min-h-[50px] border-2 border-dashed border-transparent hover:border-gray-200 transition-colors ${
//         children ? 'border-none' : ''
//       }`}
//     >
//       {children}
//     </div>
//   );
// };

// interface CanvasProps {
//   blocks: CodeBlock[];
//   placedBlocks: Map<string, CodeBlock>; // key: "row-column", value: block
//   onBlockPlaced: (blockId: number, rowIndex: number, columnIndex: number) => void;
//   onBlockMoved: (blockId: number, newRowIndex: number) => void;
// }

// export const Canvas = ({
//   blocks,
//   placedBlocks,
//   onBlockPlaced,
//   onBlockMoved,
// }: CanvasProps) => {
//   // Create a grid structure with rows and columns
//   const rows = 20; // Adjust based on your needs
//   const columns = 4; // For different indentation levels

//   // Group blocks by row for sorting
//   const blocksByRow = new Map<number, CodeBlock[]>();
//   placedBlocks.forEach((block, position) => {
//     const [row] = position.split('-').map(Number);
//     if (!blocksByRow.has(row)) {
//       blocksByRow.set(row, []);
//     }
//     blocksByRow.get(row)?.push(block);
//   });

//   return (
//     <div className="h-full bg-white p-4 overflow-auto">
//       <div className="space-y-2">
//         {Array.from({ length: rows }, (_, rowIndex) => (
//           <div key={rowIndex} className="flex">
//             {Array.from({ length: columns }, (_, columnIndex) => {
//               const position = `${rowIndex}-${columnIndex}`;
//               const block = placedBlocks.get(position);

//               return (
//                 <div
//                   key={`${rowIndex}-${columnIndex}`}
//                   className="flex-1"
//                   style={{ marginLeft: `${columnIndex * 2}rem` }}
//                 >
//                   <SortableContext
//                     items={blocksByRow.get(rowIndex) || []}
//                     strategy={verticalListSortingStrategy}
//                   >
//                     <DropZone
//                       rowIndex={rowIndex}
//                       columnIndex={columnIndex}
//                       onDrop={(row, col) => onBlockPlaced(block?.id || -1, row, col)}
//                     >
//                       {block && (
//                         <SortableItem
//                           id={String(block.id)}
//                           block={block}
//                           rowIndex={rowIndex}
//                         />
//                       )}
//                     </DropZone>
//                   </SortableContext>
//                 </div>
//               );
//             })}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
