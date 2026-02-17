// ABOUTME: Color-coded badges showing which manuscript analyses fed into an AI request
// ABOUTME: Each card shows analysis type availability status, color, and content summary

'use client';

import { SerializedRequestRecord } from '@/app/actions/request-visualization-actions';

interface AnalysisContextCardsProps {
  record: SerializedRequestRecord;
}

export function AnalysisContextCards({ record }: AnalysisContextCardsProps) {
  const { entries, totalAvailable, totalPossible } = record.analysisContext;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Analyses utilisées</h3>
        <span className="text-xs text-muted-foreground">
          {totalAvailable}/{totalPossible} disponibles
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {entries.map((entry) => (
          <div
            key={entry.typeKey}
            className={`rounded-lg border p-3 transition-opacity ${
              entry.present ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              borderColor: entry.present ? entry.colorCode : undefined,
              backgroundColor: entry.present ? `${entry.colorCode}10` : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.present ? entry.colorCode : '#94a3b8' }}
              />
              <span
                className="text-xs font-medium truncate"
                style={{ color: entry.present ? entry.colorCode : undefined }}
              >
                {entry.label}
              </span>
            </div>

            {entry.present && entry.summary ? (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {entry.summary}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {entry.present ? 'Disponible' : 'Non disponible'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
