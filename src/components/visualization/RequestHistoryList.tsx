// ABOUTME: Scrollable list of past AI requests for the current project
// ABOUTME: Allows browsing and selecting individual requests for visualization

'use client';

import { SerializedRequestRecord } from '@/app/actions/request-visualization-actions';
import { AI_OPERATION_LABELS } from '@/domain/value-objects/AIOperationType';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequestHistoryListProps {
  history: SerializedRequestRecord[];
  activeRecordId?: string;
  isLoading: boolean;
  onSelect: (record: SerializedRequestRecord) => void;
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function RequestHistoryList({
  history,
  activeRecordId,
  isLoading,
  onSelect,
}: RequestHistoryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Chargement de l&apos;historique...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="space-y-1 pr-2">
        {history.map((record) => (
          <button
            key={record.id}
            onClick={() => onSelect(record)}
            className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted/60 ${
              record.id === activeRecordId ? 'bg-muted/80 border border-border' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground truncate">
                {AI_OPERATION_LABELS[record.operation as AIOperationType] ?? record.operation}
              </span>
              <span className="text-muted-foreground flex-shrink-0">
                {formatRelativeDate(record.createdAt)}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate">
              {record.prompt.humanReadableSummary}
            </p>
            <div className="flex items-center gap-3 mt-1 text-muted-foreground">
              <span>{record.provider}</span>
              {record.totalTokens && <span>{record.totalTokens.toLocaleString()} tokens</span>}
              <span>{record.analysisContext.totalAvailable}/{record.analysisContext.totalPossible} analyses</span>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
