// ABOUTME: Custom heading node with first-line indent and semantic role support.
// ABOUTME: Extends TipTap Heading to add indent attribute (1.27cm when enabled).

import { Node, mergeAttributes } from '@tiptap/core';
import { isSemanticRole } from '@/domain/value-objects/SemanticRole';

export interface IndentHeadingOptions {
  HTMLAttributes: Record<string, string>;
  levels: number[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indentHeading: {
      /** Toggle first-line indent on current heading */
      toggleHeadingIndent: () => ReturnType;
      /** Set first-line indent on current heading */
      setHeadingIndent: (indent: boolean) => ReturnType;
      /** Convert current block to a heading at the given level */
      setHeading: (attrs: { level: number }) => ReturnType;
      /** Toggle between heading at the given level and paragraph */
      toggleHeading: (attrs: { level: number }) => ReturnType;
    };
  }
}

export const IndentHeading = Node.create<IndentHeadingOptions>({
  name: 'heading',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      levels: [1, 2, 3, 4, 5, 6],
    };
  },

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
      semanticRole: {
        default: undefined,
        parseHTML: (element) => {
          const role = element.getAttribute('data-semantic-role');
          return isSemanticRole(role) ? role : undefined;
        },
        renderHTML: (attributes) => {
          if (!attributes.semanticRole) return {};
          return { 'data-semantic-role': attributes.semanticRole };
        },
      },
      indent: {
        default: undefined,
        keepOnSplit: true,
        parseHTML: (element) => {
          // Check for data-indent attribute
          const dataIndent = element.getAttribute('data-indent');
          if (dataIndent === 'true') {
            return true;
          }

          // Check for CSS text-indent style
          const style = element.getAttribute('style');
          if (style) {
            const textIndentMatch = style.match(/text-indent:\s*([^;]+)/i);
            if (textIndentMatch) {
              const value = textIndentMatch[1].trim();
              if (value && value !== '0' && value !== '0px' && value !== '0pt' && value !== '0cm' && value !== '0in' && value !== '0em') {
                return true;
              }
            }
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
    return this.options.levels.map((level) => ({
      tag: `h${level}`,
      attrs: { level },
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleHeadingIndent:
        () =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name !== 'heading') {
            return false;
          }

          const currentIndent = node.attrs.indent;
          const newIndent = currentIndent ? undefined : true;

          return commands.updateAttributes('heading', { indent: newIndent });
        },
      setHeadingIndent:
        (indent: boolean) =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          const node = $from.node();

          if (node.type.name !== 'heading') {
            return false;
          }

          const newIndent = indent ? true : undefined;

          return commands.updateAttributes('heading', { indent: newIndent });
        },
      setHeading:
        ({ level }: { level: number }) =>
        ({ commands }) => {
          if (!this.options.levels.includes(level)) {
            return false;
          }
          return commands.setNode(this.name, { level });
        },
      toggleHeading:
        ({ level }: { level: number }) =>
        ({ commands, state }) => {
          if (!this.options.levels.includes(level)) {
            return false;
          }
          const { $from } = state.selection;
          const node = $from.node();
          if (node.type.name === 'heading' && node.attrs.level === level) {
            return commands.setNode('paragraph', {});
          }
          return commands.setNode(this.name, { level });
        },
    };
  },
});
