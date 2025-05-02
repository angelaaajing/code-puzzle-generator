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
  // Only access localStorage on the client to avoid SSR errors
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    // This runs only on the client
    let loadedPuzzle: Puzzle | null = null;
    try {
      const savedPuzzle = typeof window !== 'undefined' ? window.localStorage.getItem('NEW_PUZZLE') : null;
      if (savedPuzzle) {
        try {
          loadedPuzzle = JSON.parse(savedPuzzle);
          // Clear the stored puzzle to avoid reusing it
          window.localStorage.removeItem('NEW_PUZZLE');
        } catch (error) {
          console.error('Failed to parse puzzle:', error);
        }
      }
    } catch (e) {
      // localStorage not available or not defined
    }
    if (!loadedPuzzle) {
      loadedPuzzle = {
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
    }
    setPuzzle(loadedPuzzle);
  }, []);

  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [placedBlockIds, setPlacedBlockIds] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<Array<{
    placed: PlacedBlock[];
    placedIds: Set<number>;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeBlock, setActiveBlock] = useState<{block: CodeBlock; indentation?: number} | null>(null);
  const [incorrectBlocks, setIncorrectBlocks] = useState<Set<number>>(new Set());
  const [hintBlock, setHintBlock] = useState<{ 
    id: number; 
    directions: Array<'up' | 'down' | 'left' | 'right'>;
  } | null>(null);
  const [hintCooldown, setHintCooldown] = useState(false);

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
    if (!puzzle) return;
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
    const canvasRect = typeof window !== 'undefined'
      ? document.querySelector('[data-droppable-id="canvas"]')?.getBoundingClientRect()
      : undefined;
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
  }, [puzzle, placedBlocks, placedBlockIds, history, historyIndex]);

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
    if (!puzzle || hintCooldown) return;
    
    // Find all incorrectly placed blocks
    const incorrectBlocks = puzzle.blocks
      .map(block => {
        const placed = placedBlocks.find(item => item.block.id === block.id);
        if (!placed) return null;

        if (placed.row !== block.correctRow || placed.indentation !== block.correctCol) {
          return {
            id: block.id,
            currentRow: placed.row,
            currentCol: placed.indentation,
            correctRow: block.correctRow,
            correctCol: block.correctCol
          };
        }
        return null;
      })
      .filter((block): block is NonNullable<typeof block> => block !== null);

    if (incorrectBlocks.length > 0) {
      // Randomly select one incorrect block
      const randomBlock = incorrectBlocks[Math.floor(Math.random() * incorrectBlocks.length)];
      
      // Calculate all needed directions
      const directions: Array<'up' | 'down' | 'left' | 'right'> = [];
      
      if (randomBlock.currentRow > randomBlock.correctRow) {
        directions.push('up');
      }
      if (randomBlock.currentRow < randomBlock.correctRow) {
        directions.push('down');
      }
      if (randomBlock.currentCol > randomBlock.correctCol) {
        directions.push('left');
      }
      if (randomBlock.currentCol < randomBlock.correctCol) {
        directions.push('right');
      }

      setHintBlock({ id: randomBlock.id, directions });
      
      // Start cooldown
      setHintCooldown(true);
      setTimeout(() => {
        setHintCooldown(false);
        setHintBlock(null);
      }, 10000); // 10 seconds cooldown
    } else {
      alert('All blocks are correctly placed!');
    }
  }, [puzzle, placedBlocks, hintCooldown]);

  const handleCheck = useCallback(() => {
    if (!puzzle) return;
    // Check if blocks are in correct positions
    let isCorrect = true;
    const newIncorrectBlocks = new Set<number>();
    const sortedPlaced = [...placedBlocks].sort((a, b) => a.row - b.row);

    for (let i = 0; i < puzzle.blocks.length; i++) {
      const expected = puzzle.blocks[i];
      const actual = sortedPlaced[i];
      if (!actual || 
          actual.block.id !== expected.id || 
          actual.indentation !== expected.correctCol ||
          actual.row !== expected.correctRow) {
        isCorrect = false;
        if (actual) {
          newIncorrectBlocks.add(actual.block.id);
        }
      }
    }

    setIncorrectBlocks(newIncorrectBlocks);
    if (isCorrect) {
      alert('Correct! Well done!');
    }
  }, [puzzle, placedBlocks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!puzzle) return;
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
  }, [puzzle, placedBlocks]);

  // Handle indentation adjustments
  useEffect(() => {
    const handleIndentationAdjust = (event: Event) => {
      const { blockId, change } = (event as CustomEvent).detail;
      
      setPlacedBlocks(currentBlocks => {
        const newBlocks = currentBlocks.map(item => 
          item.block.id === blockId 
            ? { ...item, indentation: Math.max(0, item.indentation + change) }
            : item
        );

        // Add the new state to history
        setHistory(currentHistory => {
          const newHistory = currentHistory.slice(0, historyIndex + 1);
          newHistory.push({
            placed: newBlocks,
            placedIds: placedBlockIds
          });
          return newHistory;
        });

        setHistoryIndex(current => current + 1);
        return newBlocks;
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adjust-indentation', handleIndentationAdjust);
      return () => window.removeEventListener('adjust-indentation', handleIndentationAdjust);
    }
  }, [historyIndex, placedBlockIds]); // Only depend on primitive values

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl key is pressed
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Ctrl+Shift+Z for Redo (alternative)
              handleRedo();
            } else {
              // Ctrl+Z for Undo
              handleUndo();
            }
            break;
          case 'y':
            // Ctrl+Y for Redo
            event.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    if (typeof window !== 'undefined') {
      // Add event listener
      window.addEventListener('keydown', handleKeyDown);

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleUndo, handleRedo]);

  // Clear incorrect blocks on any change
  useEffect(() => {
    setIncorrectBlocks(new Set());
  }, [placedBlocks]);

  // Don't render until puzzle is loaded (client-side)
  if (!puzzle) {
    return null;
  }

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
          <Canvas 
            placedBlocks={placedBlocks} 
            incorrectBlocks={incorrectBlocks}
            hintBlock={hintBlock || undefined}
          />
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
        hintCooldown={hintCooldown}
      />
    </main>
  );
}
