// ABOUTME: Custom paragraph node with first-line indent support
// ABOUTME: Extends TipTap Paragraph to add indent attribute (1.27cm when enabled)

import { Node, mergeAttributes } from '@tiptap/core';

export interface IndentParagraphOptions {
  HTMLAttributes: Record<string, string>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indentParagraph: {
      /**
       * Toggle first-line indent on current paragraph
       */
      toggleIndent: () => ReturnType;
      /**
       * Set first-line indent on current paragraph
       */
      setIndent: (indent: boolean) => ReturnType;
    };
  }
}

export const IndentParagraph = Node.create<IndentParagraphOptions>({
  name: 'paragraph',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      indent: {
        default: undefined,
        keepOnSplit: true, // Inherit indent when creating new paragraph
        parseHTML: (element) => {
          const dataIndent = element.getAttribute('data-indent');
          if (dataIndent === 'true') {
            return true;
          }
          return undefined;
        },
        renderHTML: (attributes) => {
          if (!attributes.indent) {
            return {};
          }

          return {
            'data-indent': 'true',
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleIndent:
        () =>
        ({ commands, state }) => {
          // Check if current node is a paragraph
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name !== 'paragraph') {
            return false;
          }

          // Get current indent value
          const currentIndent = node.attrs.indent;

          // Toggle: if true -> undefined, if undefined/false -> true
          const newIndent = currentIndent ? undefined : true;

          return commands.updateAttributes('paragraph', { indent: newIndent });
        },
      setIndent:
        (indent: boolean) =>
        ({ commands, state }) => {
          // Check if current node is a paragraph
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name !== 'paragraph') {
            return false;
          }

          // Set indent: true or undefined (not false, to keep HTML clean)
          const newIndent = indent ? true : undefined;

          return commands.updateAttributes('paragraph', { indent: newIndent });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setHardBreak(),
    };
  },
});
