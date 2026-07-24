// ABOUTME: Centered modal to compose an endnote's body with a mini TipTap editor.
// ABOUTME: Supports bold / italic / link; returns the body as TipTap JSON on validate.

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { Bold as BoldIcon, Italic as ItalicIcon, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EndnoteContent } from './extensions/EndnoteRef';

const EMPTY_NOTE: EndnoteContent = { type: 'doc', content: [{ type: 'paragraph' }] };

// A toolbar toggle for an inline mark (bold / italic) in the note editor.
function MarkButton({
  editor,
  mark,
  label,
  icon,
  onToggle,
}: {
  editor: Editor;
  mark: string;
  label: string;
  icon: ReactNode;
  onToggle: () => void;
}) {
  const active = editor.isActive(mark);
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className="w-8 h-8"
      onClick={onToggle}
    >
      {icon}
    </Button>
  );
}

interface EndnoteModalProps {
  open: boolean;
  /** Existing note body when editing; null/undefined when inserting a new note. */
  initialContent?: EndnoteContent | null;
  onSubmit: (content: EndnoteContent) => void;
  onCancel: () => void;
}

// The editor lives in a child so its hooks mount/unmount with the dialog, giving a
// fresh instance (and fresh pre-fill) each time the modal opens.
function NoteEditorForm({
  initialContent,
  onSubmit,
  onCancel,
}: {
  initialContent?: EndnoteContent | null;
  onSubmit: (content: EndnoteContent) => void;
  onCancel: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Link.configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({ placeholder: 'Saisissez le contenu de la note…' }),
    ],
    content: initialContent ?? EMPTY_NOTE,
    editorProps: {
      attributes: { class: 'endnote-modal-editor focus:outline-none tiptap' },
    },
  });

  // Focus the note body once the editor is ready, without scrolling the caret into
  // view (jsdom lacks layout, and the modal is already fully visible).
  useEffect(() => {
    editor?.commands.focus('end', { scrollIntoView: false });
  }, [editor]);

  if (!editor) return null;

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  };

  const openLinkInput = () => {
    setLinkUrl((editor.getAttributes('link').href as string) ?? '');
    setLinkOpen((v) => !v);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <MarkButton
          editor={editor}
          mark="bold"
          label="Gras"
          icon={<BoldIcon className="h-4 w-4" />}
          onToggle={() => editor.chain().focus().toggleBold().run()}
        />
        <MarkButton
          editor={editor}
          mark="italic"
          label="Italique"
          icon={<ItalicIcon className="h-4 w-4" />}
          onToggle={() => editor.chain().focus().toggleItalic().run()}
        />
        <Button
          type="button"
          variant={editor.isActive('link') || linkOpen ? 'default' : 'ghost'}
          size="sm"
          aria-label="Lien"
          aria-pressed={editor.isActive('link')}
          title="Lien"
          className="w-8 h-8"
          onClick={openLinkInput}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            type="url"
            placeholder="https://exemple.fr"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
            className="h-8 text-sm"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Appliquer
          </Button>
        </div>
      )}

      <div className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm">
        <EditorContent editor={editor} />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" onClick={() => onSubmit(editor.getJSON() as EndnoteContent)}>
          Valider
        </Button>
      </DialogFooter>
    </div>
  );
}

export function EndnoteModal({ open, initialContent, onSubmit, onCancel }: EndnoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Note de fin</DialogTitle>
          <DialogDescription>
            La note apparaît comme un appel numéroté dans le texte et sera compilée en fin de
            chapitre à l’export.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <NoteEditorForm
            initialContent={initialContent}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
