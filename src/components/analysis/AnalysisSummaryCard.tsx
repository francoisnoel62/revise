// ABOUTME: Card component showing analysis summary statistics
// ABOUTME: Displays total issues, category breakdown, and batch action buttons

'use client';

import {
  SpellCheck,
  Languages,
  Type,
  Repeat,
  Palette,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';

export interface AnalysisSummaryStats {
  totalIssues: number;
  pendingIssues: number;
  appliedIssues: number;
  ignoredIssues: number;
  byCategory: Record<AnalysisCategory, number>;
}

interface AnalysisSummaryCardProps {
  stats: AnalysisSummaryStats;
  isLoading?: boolean;
  onApplyAll?: () => void;
  isApplyingAll?: boolean;
}

const categoryConfig: Record<
  AnalysisCategory,
  { label: string; icon: typeof SpellCheck }
> = {
  spelling: { label: 'Orthographe', icon: SpellCheck },
  grammar: { label: 'Grammaire', icon: Languages },
  punctuation: { label: 'Ponctuation', icon: Type },
  repetition: { label: 'Répétitions', icon: Repeat },
  style: { label: 'Style', icon: Palette },
};

export function AnalysisSummaryCard({
  stats,
  isLoading = false,
  onApplyAll,
  isApplyingAll = false,
}: AnalysisSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-12 animate-pulse" />
                <Skeleton className="h-4 w-20 animate-pulse" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 w-full animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const allResolved = stats.pendingIssues === 0 && stats.totalIssues > 0;
  const noIssues = stats.totalIssues === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {noIssues ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Aucun problème détecté
            </>
          ) : allResolved ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Tous les problèmes traités
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {stats.totalIssues} problèmes détectés
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!noIssues && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {stats.pendingIssues}
                </div>
                <div className="text-xs text-muted-foreground">À traiter</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.appliedIssues}
                </div>
                <div className="text-xs text-muted-foreground">Appliqués</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-500">
                  {stats.ignoredIssues}
                </div>
                <div className="text-xs text-muted-foreground">Ignorés</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalIssues}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(categoryConfig) as AnalysisCategory[]).map((category) => {
                  const config = categoryConfig[category];
                  const count = stats.byCategory[category] || 0;
                  const Icon = config.icon;

                  return (
                    <div
                      key={category}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            {onApplyAll && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={onApplyAll}
                  disabled={stats.pendingIssues === 0 || isApplyingAll}
                  size="sm"
                >
                  {isApplyingAll ? 'Application...' : 'Tout appliquer'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
