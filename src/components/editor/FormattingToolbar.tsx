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
  Undo2,
  Redo2,
  History,
  Sparkles,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  onHistoryClick?: () => void;
  autocompleteEnabled?: boolean;
  onAutocompleteChange?: (enabled: boolean) => void;
  showAIFeatures?: boolean;
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
  onHistoryClick,
  autocompleteEnabled = true,
  onAutocompleteChange,
  showAIFeatures = true,
}: FormattingToolbarProps) {
  if (!editor) return null;

  // Guard: Don't render until editor view is ready
  if (!editor.view || editor.isDestroyed) return null;

  // Helper to get current alignment from selected node (paragraph or heading)
  const getCurrentAlignment = (): string => {
    // Check heading first, then paragraph
    const headingAlign = editor.getAttributes('heading').textAlign;
    const paragraphAlign = editor.getAttributes('paragraph').textAlign;
    return headingAlign || paragraphAlign || 'justify';
  };

  // Helper to get current alignment icon
  const getAlignmentIcon = () => {
    const currentAlign = getCurrentAlignment();
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
    const current = getCurrentAlignment();
    const currentIndex = alignments.indexOf(current);
    const nextAlign = alignments[(currentIndex + 1) % 4];
    editor.chain().focus().setTextAlign(nextAlign).run();
  };

  // Helper to get current indent from selected node (paragraph or heading)
  const getCurrentIndent = (): boolean => {
    const headingIndent = editor.getAttributes('heading').indent;
    const paragraphIndent = editor.getAttributes('paragraph').indent;
    return !!(headingIndent || paragraphIndent);
  };

  // Helper to toggle indent on current block (paragraph or heading)
  const toggleBlockIndent = () => {
    if (!editor.view || editor.isDestroyed) return;
    // Try paragraph first, then heading
    if (editor.isActive('paragraph')) {
      editor.chain().focus().toggleIndent().run();
    } else if (editor.isActive('heading')) {
      editor.chain().focus().toggleHeadingIndent().run();
    }
  };

  return (
    <div className="border-b border-slate-200 p-1 md:p-2 flex gap-0.5 md:gap-1 bg-slate-50 justify-between flex-wrap md:flex-nowrap">
      <div className="flex gap-0.5 md:gap-1 flex-wrap md:flex-nowrap">
        {/* Essential formatting buttons - always visible */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <Bold className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <Italic className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <Underline className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <Button
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          disabled={!editor.can().chain().focus().toggleHighlight().run()}
          title="Highlight (Ctrl+Shift+H)"
          className="hidden sm:flex w-8 h-8 md:w-9 md:h-9"
        >
          <Highlighter className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        {/* Separator - hidden on mobile */}
        <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />

        {/* Font controls - hidden on mobile, visible on tablet+ */}
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
          className="hidden lg:flex w-9 h-9"
        >
          <Type className="h-4 w-4" />
        </Button>

        {/* Font Size Dropdown - hidden on small mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Taille de police" className="hidden sm:flex w-auto px-1.5 md:px-2 text-xs md:text-sm">
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

        {/* Text Alignment Cycle - hidden on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleAlignment}
          title="Alignement (cycle: gauche/centre/droite/justifié)"
          className="hidden md:flex w-9 h-9"
        >
          {getAlignmentIcon()}
        </Button>

        {/* First-line Indent Toggle - hidden on mobile */}
        <Button
          variant={getCurrentIndent() ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleBlockIndent}
          title="Retrait 1ère ligne (1.27cm)"
          className="hidden lg:flex w-9 h-9"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>

        {/* Separator - hidden on mobile */}
        <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />

        {/* Undo/Redo - always visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler (Ctrl+Z)"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <Undo2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rétablir (Ctrl+Y)"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <Redo2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      </div>

      {showAIFeatures && onRewrite && (
        <div className="flex items-center gap-1 md:gap-2 ml-auto mt-1 md:mt-0 w-full md:w-auto justify-end">
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
            className="text-xs md:text-sm px-2 md:px-3"
          >
            {rewriteLoading ? <span className="hidden sm:inline">Génération...</span> : <span className="hidden sm:inline">Réécrire</span>}
            {rewriteLoading ? <span className="sm:hidden">...</span> : <Sparkles className="sm:hidden h-4 w-4" />}
          </Button>
          {onProviderChange && (
            <div className="hidden sm:block">
              <ProviderSelect
                providers={providers}
                selectedProviderId={selectedProviderId}
                onSelect={onProviderChange}
                disabled={rewriteLoading}
                loading={providersLoading}
              />
            </div>
          )}
          {onHistoryClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHistoryClick}
              title="Historique des corrections"
              className="w-8 h-8 md:w-9 md:h-9"
            >
              <History className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          )}
          {/* Autocomplete Toggle - hidden on small mobile */}
          {onAutocompleteChange && (
            <>
              <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500" />
                <Switch
                  id="autocomplete-toggle"
                  checked={autocompleteEnabled}
                  onCheckedChange={onAutocompleteChange}
                />
                <Label
                  htmlFor="autocomplete-toggle"
                  className="hidden md:block text-xs text-slate-600 cursor-pointer"
                >
                  Auto
                </Label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
