// ABOUTME: Deterministic chapter fixture used to prove paged rendering during the spike.
// ABOUTME: Keeps preview and export inputs identical without touching persisted projects.

import type { JSONContent } from '@tiptap/core';

export const PAGED_CHAPTER_FIXTURE: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Chapitre premier' }],
    },
    ...Array.from({ length: 12 }, (_, index) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: `Paragraphe ${index + 1} — La pluie glissait sur les vitres de la gare tandis qu’Élise relisait la lettre. Chaque phrase déplaçait le silence autour d’elle.` }],
    })),
  ],
};
