// ABOUTME: Hook recording that the author declined a grammar remark for the project.
// ABOUTME: Drops the matching underlines only once the decision is stored.

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import {
  isIgnoredGrammarIssue,
  toIgnoredGrammarIssue,
} from '@/domain/value-objects/IgnoredGrammarIssue';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import { ignoreGrammarIssueAction } from '@/app/actions/grammar-actions';

/**
 * Returns the palette's decline handler.
 *
 * A misspelling is declined by word — that path belongs to the spell checker.
 * Here the pair (rule family, flagged text) is what the author is waving away,
 * so every underline saying the same thing goes at once rather than one by one.
 */
export function useGrammarIssueDecline(
  editor: Editor | null,
  projectId?: string
): (issue: TextIssue) => Promise<void> {
  return useCallback(
    async (issue: TextIssue) => {
      if (!projectId || issue.nature !== 'grammar') return;

      const declined = toIgnoredGrammarIssue(issue);
      const result = await ignoreGrammarIssueAction(projectId, declined);
      if (!result.success) return;

      if (!editor || editor.isDestroyed) return;
      const pluginState = textIssuePluginKey.getState(editor.state);
      if (!pluginState) return;

      const grammar = pluginState.grammar.filter(
        (candidate) => !isIgnoredGrammarIssue(candidate, [declined])
      );
      editor.view.dispatch(editor.state.tr.setMeta(textIssuePluginKey, { grammar }));
    },
    [editor, projectId]
  );
}
