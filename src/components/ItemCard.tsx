'use client';

import { useEffect, useRef, useState } from 'react';
import { getBouquet, parseBouquetContent } from '@/lib/bouquets';
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

  const { note, bouquetId } = parseBouquetContent(item.content);
  const bouquet = getBouquet(bouquetId);

  return (
    <div
      ref={cardRef}
      className="group absolute overflow-hidden rounded-xl border shadow-xl"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        background: `linear-gradient(135deg, ${bouquet.gradient})`,
        borderColor: bouquet.accent,
      }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab items-center justify-between bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-100"
      >
        <span className="flex items-center gap-2">
          <span>{bouquet.emoji}</span>
          <span>{bouquet.title}</span>
        </span>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="text-xs text-rose-200 hover:text-rose-50"
            aria-label="Delete item"
          >
            ✕
          </button>
        ) : null}
      </div>
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-3 pb-5 pt-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${bouquet.gradient})`, color: bouquet.accent }}
        >
          {bouquet.emoji}
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-50/90">Buket</p>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 max-h-36 overflow-hidden rounded-lg bg-slate-950/80 p-3 text-sm leading-relaxed text-slate-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
          <p className="whitespace-pre-line">{note || 'Not eklenmedi'}</p>
        </div>
        <div
          onPointerDown={startResize}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded bg-slate-100/70"
          aria-label="Resize handle"
        />
      </div>
    </div>
  );
}
