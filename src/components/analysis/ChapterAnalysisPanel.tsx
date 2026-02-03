// ABOUTME: Main panel component for chapter analysis results
// ABOUTME: Displays summary, category tabs, and list of issues with actions

'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { AnalysisIssueCard, type AnalysisIssueData } from './AnalysisIssueCard';
import { AnalysisSummaryCard, type AnalysisSummaryStats } from './AnalysisSummaryCard';
import { AnalysisCategoryTabs } from './AnalysisCategoryTabs';

type CategoryFilter = AnalysisCategory | 'all';

interface ChapterAnalysisPanelProps {
  open: boolean;
  issues: AnalysisIssueData[];
  stats: AnalysisSummaryStats;
  onApply: (issueId: string) => void;
  onIgnore: (issueId: string) => void;
  onApplyAll: () => void;
  onClose: () => void;
  chapterTitle: string;
  isLoading?: boolean;
  applyingIssueId?: string | null;
  isApplyingAll?: boolean;
}

export function ChapterAnalysisPanel({
  open,
  issues,
  stats,
  onApply,
  onIgnore,
  onApplyAll,
  onClose,
  chapterTitle,
  isLoading = false,
  applyingIssueId = null,
  isApplyingAll = false,
}: ChapterAnalysisPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: issues.length,
      spelling: 0,
      grammar: 0,
      punctuation: 0,
      repetition: 0,
      style: 0,
    };

    issues.forEach((issue) => {
      counts[issue.category]++;
    });

    return counts;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (selectedCategory === 'all') {
      return issues;
    }
    return issues.filter((issue) => issue.category === selectedCategory);
  }, [issues, selectedCategory]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full md:w-[33vw] md:min-w-100 flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              Vérification : {chapterTitle}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-32 w-full animate-pulse" />
              <Skeleton className="h-12 w-full animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="px-6 py-4 border-b">
                <AnalysisSummaryCard
                  stats={stats}
                  onApplyAll={onApplyAll}
                  isApplyingAll={isApplyingAll}
                />
              </div>

              {/* Category tabs */}
              {stats.totalIssues > 0 && (
                <div className="px-6 py-3 border-b bg-muted/30">
                  <AnalysisCategoryTabs
                    selectedCategory={selectedCategory}
                    counts={categoryCounts}
                    onChange={setSelectedCategory}
                    hideEmpty
                  />
                </div>
              )}

              {/* Issues list */}
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-3">
                  {filteredIssues.length === 0 && stats.totalIssues === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun problème détecté dans ce chapitre.
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun problème dans cette catégorie.
                    </div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <AnalysisIssueCard
                        key={issue.id}
                        issue={issue}
                        onApply={onApply}
                        onIgnore={onIgnore}
                        disabled={isApplyingAll}
                        isApplying={applyingIssueId === issue.id}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
