// ABOUTME: Inline atom TipTap node for an endnote call (numbered superscript).
// ABOUTME: The note body is stored as rich TipTap JSON in attrs; numbering is positional.

import { Node, mergeAttributes } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, type EditorState } from '@tiptap/pm/state';

export const ENDNOTE_REF_NAME = 'endnoteRef';

// The note body is a TipTap document fragment (one paragraph of rich inline text:
// bold / italic / link). Kept as an opaque JSON object so any consumer can render
// it however it needs (in-editor it is never shown; only the numbered call is).
export type EndnoteContent = Record<string, unknown>;

/** A call node located in the document, paired with its body. */
export interface EndnoteRefTarget {
  /** Document position of the call node. */
  pos: number;
  /** The note body, or null for an empty note. */
  content: EndnoteContent | null;
}

export interface EndnoteEntry extends EndnoteRefTarget {
  /** 1-based number, reflecting document order. */
  number: number;
}

/** Read a call node's body, normalising a missing attr to null. */
function readEndnoteContent(node: PMNode): EndnoteContent | null {
  return (node.attrs.content as EndnoteContent | null) ?? null;
}

export interface EndnoteRefOptions {
  HTMLAttributes: Record<string, string>;
  /** Fired by the Ctrl+Alt+N shortcut — the host opens the insertion modal. */
  onTrigger: () => void;
  /** Fired when an existing call is clicked — the host reopens the modal to edit. */
  onActivate: (pos: number, content: EndnoteContent | null) => void;
  /** Fired when a non-empty note is about to be deleted — the host confirms first. */
  onDeleteRequest: (pos: number, content: EndnoteContent | null) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    endnoteRef: {
      /** Insert a new endnote call at the current selection. */
      insertEndnote: (content: EndnoteContent | null) => ReturnType;
      /** Replace the body of the note at the given position. */
      updateEndnote: (pos: number, content: EndnoteContent | null) => ReturnType;
      /** Remove the note at the given position. */
      deleteEndnote: (pos: number) => ReturnType;
    };
  }
}

/**
 * True when a note has no meaningful text — used to decide whether deleting the
 * call needs a confirmation prompt.
 */
export function isEndnoteContentEmpty(content: EndnoteContent | null | undefined): boolean {
  if (!content) return true;
  const stack: unknown[] = [content];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    const record = node as Record<string, unknown>;
    if (typeof record.text === 'string' && record.text.trim() !== '') return false;
    if (Array.isArray(record.content)) stack.push(...record.content);
  }
  return true;
}

/**
 * Collect every endnote call in the document, in reading order, numbered 1..N.
 * This is the single source of truth for numbering — the visible superscript is a
 * CSS counter over the same document order, and the reading/export views reuse this.
 */
export function collectEndnoteRefs(doc: PMNode): EndnoteEntry[] {
  const entries: EndnoteEntry[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === ENDNOTE_REF_NAME) {
      entries.push({ pos, number: entries.length + 1, content: readEndnoteContent(node) });
    }
    return true;
  });
  return entries;
}

/**
 * Resolve a 1-based rank (as shown in the endnotes panel, matching document order) to its
 * call's document position and body. Rank is only ever converted to a position at the moment
 * of acting on a note — never while rendering a list of notes, since a position captured
 * earlier goes stale the instant the author types before it.
 */
export function findEndnoteRefByRank(doc: PMNode, rank: number): EndnoteRefTarget | null {
  const entry = collectEndnoteRefs(doc).find((e) => e.number === rank);
  return entry ? { pos: entry.pos, content: entry.content } : null;
}

/**
 * Find the endnote call a Backspace ('before') or Delete ('after') keypress would
 * remove, so the host can confirm before dropping a non-empty note. Also matches a
 * NodeSelection sitting directly on a call. Returns null when none is adjacent.
 */
export function findDeletableEndnoteRef(
  state: EditorState,
  direction: 'before' | 'after'
): EndnoteRefTarget | null {
  const { selection } = state;
  const { $from, empty } = selection;

  // A call selected as a whole (e.g. click-selected then Delete).
  const selectedNode = (selection as { node?: PMNode }).node;
  if (selectedNode && selectedNode.type.name === ENDNOTE_REF_NAME) {
    return { pos: selection.from, content: readEndnoteContent(selectedNode) };
  }

  if (!empty) return null;

  if (direction === 'before') {
    const before = $from.nodeBefore;
    if (before && before.type.name === ENDNOTE_REF_NAME) {
      return { pos: $from.pos - before.nodeSize, content: readEndnoteContent(before) };
    }
    return null;
  }

  const after = $from.nodeAfter;
  if (after && after.type.name === ENDNOTE_REF_NAME) {
    return { pos: $from.pos, content: readEndnoteContent(after) };
  }
  return null;
}

export const EndnoteRef = Node.create<EndnoteRefOptions>({
  name: ENDNOTE_REF_NAME,

  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      onTrigger: () => {},
      onActivate: () => {},
      onDeleteRequest: () => {},
    };
  },

  addAttributes() {
    return {
      content: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-endnote-content');
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.content) return {};
          return { 'data-endnote-content': JSON.stringify(attributes.content) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-endnote]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-endnote': '',
        class: 'endnote-ref',
      }),
    ];
  },

  addCommands() {
    return {
      insertEndnote:
        (content) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { content: content ?? null },
          }),
      updateEndnote:
        (pos, content) =>
        ({ tr, dispatch, state }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== this.name) return false;
          if (dispatch) tr.setNodeAttribute(pos, 'content', content ?? null);
          return true;
        },
      deleteEndnote:
        (pos) =>
        ({ tr, dispatch, state }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== this.name) return false;
          if (dispatch) tr.delete(pos, pos + node.nodeSize);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    // Ctrl+Alt+N on Windows / Cmd+Alt+N on Mac. Avoids Mod-i, Mod-k, Tab,
    // Mod-1..9 and Mod-Enter, which are already bound elsewhere in the editor.
    const requestDelete = (direction: 'before' | 'after') => {
      const found = findDeletableEndnoteRef(this.editor.state, direction);
      if (!found) return false;
      // Empty notes vanish silently; non-empty ones ask the host to confirm.
      if (isEndnoteContentEmpty(found.content)) return false;
      this.options.onDeleteRequest(found.pos, found.content);
      return true;
    };

    return {
      'Mod-Alt-n': () => {
        this.options.onTrigger();
        return true;
      },
      Backspace: () => requestDelete('before'),
      Delete: () => requestDelete('after'),
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const name = this.name;
    return [
      new Plugin({
        props: {
          handleClickOn(_view, _pos, node, nodePos) {
            if (node.type.name !== name) return false;
            options.onActivate(nodePos, readEndnoteContent(node));
            return true;
          },
        },
      }),
    ];
  },
});
