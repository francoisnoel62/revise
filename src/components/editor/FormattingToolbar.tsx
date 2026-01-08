// ABOUTME: Rich text formatting toolbar for TipTap editor
// ABOUTME: Provides buttons for bold, italic, underline, highlight with keyboard shortcuts

'use client';

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
} from 'lucide-react';
import { ProviderSelect } from './ProviderSelect';
import { SafeProvider } from '@/app/actions/provider-actions';

interface FormattingToolbarProps {
  editor: Editor | null;
  hasSelection?: boolean;
  onRewrite?: () => void;
  rewriteLoading?: boolean;
  providers?: SafeProvider[];
  selectedProviderId?: string | null;
  onProviderChange?: (providerId: string | null) => void;
  providersLoading?: boolean;
}

export function FormattingToolbar({
  editor,
  hasSelection = false,
  onRewrite,
  rewriteLoading = false,
  providers = [],
  selectedProviderId = null,
  onProviderChange,
  providersLoading = false,
}: FormattingToolbarProps) {
  if (!editor) return null;

  // Guard: Don't render until editor view is ready
  if (!editor.view || editor.isDestroyed) return null;

  // Helper to get current alignment icon
  const getAlignmentIcon = () => {
    const currentAlign = editor.getAttributes('paragraph').textAlign || 'justify';
    switch (currentAlign) {
      case 'left':
        return <AlignLeft className="h-4 w-4" />;
      case 'center':
        return <AlignCenter className="h-4 w-4" />;
      case 'right':
        return <AlignRight className="h-4 w-4" />;
      case 'justify':
      default:
        return <AlignJustify className="h-4 w-4" />;
    }
  };

  // Helper to cycle through alignments
  const cycleAlignment = () => {
    if (!editor.view || editor.isDestroyed) return;
    const alignments = ['left', 'center', 'right', 'justify'];
    const current = editor.getAttributes('paragraph').textAlign || 'justify';
    const currentIndex = alignments.indexOf(current);
    const nextAlign = alignments[(currentIndex + 1) % 4];
    editor.chain().focus().setTextAlign(nextAlign).run();
  };

  return (
    <div className="border-b border-slate-200 p-2 flex gap-1 bg-slate-50 justify-between">
      <div className="flex gap-1">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className="w-9 h-9"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className="w-9 h-9"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className="w-9 h-9"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          disabled={!editor.can().chain().focus().toggleHighlight().run()}
          title="Highlight (Ctrl+Shift+H)"
          className="w-9 h-9"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        {/* Separator */}
        <div className="w-px h-8 bg-slate-300 mx-1" />

        {/* Font Family Toggle */}
        <Button
          variant={
            editor.getAttributes('textStyle').fontFamily === 'Times New Roman'
              ? 'default'
              : 'ghost'
          }
          size="sm"
          onClick={() => {
            if (!editor.view || editor.isDestroyed) return;
            const current = editor.getAttributes('textStyle').fontFamily;
            const newFont =
              current === 'Times New Roman' ? 'Georgia' : 'Times New Roman';
            editor.chain().focus().setFontFamily(newFont).run();
          }}
          title="Police (Georgia ↔ Times New Roman)"
          className="w-9 h-9"
        >
          <Type className="h-4 w-4" />
        </Button>

        {/* Font Size Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Taille de police" className="w-auto px-2">
              {editor.getAttributes('textStyle').fontSize || '13pt'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {['11pt', '12pt', '13pt', '14pt', '16pt'].map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => {
                  if (!editor.view || editor.isDestroyed) return;
                  editor.chain().focus().setFontSize(size).run();
                }}
                className={
                  editor.getAttributes('textStyle').fontSize === size
                    ? 'bg-slate-100'
                    : ''
                }
              >
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Alignment Cycle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleAlignment}
          title="Alignement (cycle: gauche/centre/droite/justifié)"
          className="w-9 h-9"
        >
          {getAlignmentIcon()}
        </Button>

        {/* First-line Indent Toggle */}
        <Button
          variant={editor.getAttributes('paragraph').indent ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleIndent().run()}
          title="Retrait 1ère ligne (1.27cm)"
          className="w-9 h-9"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
      </div>

      {onRewrite && (
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={hasSelection && selectedProviderId ? 'default' : 'ghost'}
            size="sm"
            onClick={onRewrite}
            disabled={!hasSelection || rewriteLoading || !selectedProviderId}
            title={
              !selectedProviderId
                ? 'Configurez un fournisseur IA dans votre profil'
                : 'Réécrire la sélection'
            }
          >
            {rewriteLoading ? 'Génération...' : 'Réécrire'}
          </Button>
          {onProviderChange && (
            <ProviderSelect
              providers={providers}
              selectedProviderId={selectedProviderId}
              onSelect={onProviderChange}
              disabled={rewriteLoading}
              loading={providersLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}
