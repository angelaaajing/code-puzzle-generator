'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CodeBlock, Puzzle } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { ControlPanel } from '@/components/ControlPanel';
import { GRID_CONFIG } from '@/lib/config';

interface PlacedBlock {
  block: CodeBlock;
  indentation: number;
  row: number;
}

function calculateGridPosition(x: number, y: number, canvasRect: DOMRect): { indentation: number; row: number } {
  // Calculate row based on vertical position
  const row = Math.max(0, Math.round((y - canvasRect.top - 32) / (GRID_CONFIG.ROW_HEIGHT * 16))); // 16px = 1rem

  // Calculate indentation based on horizontal position
  // Subtract padding (32px = 2rem) and convert to rem units
  const relativeX = Math.max(0, x - canvasRect.left - 32);
  const indentationRem = relativeX / 16; // Convert pixels to rem
  const indentation = Math.round(indentationRem / GRID_CONFIG.INDENT_SIZE);
  
  return { indentation, row };
}

export default function PuzzlePage() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => {
    // Get the puzzle from localStorage
    const savedPuzzle = localStorage.getItem('NEW_PUZZLE');
    if (savedPuzzle) {
      try {
        const parsedPuzzle = JSON.parse(savedPuzzle);
        // Clear the stored puzzle to avoid reusing it
        localStorage.removeItem('NEW_PUZZLE');
        return parsedPuzzle;
      } catch (error) {
        console.error('Failed to parse puzzle:', error);
      }
    }
    
    // Fallback puzzle in case there's no saved puzzle or parsing fails
    return {
      blocks: [
        {
          id: 1,
          code: 'def is_palindrome(s: str) -> bool:',
          explanation: 'Function declaration for palindrome checker',
          correctRow: 0,
          correctCol: 0,
        },
        {
          id: 2,
          code: 'dq = list(s)',
          explanation: 'Convert string to list for efficient operations',
          correctRow: 1,
          correctCol: 1,
        },
        {
          id: 3,
          code: 'while len(dq) > 1:',
          explanation: 'Loop until one or zero characters remain',
          correctRow: 2,
          correctCol: 1,
        },
        {
          id: 4,
          code: 'if dq.pop(0) != dq.pop():',
          explanation: 'Compare characters from both ends',
          correctRow: 3,
          correctCol: 2,
        },
        {
          id: 5,
          code: 'return False',
          explanation: 'Return False if characters dont match',
          correctRow: 4,
          correctCol: 3,
        },
        {
          id: 6,
          code: 'return True',
          explanation: 'Return True if all characters matched',
          correctRow: 5,
          correctCol: 1,
        },
      ],
    };
  });

  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [placedBlockIds, setPlacedBlockIds] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<Array<{
    placed: PlacedBlock[];
    placedIds: Set<number>;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeBlock, setActiveBlock] = useState<{block: CodeBlock; indentation?: number} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveBlock(null);
      return;
    }

    const activeId = active.id.toString();
    const isFromSidebar = activeId.startsWith('sidebar-');
    const isFromCanvas = activeId.startsWith('canvas-');
    const blockId = parseInt(activeId.replace(/^(sidebar-|canvas-)/, ''));
    
    const block = puzzle.blocks.find(b => b.id === blockId);
    if (!block) {
      setActiveBlock(null);
      return;
    }

    // Get the current mouse position and canvas rect
    const mouseX = (event.activatorEvent as MouseEvent).clientX;
    const mouseY = (event.activatorEvent as MouseEvent).clientY;
    const canvasRect = document.querySelector('[data-droppable-id="canvas"]')?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate grid position
    const { indentation, row } = calculateGridPosition(mouseX, mouseY, canvasRect);

    // Handle dropping on canvas
    if (over.id === 'canvas' || typeof over.id === 'string' && over.id.startsWith('canvas-')) {
      const newPlacedBlocks = [...placedBlocks];
      const newPlacedBlockIds = new Set(placedBlockIds);

      if (isFromCanvas) {
        // Reorder within canvas
        const oldIndex = placedBlocks.findIndex(item => item.block.id === blockId);
        const newIndex = over.id === 'canvas' 
          ? placedBlocks.length - 1 
          : placedBlocks.findIndex(item => item.block.id === parseInt(over.id.toString().replace('canvas-', '')));

        if (oldIndex !== -1 && newIndex !== -1) {
          const updatedBlocks = arrayMove(newPlacedBlocks, oldIndex, newIndex).map((block, index) => ({
            ...block,
            row: index
          }));
          
          // Update state with history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push({
            placed: updatedBlocks,
            placedIds: newPlacedBlockIds
          });
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          setPlacedBlocks(updatedBlocks);
        }
      } else if (isFromSidebar) {
        // Add from sidebar
        const overIndex = over.id === 'canvas'
          ? placedBlocks.length
          : placedBlocks.findIndex(item => item.block.id === parseInt(over.id.toString().replace('canvas-', '')));
        
        const insertIndex = overIndex === -1 ? placedBlocks.length : overIndex;
        newPlacedBlocks.splice(insertIndex, 0, {
          block,
          indentation,
          row: insertIndex
        });
        newPlacedBlockIds.add(block.id);

        // Update row positions for all blocks
        const updatedBlocks = newPlacedBlocks.map((block, index) => ({
          ...block,
          row: index
        }));

        // Update state with history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({
          placed: updatedBlocks,
          placedIds: newPlacedBlockIds
        });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPlacedBlocks(updatedBlocks);
        setPlacedBlockIds(newPlacedBlockIds);
      }
    } else if (over.id === 'sidebar' && isFromCanvas) {
      // Handle dropping back to sidebar
      const newPlacedBlocks = placedBlocks.filter(item => item.block.id !== blockId);
      const newPlacedBlockIds = new Set(placedBlockIds);
      newPlacedBlockIds.delete(blockId);

      // Update row positions for remaining blocks
      const updatedBlocks = newPlacedBlocks.map((block, index) => ({
        ...block,
        row: index
      }));

      // Update state with history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        placed: updatedBlocks,
        placedIds: newPlacedBlockIds
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPlacedBlocks(updatedBlocks);
      setPlacedBlockIds(newPlacedBlockIds);
    }

    setActiveBlock(null);
  }, [puzzle.blocks, placedBlocks, placedBlockIds, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      setPlacedBlocks(previousState.placed);
      setPlacedBlockIds(previousState.placedIds);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setPlacedBlocks(nextState.placed);
      setPlacedBlockIds(nextState.placedIds);
    }
  }, [history, historyIndex]);

  const handleHint = useCallback(() => {
    // Find first incorrectly placed or unplaced block
    for (const block of puzzle.blocks) {
      const placed = placedBlocks.find(item => item.block.id === block.id);
      if (!placed || placed.indentation !== block.correctCol) {
        alert(`Hint: "${block.code}" should go at indentation level ${block.correctCol}`);
        return;
      }
    }
    alert('All blocks are correctly placed!');
  }, [puzzle.blocks, placedBlocks]);

  const handleCheck = useCallback(() => {
    // Check if blocks are in correct positions
    let isCorrect = true;
    const sortedPlaced = [...placedBlocks].sort((a, b) => a.row - b.row);

    for (let i = 0; i < puzzle.blocks.length; i++) {
      const expected = puzzle.blocks[i];
      const actual = sortedPlaced[i];
      if (!actual || 
          actual.block.id !== expected.id || 
          actual.indentation !== expected.correctCol ||
          actual.row !== expected.correctRow) {
        isCorrect = false;
        break;
      }
    }
    alert(isCorrect ? 'Correct! Well done!' : 'Not quite right. Keep trying!');
  }, [puzzle.blocks, placedBlocks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();
    const isFromCanvas = activeId.startsWith('canvas-');
    const blockId = parseInt(activeId.replace(/^(sidebar-|canvas-)/, ''));
    
    const block = puzzle.blocks.find(b => b.id === blockId);
    if (!block) return;

    if (isFromCanvas) {
      const placedBlock = placedBlocks.find(item => item.block.id === blockId);
      setActiveBlock(placedBlock || { block });
    } else {
      setActiveBlock({ block });
    }
  }, [puzzle.blocks, placedBlocks]);

  // Handle indentation adjustments
  useEffect(() => {
    const handleIndentationAdjust = (event: Event) => {
      const { blockId, change } = (event as CustomEvent).detail;
      setPlacedBlocks(blocks => 
        blocks.map(item => 
          item.block.id === blockId 
            ? { ...item, indentation: Math.max(0, item.indentation + change) }
            : item
        )
      );
    };

    window.addEventListener('adjust-indentation', handleIndentationAdjust);
    return () => window.removeEventListener('adjust-indentation', handleIndentationAdjust);
  }, []);

  return (
    <main className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Sidebar blocks={puzzle.blocks} placedBlocks={placedBlockIds} />
          <Canvas placedBlocks={placedBlocks} />
          <DragOverlay>
            {activeBlock && (
              <div 
                className="py-1 px-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 cursor-move select-none"
                style={{
                  width: 'fit-content',
                  marginLeft: activeBlock.indentation ? `${activeBlock.indentation * GRID_CONFIG.INDENT_SIZE}rem` : 0
                }}
              >
                <pre className="text-sm font-mono whitespace-pre dark:text-gray-200">
                  {activeBlock.block.code}
                </pre>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      <ControlPanel
        onUndo={handleUndo}
        onRedo={handleRedo}
        onHint={handleHint}
        onCheck={handleCheck}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
    </main>
  );
}
