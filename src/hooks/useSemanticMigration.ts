// ABOUTME: Hook that detects and applies semantic migration when a chapter is loaded.
// ABOUTME: Returns ambiguous nodes for display and a dismiss callback.

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { migrateContent, type MigrationAmbiguity } from '@/application/migration/ContentMigrator';

export function useSemanticMigration(
  editor: Editor | null,
  chapterId: string | null | undefined
) {
  const [ambiguities, setAmbiguities] = useState<MigrationAmbiguity[]>([]);

  useEffect(() => {
    if (!editor) return;

    const raw = editor.getJSON();
    const result = migrateContent(raw as Parameters<typeof migrateContent>[0]);

    if (!result.wasAlreadyMigrated) {
      editor.commands.setContent(result.content, { emitUpdate: true });
    }

    let cancelled = false;
    globalThis.queueMicrotask(() => {
      if (!cancelled) {
        setAmbiguities(result.wasAlreadyMigrated ? [] : result.ambiguities);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chapterId, editor]); // Run when TipTap becomes ready and when the active chapter changes

  return {
    ambiguities,
    dismissAmbiguities: () => setAmbiguities([]),
  };
}
