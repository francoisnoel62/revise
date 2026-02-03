// ABOUTME: Tab component for filtering analysis issues by category
// ABOUTME: Shows category icons and issue counts with toggle selection

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpellCheck, Languages, Type, Repeat, Palette, ListChecks } from 'lucide-react';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';

type CategoryKey = AnalysisCategory | 'all';

interface AnalysisCategoryTabsProps {
  selectedCategory: CategoryKey;
  counts: Record<CategoryKey, number>;
  onChange: (category: CategoryKey) => void;
  hideEmpty?: boolean;
  disabled?: boolean;
}

const categoryConfig: Record<CategoryKey, { label: string; icon: typeof SpellCheck }> = {
  all: { label: 'Tous', icon: ListChecks },
  spelling: { label: 'Orthographe', icon: SpellCheck },
  grammar: { label: 'Grammaire', icon: Languages },
  punctuation: { label: 'Ponctuation', icon: Type },
  repetition: { label: 'Répétitions', icon: Repeat },
  style: { label: 'Style', icon: Palette },
};

const categoryOrder: CategoryKey[] = [
  'all',
  'spelling',
  'grammar',
  'punctuation',
  'repetition',
  'style',
];

export function AnalysisCategoryTabs({
  selectedCategory,
  counts,
  onChange,
  hideEmpty = false,
  disabled = false,
}: AnalysisCategoryTabsProps) {
  const visibleCategories = categoryOrder.filter((key) => {
    if (key === 'all') return true;
    if (hideEmpty && counts[key] === 0) return false;
    return true;
  });

  return (
    <Tabs
      value={selectedCategory}
      onValueChange={(value) => onChange(value as CategoryKey)}
    >
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
        {visibleCategories.map((key) => {
          const config = categoryConfig[key];
          const Icon = config.icon;
          const count = counts[key];

          return (
            <TabsTrigger
              key={key}
              value={key}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
                {count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
