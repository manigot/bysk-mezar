export type BouquetOption = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  gradient: string;
  accent: string;
};

export const BOUQUETS: BouquetOption[] = [
  {
    id: 'white-lily',
    title: 'Beyaz Zambak Buketi',
    emoji: '🤍',
    description: 'Saflık ve saygı için',
    gradient: 'rgba(226,232,240,0.9), rgba(148,163,184,0.75)',
    accent: 'rgba(148,163,184,0.9)',
  },
  {
    id: 'red-rose',
    title: 'Kırmızı Gül Demeti',
    emoji: '🌹',
    description: 'Sonsuz sevgi ve özlem',
    gradient: 'rgba(248,113,113,0.85), rgba(190,24,93,0.7)',
    accent: 'rgba(190,24,93,0.9)',
  },
  {
    id: 'white-rose',
    title: 'Beyaz Gül Buketi',
    emoji: '🥀',
    description: 'Huzur ve veda',
    gradient: 'rgba(148,163,184,0.75), rgba(15,23,42,0.85)',
    accent: 'rgba(226,232,240,0.9)',
  },
  {
    id: 'lavender',
    title: 'Lavanta Demeti',
    emoji: '💜',
    description: 'Rahatlık ve anılar',
    gradient: 'rgba(168,85,247,0.85), rgba(76,29,149,0.8)',
    accent: 'rgba(192,132,252,0.9)',
  },
  {
    id: 'wildflowers',
    title: 'Kır Çiçekleri',
    emoji: '💐',
    description: 'Doğal bir veda',
    gradient: 'rgba(52,211,153,0.8), rgba(5,150,105,0.75)',
    accent: 'rgba(16,185,129,0.95)',
  },
  {
    id: 'orchid',
    title: 'Orkide Aranjmanı',
    emoji: '🕊️',
    description: 'Zarif bir hatırlama',
    gradient: 'rgba(248,250,252,0.85), rgba(148,163,184,0.7)',
    accent: 'rgba(100,116,139,0.9)',
  },
];

export const DEFAULT_BOUQUET_ID = 'white-lily';

export function encodeBouquetContent(note: string, bouquetId: string = DEFAULT_BOUQUET_ID): string {
  return JSON.stringify({ note, bouquetId });
}

export function parseBouquetContent(content: string): { note: string; bouquetId: string } {
  try {
    const data = JSON.parse(content);
    if (typeof data.note === 'string') {
      return {
        note: data.note,
        bouquetId: typeof data.bouquetId === 'string' ? data.bouquetId : DEFAULT_BOUQUET_ID,
      };
    }
  } catch {
    // Fallback to legacy text content
  }

  return { note: content, bouquetId: DEFAULT_BOUQUET_ID };
}

export function getBouquet(bouquetId: string): BouquetOption {
  return BOUQUETS.find((bouquet) => bouquet.id === bouquetId) ?? BOUQUETS.find((bouquet) => bouquet.id === DEFAULT_BOUQUET_ID)!;
}
