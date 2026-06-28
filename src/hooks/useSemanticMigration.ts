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

    setAmbiguities([]);

    const raw = editor.getJSON();
    const result = migrateContent(raw as Parameters<typeof migrateContent>[0]);

    if (!result.wasAlreadyMigrated) {
      editor.commands.setContent(result.content, { emitUpdate: true });
      setAmbiguities(result.ambiguities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]); // Run only when the active chapter changes, not on every editor update

  return {
    ambiguities,
    dismissAmbiguities: () => setAmbiguities([]),
  };
}
