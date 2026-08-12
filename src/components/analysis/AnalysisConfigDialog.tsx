// ABOUTME: Configuration dialog for chapter analysis options
// ABOUTME: Allows selecting the wired analysis categories and the style rigor level

'use client';

import { useState } from 'react';
import { Loader2, Languages, Repeat, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ANALYSIS_CATEGORIES,
  ANALYSIS_CATEGORY_LABELS,
  AnalysisCategory,
} from '@/domain/value-objects/AnalysisCategory';
import { StyleRigor } from '@/domain/value-objects/StyleRigor';

export interface AnalysisConfig {
  categories: AnalysisCategory[];
  styleRigor: StyleRigor;
}

interface AnalysisConfigDialogProps {
  open: boolean;
  onStart: (config: AnalysisConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryConfig: Record<
  AnalysisCategory,
  { label: string; icon: typeof Languages; description: string }
> = {
  repetition: {
    label: ANALYSIS_CATEGORY_LABELS.repetition,
    icon: Repeat,
    description: 'Mots et expressions répétés',
  },
  style: {
    label: ANALYSIS_CATEGORY_LABELS.style,
    icon: Palette,
    description: 'Voix passive, phrases longues, clichés',
  },
};

const rigorOptions: { value: StyleRigor; label: string; description: string }[] = [
  {
    value: 'permissive',
    label: 'Permissif',
    description: 'Signale uniquement les problèmes majeurs',
  },
  {
    value: 'moderate',
    label: 'Modéré',
    description: 'Équilibre entre liberté et rigueur',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Analyse approfondie de tous les aspects',
  },
];

const allCategories: readonly AnalysisCategory[] = ANALYSIS_CATEGORIES;

export function AnalysisConfigDialog({
  open,
  onStart,
  onCancel,
  isLoading = false,
}: AnalysisConfigDialogProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<AnalysisCategory>>(
    new Set(allCategories)
  );
  const [styleRigor, setStyleRigor] = useState<StyleRigor>('moderate');

  const toggleCategory = (category: AnalysisCategory) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedCategories(newSet);
  };

  const handleStart = () => {
    onStart({
      categories: Array.from(selectedCategories),
      styleRigor,
    });
  };

  const canStart = selectedCategories.size > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Analyse du style</DialogTitle>
          <DialogDescription>
            Sélectionnez les types d&apos;analyse à effectuer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category checkboxes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Catégories à analyser</Label>
            <div className="space-y-3">
              {allCategories.map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;

                return (
                  <div key={category} className="flex items-start space-x-3">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.has(category)}
                      onCheckedChange={() => toggleCategory(category)}
                      disabled={isLoading}
                      aria-label={config.label}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor={`category-${category}`}
                        className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {config.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Style rigor selector */}
          <div className="space-y-3">
            <Label htmlFor="style-rigor" className="text-sm font-medium">
              Niveau de rigueur (style)
            </Label>
            <Select
              value={styleRigor}
              onValueChange={(value) => setStyleRigor(value as StyleRigor)}
              disabled={isLoading || !selectedCategories.has('style')}
            >
              <SelectTrigger id="style-rigor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rigorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleStart} disabled={!canStart}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              'Lancer l\'analyse'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
