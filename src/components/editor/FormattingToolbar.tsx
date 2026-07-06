// ABOUTME: Rich text formatting toolbar for TipTap editor
// ABOUTME: Renders semantic style picker in print-ready profile; manual formatting controls in passerelle

'use client';

import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
  Search,
} from 'lucide-react';

export type EditorProfile = 'print-ready' | 'passerelle';

const SEMANTIC_STYLES = [
  { role: 'corps', label: 'Corps' },
  { role: 'titre-de-chapitre', label: 'Titre de chapitre' },
  { role: 'sous-titre', label: 'Sous-titre' },
  { role: 'citation', label: 'Citation' },
  { role: 'epigraphe', label: 'Épigraphe' },
  { role: 'separateur-de-scene', label: 'Séparateur de scène' },
] as const;

type SemanticStyleRole = (typeof SEMANTIC_STYLES)[number]['role'];

function getActiveSemanticRole(editor: Editor): SemanticStyleRole {
  if (editor.isActive('heading', { level: 1 })) return 'titre-de-chapitre';
  if (editor.isActive('heading')) return 'sous-titre';
  const role = editor.getAttributes('paragraph').semanticRole as SemanticStyleRole | undefined;
  return role ?? 'corps';
}

function applySemanticStyle(editor: Editor, role: SemanticStyleRole): void {
  if (!editor.view || editor.isDestroyed) return;
  if (role === 'titre-de-chapitre') {
    editor
      .chain()
      .focus()
      .setNode('heading', { level: 1, semanticRole: 'titre-de-chapitre' })
      .run();
    return;
  }
  if (role === 'sous-titre') {
    editor
      .chain()
      .focus()
      .setNode('heading', { level: 2, semanticRole: 'sous-titre' })
      .run();
    return;
  }
  if (role === 'separateur-de-scene') {
    editor.chain().focus().setHorizontalRule().run();
    return;
  }
  editor.chain().focus().setNode('paragraph', {}).updateAttributes('paragraph', { semanticRole: role }).run();
}

function SemanticStyleDropdown({ editor }: { editor: Editor }) {
  const activeRole = getActiveSemanticRole(editor);
  const activeLabel = SEMANTIC_STYLES.find((s) => s.role === activeRole)?.label ?? 'Corps';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Style sémantique"
          className="w-auto px-2 text-xs md:text-sm font-medium min-w-24 justify-start"
        >
          {activeLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SEMANTIC_STYLES.map(({ role, label }) => (
          <DropdownMenuItem
            key={role}
            onClick={() => applySemanticStyle(editor, role)}
            className={activeRole === role ? 'bg-slate-100' : ''}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Common font sizes like in Word/Google Docs
const COMMON_FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 100];
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 100;
import { AIMenuDropdown } from './AIMenuDropdown';
import { SafeProvider } from '@/app/actions/provider-actions';
import { ChapterGenerationTypeKey } from '@/domain';

// Font Size Dropdown Component
function FontSizeDropdown({ editor }: { editor: Editor }) {
  const [customSize, setCustomSize] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current font size from editor
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '13pt';
  const currentSizeNumber = parseInt(currentFontSize);

  // Apply font size with validation
  const applyFontSize = (size: number) => {
    if (!editor.view || editor.isDestroyed) return;

    // Clamp size between MIN and MAX
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    editor.chain().focus().setFontSize(`${clampedSize}pt`).run();
    setCustomSize('');
    setIsOpen(false);
  };

  // Handle custom size input
  const handleCustomSizeSubmit = () => {
    const size = parseInt(customSize);
    if (!isNaN(size)) {
      applyFontSize(size);
    }
  };

  // Handle key press in input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSizeSubmit();
    }
  };

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Taille de police"
          className="hidden sm:flex w-auto px-1.5 md:px-2 text-xs md:text-sm"
        >
          {currentFontSize}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 overflow-y-auto">
        {/* Custom size input */}
        <div className="p-2">
          <Input
            ref={inputRef}
            type="number"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            placeholder="Taille (8-100)"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <DropdownMenuSeparator />
        {/* Common font sizes */}
        {COMMON_FONT_SIZES.map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => applyFontSize(size)}
            className={currentSizeNumber === size ? 'bg-slate-100' : ''}
          >
            {size}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FormattingToolbarProps {
  editor: Editor | null;
  profile?: EditorProfile;
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
  isChapterEmpty?: boolean;
  onGenerate?: (type: ChapterGenerationTypeKey) => void;
  generationLoading?: boolean;
  activeGenerationType?: ChapterGenerationTypeKey | null;
  onOpenCommandPalette?: () => void;
  onSearchClick?: () => void;
  onAnalyze?: () => void;
  analysisLoading?: boolean;
}

export function FormattingToolbar({
  editor,
  profile,
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
  isChapterEmpty = false,
  onGenerate,
  generationLoading = false,
  activeGenerationType = null,
  onOpenCommandPalette,
  onSearchClick,
  onAnalyze,
  analysisLoading = false,
}: FormattingToolbarProps) {
  if (!editor) return null;

  // Guard: Don't render until editor view is ready
  if (!editor.view || editor.isDestroyed) return null;

  const isPrintReady = profile === 'print-ready';

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

  const aiMenu = showAIFeatures && onRewrite && onProviderChange && onHistoryClick && onAutocompleteChange && (
    <div className="flex items-center ml-auto mt-1 md:mt-0">
      <AIMenuDropdown
        hasSelection={hasSelection}
        onRewrite={onRewrite}
        rewriteLoading={rewriteLoading}
        isChapterEmpty={isChapterEmpty}
        onGenerate={onGenerate || (() => {})}
        generationLoading={generationLoading}
        activeGenerationType={activeGenerationType}
        providers={providers}
        selectedProviderId={selectedProviderId}
        onProviderChange={onProviderChange}
        providersLoading={providersLoading}
        onHistoryClick={onHistoryClick}
        autocompleteEnabled={autocompleteEnabled}
        onAutocompleteChange={onAutocompleteChange}
        onOpenCommandPalette={onOpenCommandPalette}
        onAnalyze={onAnalyze}
        analysisLoading={analysisLoading}
      />
    </div>
  );

  if (isPrintReady) {
    return (
      <div className="border-b border-slate-200 p-1 md:p-2 flex gap-0.5 md:gap-1 bg-slate-50 justify-between flex-wrap md:flex-nowrap">
        <div className="flex gap-0.5 md:gap-1 flex-wrap md:flex-nowrap items-center">
          {/* Semantic style picker */}
          <SemanticStyleDropdown editor={editor} />

          <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />

          {/* Fiction marks: bold and italic */}
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

          <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />

          {/* Undo/Redo */}
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

          {onSearchClick && (
            <>
              <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearchClick}
                title="Rechercher/Remplacer (Ctrl+F)"
                className="w-8 h-8 md:w-9 md:h-9"
              >
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </>
          )}
        </div>

        {aiMenu}
      </div>
    );
  }

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
        <FontSizeDropdown editor={editor} />

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

        {/* Separator - hidden on mobile */}
        <div className="hidden md:block w-px h-8 bg-slate-300 mx-1" />

        {/* Search/Replace button */}
        {onSearchClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            title="Rechercher/Remplacer (Ctrl+F)"
            className="w-8 h-8 md:w-9 md:h-9"
          >
            <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        )}
      </div>

      {aiMenu}
    </div>
  );
}
