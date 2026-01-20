// ABOUTME: Unified AI menu dropdown that consolidates all AI features in a single button
// ABOUTME: Replaces scattered AI controls (rewrite, provider, history, autocomplete) with organized menu

'use client';

import { useState } from 'react';
import {
  Sparkles,
  FileText,
  List,
  History,
  Settings2,
  ChevronRight,
  Check,
  Loader2,
  Zap,
  PenLine,
  SpellCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { SafeProvider } from '@/app/actions/provider-actions';
import { CHAPTER_GENERATION_TYPES, ChapterGenerationTypeKey } from '@/domain';

interface AIMenuDropdownProps {
  // Writing actions
  hasSelection: boolean;
  onRewrite: () => void;
  rewriteLoading: boolean;

  // Spell check
  onSpellCheck?: () => void;
  spellCheckLoading?: boolean;
  spellCheckCount?: number;
  spellCheckStale?: boolean;

  // Generation (for empty chapters)
  isChapterEmpty: boolean;
  onGenerate: (type: ChapterGenerationTypeKey) => void;
  generationLoading: boolean;
  activeGenerationType: ChapterGenerationTypeKey | null;

  // Settings
  providers: SafeProvider[];
  selectedProviderId: string | null;
  onProviderChange: (providerId: string | null) => void;
  providersLoading: boolean;
  onHistoryClick: () => void;
  autocompleteEnabled: boolean;
  onAutocompleteChange: (enabled: boolean) => void;

  // Command palette
  onOpenCommandPalette?: () => void;
}

export function AIMenuDropdown({
  hasSelection,
  onRewrite,
  rewriteLoading,
  onSpellCheck,
  spellCheckLoading = false,
  spellCheckCount = 0,
  spellCheckStale = false,
  isChapterEmpty,
  onGenerate,
  generationLoading,
  activeGenerationType,
  providers,
  selectedProviderId,
  onProviderChange,
  providersLoading,
  onHistoryClick,
  autocompleteEnabled,
  onAutocompleteChange,
  onOpenCommandPalette,
}: AIMenuDropdownProps) {
  const [open, setOpen] = useState(false);

  const validProviders = providers.filter((p) => p.isValid);
  const selectedProvider = validProviders.find((p) => p.id === selectedProviderId);
  const hasValidProvider = selectedProviderId !== null && selectedProvider !== undefined;

  const generationOptions = [
    {
      type: 'chapter-beginning' as ChapterGenerationTypeKey,
      icon: Sparkles,
      label: CHAPTER_GENERATION_TYPES['chapter-beginning'].name,
    },
    {
      type: 'chapter-full' as ChapterGenerationTypeKey,
      icon: FileText,
      label: CHAPTER_GENERATION_TYPES['chapter-full'].name,
    },
    {
      type: 'chapter-outline' as ChapterGenerationTypeKey,
      icon: List,
      label: CHAPTER_GENERATION_TYPES['chapter-outline'].name,
    },
  ];

  const handleRewriteClick = () => {
    setOpen(false);
    onRewrite();
  };

  const handleSpellCheckClick = () => {
    setOpen(false);
    onSpellCheck?.();
  };

  const handleGenerateClick = (type: ChapterGenerationTypeKey) => {
    setOpen(false);
    onGenerate(type);
  };

  const handleHistoryClick = () => {
    setOpen(false);
    onHistoryClick();
  };

  const handleCommandPaletteClick = () => {
    setOpen(false);
    onOpenCommandPalette?.();
  };

  // Determine if the menu is in a loading state
  const isLoading = rewriteLoading || generationLoading || spellCheckLoading;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 px-2 md:px-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">IA</span>
          <span className="text-xs opacity-60 hidden md:inline">▾</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Writing Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Écriture
        </DropdownMenuLabel>

        {/* Rewrite - always visible, enabled when selection exists */}
        <DropdownMenuItem
          onClick={handleRewriteClick}
          disabled={!hasSelection || !hasValidProvider || rewriteLoading}
          className="gap-2"
        >
          <PenLine className="h-4 w-4" />
          <span>Réécrire la sélection</span>
          {rewriteLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </DropdownMenuItem>

        {/* Spell check */}
        {onSpellCheck && (
          <DropdownMenuItem
            onClick={handleSpellCheckClick}
            disabled={!hasValidProvider || spellCheckLoading}
            className="gap-2"
          >
            {spellCheckLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SpellCheck className="h-4 w-4" />
            )}
            <span className="flex-1">Vérifier l'orthographe</span>
            {!spellCheckLoading && spellCheckCount > 0 && (
              <span
                className={`min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full flex items-center justify-center ${
                  spellCheckStale
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {spellCheckStale ? '!' : spellCheckCount}
              </span>
            )}
            {!spellCheckLoading && spellCheckCount === 0 && !spellCheckStale && (
              <span className="text-green-600 text-xs">✓</span>
            )}
          </DropdownMenuItem>
        )}

        {/* Generation options - visible when chapter is empty */}
        {isChapterEmpty && (
          <>
            {generationOptions.map((option) => {
              const Icon = option.icon;
              const isActive = activeGenerationType === option.type;

              return (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => handleGenerateClick(option.type)}
                  disabled={!hasValidProvider || generationLoading}
                  className="gap-2"
                >
                  {isActive && generationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />

        {/* Settings Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Paramètres
        </DropdownMenuLabel>

        {/* Provider submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="flex-1">Fournisseur</span>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {providersLoading ? '...' : (selectedProvider?.name || 'Aucun')}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {providersLoading ? (
              <DropdownMenuItem disabled>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement...
              </DropdownMenuItem>
            ) : validProviders.length === 0 ? (
              <DropdownMenuItem disabled>
                Aucun fournisseur configuré
              </DropdownMenuItem>
            ) : (
              <>
                {validProviders.map((provider) => (
                  <DropdownMenuItem
                    key={provider.id}
                    onClick={() => onProviderChange(provider.id)}
                    className="gap-2"
                  >
                    {selectedProviderId === provider.id && (
                      <Check className="h-4 w-4" />
                    )}
                    {selectedProviderId !== provider.id && (
                      <span className="w-4" />
                    )}
                    <span>{provider.name}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* History */}
        <DropdownMenuItem onClick={handleHistoryClick} className="gap-2">
          <History className="h-4 w-4" />
          <span>Historique des corrections</span>
        </DropdownMenuItem>

        {/* Autocomplete toggle */}
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          <span className="flex-1">Autocomplétion</span>
          <Switch
            checked={autocompleteEnabled}
            onCheckedChange={onAutocompleteChange}
            onClick={(e) => e.stopPropagation()}
          />
        </DropdownMenuItem>

        {/* Command palette shortcut */}
        {onOpenCommandPalette && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCommandPaletteClick} className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="flex-1">Palette de commandes</span>
              <span className="text-xs text-muted-foreground">⌘⇧I</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
