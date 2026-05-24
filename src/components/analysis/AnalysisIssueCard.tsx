// ABOUTME: Card component for displaying a single analysis issue
// ABOUTME: Shows original/suggested text, severity badge, and apply/ignore actions

'use client';

import { Check, X, Loader2, SpellCheck, Languages, Type, Repeat, Palette } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { AnalysisSeverity } from '@/domain/value-objects/AnalysisSeverity';

export interface AnalysisIssueData {
  id: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  originalText: string;
  suggestedText: string;
  explanation?: string;
  position: { start: number; end: number };
  status: 'pending' | 'applied' | 'ignored';
}

interface AnalysisIssueCardProps {
  issue: AnalysisIssueData;
  onApply: (issueId: string) => void;
  onIgnore: (issueId: string) => void;
  disabled?: boolean;
  isApplying?: boolean;
}

const categoryIcons: Record<AnalysisCategory, typeof SpellCheck> = {
  spelling: SpellCheck,
  grammar: Languages,
  punctuation: Type,
  repetition: Repeat,
  style: Palette,
};

const severityLabels: Record<AnalysisSeverity, string> = {
  error: 'Erreur',
  warning: 'Attention',
  suggestion: 'Suggestion',
};

const severityColors: Record<AnalysisSeverity, string> = {
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  suggestion: 'bg-blue-500 text-white',
};

export function AnalysisIssueCard({
  issue,
  onApply,
  onIgnore,
  disabled = false,
  isApplying = false,
}: AnalysisIssueCardProps) {
  const Icon = categoryIcons[issue.category];
  const isResolved = issue.status !== 'pending';

  return (
    <Card className={`transition-opacity ${isResolved ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={severityColors[issue.severity]}>
                {severityLabels[issue.severity]}
              </Badge>
              {issue.status === 'applied' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Appliqué
                </Badge>
              )}
              {issue.status === 'ignored' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  Ignoré
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="line-through text-destructive bg-red-50 px-1 rounded">
                {issue.originalText}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-green-700 bg-green-50 px-1 rounded">
                {issue.suggestedText}
              </span>
            </div>

            {issue.explanation && (
              <p className="text-sm text-muted-foreground">{issue.explanation}</p>
            )}
          </div>

          {issue.status === 'pending' && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApply(issue.id)}
                disabled={disabled || isApplying}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="sr-only">Application en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Appliquer</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onIgnore(issue.id)}
                disabled={disabled || isApplying}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Ignorer</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
