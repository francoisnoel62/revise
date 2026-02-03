// ABOUTME: Command palette for quick AI actions via keyboard shortcut (Cmd+Shift+I)
// ABOUTME: Provides fuzzy search across AI commands with contextual suggestions

'use client';

import * as React from 'react';
import { useEffect, useCallback, useState } from 'react';
import {
  Sparkles,
  FileText,
  List,
  History,
  Zap,
  PenLine,
  Settings2,
  Check,
  CheckCircle,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { SafeProvider } from '@/app/actions/provider-actions';
import { CHAPTER_GENERATION_TYPES, ChapterGenerationTypeKey } from '@/domain';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Actions
  hasSelection: boolean;
  onRewrite: () => void;
  rewriteLoading: boolean;
  isChapterEmpty: boolean;
  onGenerate: (type: ChapterGenerationTypeKey) => void;
  generationLoading: boolean;
  onHistoryClick: () => void;
  autocompleteEnabled: boolean;
  onAutocompleteChange: (enabled: boolean) => void;

  // Analysis
  onAnalyze?: () => void;
  analysisLoading?: boolean;

  // Provider
  providers: SafeProvider[];
  selectedProviderId: string | null;
  onProviderChange: (providerId: string | null) => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  available: boolean;
  category: 'writing' | 'settings';
  keywords?: string[];
}

export function CommandPalette({
  open,
  onOpenChange,
  hasSelection,
  onRewrite,
  rewriteLoading,
  isChapterEmpty,
  onGenerate,
  generationLoading,
  onHistoryClick,
  autocompleteEnabled,
  onAutocompleteChange,
  onAnalyze,
  analysisLoading = false,
  providers,
  selectedProviderId,
  onProviderChange,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  const validProviders = providers.filter((p) => p.isValid);
  const selectedProvider = validProviders.find((p) => p.id === selectedProviderId);
  const hasValidProvider = selectedProviderId !== null && selectedProvider !== undefined;

  // Global keyboard shortcut: Cmd+Shift+I (Mac) / Ctrl+Shift+I (Windows)
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Reset search when dialog opens - use ref to avoid setState in effect
  const previousOpen = React.useRef(open);
  useEffect(() => {
    if (open && !previousOpen.current) {
      // Dialog just opened, reset search via callback pattern
      globalThis.requestAnimationFrame(() => setSearch(''));
    }
    previousOpen.current = open;
  }, [open]);

  const executeCommand = useCallback((action: () => void) => {
    onOpenChange(false);
    // Small delay to let dialog close first
    setTimeout(action, 50);
  }, [onOpenChange]);

  // Build commands list
  const commands: Command[] = [
    // Writing commands
    {
      id: 'rewrite',
      label: 'Réécrire la sélection',
      description: hasSelection ? 'Générer 3 propositions de réécriture' : 'Sélectionnez du texte d\'abord',
      icon: <PenLine className="h-4 w-4" />,
      action: () => executeCommand(onRewrite),
      available: hasSelection && hasValidProvider && !rewriteLoading,
      category: 'writing',
      keywords: ['rewrite', 'réécrire', 'reformuler', 'améliorer'],
    },
    {
      id: 'generate-beginning',
      label: CHAPTER_GENERATION_TYPES['chapter-beginning'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-beginning'].description,
      icon: <Sparkles className="h-4 w-4" />,
      action: () => executeCommand(() => onGenerate('chapter-beginning')),
      available: isChapterEmpty && hasValidProvider && !generationLoading,
      category: 'writing',
      keywords: ['generate', 'générer', 'début', 'beginning', 'commencer'],
    },
    {
      id: 'generate-chapter',
      label: CHAPTER_GENERATION_TYPES['chapter-full'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-full'].description,
      icon: <FileText className="h-4 w-4" />,
      action: () => executeCommand(() => onGenerate('chapter-full')),
      available: isChapterEmpty && hasValidProvider && !generationLoading,
      category: 'writing',
      keywords: ['generate', 'générer', 'chapitre', 'chapter', 'complet', 'full'],
    },
    {
      id: 'generate-outline',
      label: CHAPTER_GENERATION_TYPES['chapter-outline'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-outline'].description,
      icon: <List className="h-4 w-4" />,
      action: () => executeCommand(() => onGenerate('chapter-outline')),
      available: isChapterEmpty && hasValidProvider && !generationLoading,
      category: 'writing',
      keywords: ['generate', 'générer', 'plan', 'outline', 'structure'],
    },
    // Settings commands
    {
      id: 'history',
      label: 'Historique des corrections',
      description: 'Voir toutes les réécritures de ce chapitre',
      icon: <History className="h-4 w-4" />,
      action: () => executeCommand(onHistoryClick),
      available: true,
      category: 'settings',
      keywords: ['history', 'historique', 'corrections', 'rewrites'],
    },
    ...(onAnalyze ? [{
      id: 'analyze',
      label: 'Vérifier le chapitre',
      description: 'Analyser orthographe, grammaire, style et répétitions',
      icon: <CheckCircle className="h-4 w-4" />,
      action: () => executeCommand(onAnalyze),
      available: hasValidProvider && !analysisLoading,
      category: 'settings' as const,
      keywords: ['analyze', 'analyser', 'vérifier', 'check', 'orthographe', 'grammaire', 'style'],
    }] : []),
    {
      id: 'toggle-autocomplete',
      label: autocompleteEnabled ? 'Désactiver l\'autocomplétion' : 'Activer l\'autocomplétion',
      description: autocompleteEnabled ? 'L\'autocomplétion est actuellement activée' : 'L\'autocomplétion est actuellement désactivée',
      shortcut: 'Tab',
      icon: <Zap className="h-4 w-4" />,
      action: () => executeCommand(() => onAutocompleteChange(!autocompleteEnabled)),
      available: true,
      category: 'settings',
      keywords: ['autocomplete', 'autocomplétion', 'auto', 'tab', 'suggestion'],
    },
  ];

  // Add provider commands
  validProviders.forEach((provider) => {
    commands.push({
      id: `provider-${provider.id}`,
      label: `Utiliser ${provider.name}`,
      description: selectedProviderId === provider.id ? 'Actuellement sélectionné' : 'Changer de fournisseur IA',
      icon: selectedProviderId === provider.id ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />,
      action: () => executeCommand(() => onProviderChange(provider.id)),
      available: true,
      category: 'settings',
      keywords: ['provider', 'fournisseur', provider.name.toLowerCase(), 'ia', 'ai'],
    });
  });

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((kw) => kw.includes(searchLower))
    );
  });

  const writingCommands = filteredCommands.filter((cmd) => cmd.category === 'writing');
  const settingsCommands = filteredCommands.filter((cmd) => cmd.category === 'settings');

  // Sort by availability (available commands first) and relevance
  const sortByRelevance = (cmds: Command[]) => {
    return [...cmds].sort((a, b) => {
      // Available commands first
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return 0;
    });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Palette de commandes IA"
      description="Recherchez une commande IA à exécuter..."
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Rechercher une commande IA..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Aucune commande trouvée.</CommandEmpty>

        {sortByRelevance(writingCommands).length > 0 && (
          <CommandGroup heading="Écriture">
            {sortByRelevance(writingCommands).map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={cmd.action}
                disabled={!cmd.available}
                className={!cmd.available ? 'opacity-50' : ''}
              >
                {cmd.icon}
                <div className="flex-1 ml-2">
                  <div>{cmd.label}</div>
                  {cmd.description && (
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  )}
                </div>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {writingCommands.length > 0 && settingsCommands.length > 0 && (
          <CommandSeparator />
        )}

        {sortByRelevance(settingsCommands).length > 0 && (
          <CommandGroup heading="Paramètres">
            {sortByRelevance(settingsCommands).map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={cmd.action}
                disabled={!cmd.available}
                className={!cmd.available ? 'opacity-50' : ''}
              >
                {cmd.icon}
                <div className="flex-1 ml-2">
                  <div>{cmd.label}</div>
                  {cmd.description && (
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  )}
                </div>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Tapez pour rechercher</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⇧</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">I</kbd>
          <span className="ml-1">pour ouvrir</span>
        </span>
      </div>
    </CommandDialog>
  );
}
