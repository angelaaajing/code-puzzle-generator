import { useState, useCallback } from 'react';

export function useUndoRedo<T>(initialPresent: T) {
  const [past, setPast]       = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture]   = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const set = useCallback((newPresent: T) => {
    setPast((p) => [...p, present]);
    setPresent(newPresent);
    setFuture([]); // once you make a new change, you clear the redo stack
  }, [present]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, p.length - 1));
    setFuture((f) => [present, ...f]);
    setPresent(previous);
  }, [canUndo, past, present]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, present]);
    setPresent(next);
  }, [canRedo, future, present]);

  return { present, set, undo, redo, canUndo, canRedo };
}
