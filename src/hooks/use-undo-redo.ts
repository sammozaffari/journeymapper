"use client";

import { useState, useCallback, useRef } from "react";

interface UndoRedoState<T> {
  current: T;
  set: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (value: T) => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory = 50): UndoRedoState<T> {
  const [current, setCurrent] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, forceRender] = useState(0);

  const set = useCallback(
    (value: T) => {
      setCurrent((prev) => {
        pastRef.current = [...pastRef.current, prev].slice(-maxHistory);
        futureRef.current = [];
        return value;
      });
      forceRender((n) => n + 1);
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    setCurrent((prev) => {
      const past = [...pastRef.current];
      const previous = past.pop()!;
      pastRef.current = past;
      futureRef.current = [prev, ...futureRef.current];
      return previous;
    });
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setCurrent((prev) => {
      const future = [...futureRef.current];
      const next = future.shift()!;
      futureRef.current = future;
      pastRef.current = [...pastRef.current, prev];
      return next;
    });
    forceRender((n) => n + 1);
  }, []);

  const reset = useCallback((value: T) => {
    setCurrent(value);
    pastRef.current = [];
    futureRef.current = [];
    forceRender((n) => n + 1);
  }, []);

  return {
    current,
    set,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}
