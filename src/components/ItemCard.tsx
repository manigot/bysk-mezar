'use client';

import { useEffect, useRef, useState } from 'react';
import { getBouquet, parseBouquetContent } from '@/lib/bouquets';
import type { BoardItem } from '@/types/board';

export type ItemCardProps = {
  item: BoardItem & {
    isDirty: boolean;
    isPersisted: boolean;
    isSaving?: boolean;
  };
  onChange: (item: BoardItem & { isDirty: boolean; isPersisted: boolean; isSaving?: boolean }) => void;
  onDelete?: (id: string) => void;
  onSave?: (id: string) => void;
};

export function ItemCard({ item, onChange, onDelete, onSave }: ItemCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeOffset = useRef({ x: 0, y: 0 });
  const sizeOrigin = useRef({ width: item.width, height: item.height, x: item.x, y: item.y });

  const getBoardRect = () => cardRef.current?.parentElement?.getBoundingClientRect() ?? null;

  useEffect(() => {
    sizeOrigin.current = { width: item.width, height: item.height, x: item.x, y: item.y };
  }, [item.height, item.width, item.x, item.y]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const boardRect = getBoardRect();
      if (!boardRect) return;
      const pointerX = event.clientX - boardRect.left;
      const pointerY = event.clientY - boardRect.top;

      const maxX = Math.max(0, boardRect.width - item.width);
      const maxY = Math.max(0, boardRect.height - item.height);

      if (isDragging) {
        const newX = Math.min(Math.max(0, pointerX - dragOffset.current.x), maxX);
        const newY = Math.min(Math.max(0, pointerY - dragOffset.current.y), maxY);
        onChange({ ...item, x: newX, y: newY });
      }

      if (isResizing) {
        const width = Math.max(120, pointerX - sizeOrigin.current.x - resizeOffset.current.x);
        const height = Math.max(90, pointerY - sizeOrigin.current.y - resizeOffset.current.y);
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
    const boardRect = getBoardRect();
    if (!boardRect) return;
    const pointerX = event.clientX - boardRect.left;
    const pointerY = event.clientY - boardRect.top;
    dragOffset.current = {
      x: pointerX - item.x,
      y: pointerY - item.y,
    };
    cardRef.current?.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const boardRect = getBoardRect();
    if (!boardRect) return;
    const pointerX = event.clientX - boardRect.left;
    const pointerY = event.clientY - boardRect.top;
    resizeOffset.current = {
      x: pointerX - (item.x + item.width),
      y: pointerY - (item.y + item.height),
    };
    sizeOrigin.current = { width: item.width, height: item.height, x: item.x, y: item.y };
    cardRef.current?.setPointerCapture(event.pointerId);
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
        <div className="flex items-center gap-2 text-[11px] font-medium">
          {item.isDirty ? <span className="rounded-full bg-amber-500/80 px-2 py-0.5 text-slate-900">Kaydet</span> : null}
          {item.isSaving ? <span className="text-slate-300">Kaydediliyor...</span> : null}
        </div>
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
          className="absolute bottom-2 right-10 h-4 w-4 cursor-se-resize rounded bg-slate-100/70"
          aria-label="Resize handle"
        />
        {onSave ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSave(item.id);
            }}
            disabled={item.isSaving}
            className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200/90 text-xs font-bold text-emerald-800 shadow-md transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Kaydet"
          >
            ✓
          </button>
        ) : null}
      </div>
    </div>
  );
}
