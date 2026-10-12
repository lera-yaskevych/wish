import type { Wish } from '@/data/types';

export const firstName = (name: string) => name.trim().split(/\s+/)[0];

export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

// A wish with nothing but its text is shown as a handwritten-style note.
export const isNoteOnly = (wish: Pick<Wish, 'note' | 'url' | 'price' | 'imageUri'>) =>
  !wish.note && !wish.url && !wish.price && !wish.imageUri;
