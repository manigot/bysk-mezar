'use client';

import { useEffect, useRef, useState } from 'react';
import type { BoardItem } from '@/types/board';

export type ItemCardProps = {
  item: BoardItem;
  onChange: (item: BoardItem) => void;
  onDelete?: (id: string) => void;
};

export function ItemCard({ item, onChange, onDelete }: ItemCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const sizeOrigin = useRef({ width: item.width, height: item.height, x: item.x, y: item.y });

  useEffect(() => {
    sizeOrigin.current = { width: item.width, height: item.height, x: item.x, y: item.y };
  }, [item.height, item.width, item.x, item.y]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!cardRef.current) return;

      if (isDragging) {
        const newX = event.clientX - dragOffset.current.x;
        const newY = event.clientY - dragOffset.current.y;
        onChange({ ...item, x: newX, y: newY });
      }

      if (isResizing) {
        const width = Math.max(120, sizeOrigin.current.width + (event.clientX - sizeOrigin.current.x - dragOffset.current.x));
        const height = Math.max(90, sizeOrigin.current.height + (event.clientY - sizeOrigin.current.y - dragOffset.current.y));
        onChange({ ...item, width, height });
      }
    };

    const stop = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', stop);
    }

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [isDragging, isResizing, item, onChange]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setIsDragging(true);
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    sizeOrigin.current = { width: item.width, height: item.height, x: item.x, y: item.y };
    setIsResizing(true);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...item, content: event.target.value });
  };

  return (
    <div
      ref={cardRef}
      className="absolute rounded-xl border border-slate-600 bg-slate-800 shadow-lg"
      style={{ left: item.x, top: item.y, width: item.width, height: item.height }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab items-center justify-between rounded-t-xl bg-slate-700 px-3 py-2 text-sm font-semibold"
      >
        <span>Item</span>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="text-xs text-rose-300 hover:text-rose-200"
            aria-label="Delete item"
          >
            ✕
          </button>
        ) : null}
      </div>
      <div className="relative h-full px-3 pb-3 pt-2">
        <textarea
          value={item.content}
          onChange={handleContentChange}
          className="h-full w-full resize-none rounded-lg bg-slate-900/70 p-2 text-sm text-slate-50 outline-none"
        />
        <div
          onPointerDown={startResize}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded bg-slate-500/60"
          aria-label="Resize handle"
        />
      </div>
    </div>
  );
}
