'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ItemCard } from '@/components/ItemCard';
import { BOUQUETS, DEFAULT_BOUQUET_ID, encodeBouquetContent, parseBouquetContent } from '@/lib/bouquets';
import type { BoardItem } from '@/types/board';

const DEFAULT_SIZE = { width: 220, height: 180 };

export default function BoardPage() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('Sevgi ve özlemle...');
  const pendingUpdates = useRef<Record<string, number>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('board_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const queueUpdate = useCallback((item: BoardItem) => {
    if (pendingUpdates.current[item.id]) {
      window.clearTimeout(pendingUpdates.current[item.id]);
    }

    pendingUpdates.current[item.id] = window.setTimeout(async () => {
      await supabase
        .from('board_items')
        .update({
          content: item.content,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        })
        .eq('id', item.id);
      delete pendingUpdates.current[item.id];
    }, 400);
  }, []);

  const updateLocalItem = useCallback(
    (updated: BoardItem) => {
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      queueUpdate(updated);
    },
    [queueUpdate],
  );

  const addItemAtPosition = useCallback(
    async (bouquetId: string, noteValue: string, x: number, y: number) => {
      const content = encodeBouquetContent(noteValue, bouquetId);

      const { data, error: insertError } = await supabase
        .from('board_items')
        .insert({
          content,
          x,
          y,
          width: DEFAULT_SIZE.width,
          height: DEFAULT_SIZE.height,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (data) {
        setItems((prev) => [...prev, data]);
      }
    },
    [],
  );

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const rawData = event.dataTransfer.getData('text/plain');
    const parsed = parseBouquetContent(rawData || '');
    const bouquetId = parsed.bouquetId || DEFAULT_BOUQUET_ID;
    const noteValue = parsed.note || newNote || 'Yeni not';
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    await addItemAtPosition(bouquetId, noteValue, x, y);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('board_items').delete().eq('id', id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const allowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleTemplateDragStart = (event: React.DragEvent<HTMLDivElement>, bouquetId: string) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', encodeBouquetContent(newNote || 'Yeni not', bouquetId));
  };

  const handleQuickPlace = (bouquetId: string) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const noteValue = newNote || 'Yeni not';
    const centerX = Math.max(16, Math.min(rect.width - DEFAULT_SIZE.width - 16, rect.width / 2 - DEFAULT_SIZE.width / 2));
    const y = 16;
    void addItemAtPosition(bouquetId, noteValue, centerX, y);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 pb-6 pt-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/80 p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-indigo-500/80" />
          <div>
            <h1 className="text-xl font-semibold">Lightweight Board</h1>
            <p className="text-sm text-slate-300">Supabase + Next.js (no realtime, manual refresh)</p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchItems()}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Refresh
          </button>
          {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
          {error ? <span className="text-xs text-rose-300">{error}</span> : null}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <div className="order-2 space-y-4 rounded-xl bg-slate-800/80 p-4 shadow md:order-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-200/70 to-slate-200/70 text-xl">
              🌸
            </div>
            <div>
              <h2 className="text-lg font-semibold">Çiçek Paleti</h2>
              <p className="text-xs text-slate-300">Notunu yaz, buketi sürükle ve mezara bırak.</p>
            </div>
          </div>

          <label className="block space-y-1 text-sm text-slate-200">
            <span>Kısa not</span>
            <textarea
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              className="min-h-[72px] w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm outline-none"
              placeholder="Notunuzu yazın"
            />
          </label>

          <div className="grid grid-cols-1 gap-2">
            {BOUQUETS.map((bouquet) => (
              <div
                key={bouquet.id}
                draggable
                onDragStart={(event) => handleTemplateDragStart(event, bouquet.id)}
                className="group flex cursor-grab items-center justify-between rounded-lg border border-slate-600/70 bg-slate-900/70 px-3 py-3 transition hover:border-slate-400"
                style={{ boxShadow: `0 8px 18px rgba(0,0,0,0.2)` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ background: `linear-gradient(135deg, ${bouquet.gradient})`, color: bouquet.accent }}>
                    {bouquet.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{bouquet.title}</p>
                    <p className="text-xs text-slate-400">{bouquet.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                  <span className="hidden md:inline opacity-0 transition group-hover:opacity-100">Sürükle</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleQuickPlace(bouquet.id);
                    }}
                    className="rounded-md bg-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-50 shadow hover:bg-slate-600 md:hidden"
                  >
                    Hızlı bırak
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Buketler sürükleyip bıraktıktan sonra notlar çiçeklerin üzerine gelince görünür. Dilersen dışarıdan düz yazı da
            bırakabilirsin.
          </p>
        </div>

        <div
          ref={boardRef}
          onDrop={handleDrop}
          onDragOver={allowDrop}
          className="relative order-1 min-h-[70vh] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 md:order-2"
        >
          <div className="pointer-events-none absolute left-0 top-0 flex w-full flex-wrap items-center gap-2 bg-slate-900/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300 backdrop-blur md:hidden">
            <span>Dokun &amp; Bırak</span>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200">Mobil için hızlı bırak aktif</span>
          </div>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onChange={updateLocalItem} onDelete={handleDelete} />
          ))}
          {items.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Drop an item to get started.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl bg-slate-800/80 p-4 text-sm text-slate-200 shadow">
        <h2 className="mb-2 text-base font-semibold">Supabase schema</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <code>board_items</code> table with <code>id</code>, <code>content</code>, <code>x</code>, <code>y</code>,{' '}
            <code>width</code>, <code>height</code>, <code>created_by</code>, <code>created_at</code>, <code>updated_at</code> columns.
          </li>
          <li>RLS: authenticated users can read; inserts enforce created_by = auth.uid(); updates/deletes allowed only on own rows (or open policy variant).</li>
          <li>Manual refresh triggers a new fetch; no realtime channel is used.</li>
        </ul>
      </section>
    </main>
  );
}
