'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ItemCard } from '@/components/ItemCard';
import type { BoardItem } from '@/types/board';

const DEFAULT_SIZE = { width: 220, height: 140 };

export default function BoardPage() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('My sticky note');
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

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const content = event.dataTransfer.getData('text/plain') || 'New item';
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
  };

  const handleDelete = async (id: string) => {
    await supabase.from('board_items').delete().eq('id', id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const allowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleTemplateDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', newContent || 'New item');
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-3 rounded-xl bg-slate-800/80 p-4 shadow">
          <h2 className="text-lg font-semibold">Palette</h2>
          <label className="block text-sm text-slate-300">
            Item text
            <input
              value={newContent}
              onChange={(event) => setNewContent(event.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm outline-none"
              placeholder="Drop text for new items"
            />
          </label>
          <div
            draggable
            onDragStart={handleTemplateDragStart}
            className="flex cursor-grab items-center justify-between rounded-lg border border-dashed border-slate-500/70 bg-slate-900/60 px-3 py-3 text-sm"
          >
            <span>Drag & drop to create</span>
            <span className="text-xs text-slate-400">+ item</span>
          </div>
          <p className="text-xs text-slate-400">
            You can also drop any plain text into the board. Items are stored with your auth user as
            <code className="ml-1 rounded bg-slate-900 px-1">created_by</code>.
          </p>
        </div>

        <div
          ref={boardRef}
          onDrop={handleDrop}
          onDragOver={allowDrop}
          className="relative min-h-[70vh] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        >
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
