// ABOUTME: Displays metadata about the AI request including provider, model, tokens, and duration
// ABOUTME: Simple view shows key metrics; advanced view reveals all generation parameters

'use client';

import { SerializedRequestRecord } from '@/app/actions/request-visualization-actions';

interface MetadataSectionProps {
  record: SerializedRequestRecord;
  isAdvanced: boolean;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function MetadataSection({ record, isAdvanced }: MetadataSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Métadonnées</h3>

      {/* Always visible: key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetadataCard label="Fournisseur" value={record.provider} />
        <MetadataCard label="Modèle" value={record.model} monospace />
        <MetadataCard label="Durée" value={formatDuration(record.durationMs)} />
        <MetadataCard label="Date" value={formatDate(record.createdAt)} />
      </div>

      {/* Token counts */}
      {record.totalTokens !== null && (
        <div className="grid grid-cols-3 gap-2">
          <MetadataCard
            label="Tokens entrée"
            value={record.inputTokens?.toLocaleString() ?? '—'}
          />
          <MetadataCard
            label="Tokens sortie"
            value={record.outputTokens?.toLocaleString() ?? '—'}
          />
          <MetadataCard
            label="Total tokens"
            value={record.totalTokens.toLocaleString()}
          />
        </div>
      )}

      {/* Advanced: generation parameters */}
      {isAdvanced && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Paramètres de génération</p>
          <div className="grid grid-cols-2 gap-2">
            <MetadataCard
              label="Température"
              value={
                record.parameters.thinkingEnabled
                  ? 'N/A (thinking actif)'
                  : record.parameters.temperature?.toString() ?? '—'
              }
            />
            <MetadataCard
              label="Max tokens"
              value={record.parameters.maxTokens.toLocaleString()}
            />
            <MetadataCard
              label="Thinking budget"
              value={record.parameters.thinkingEnabled
                ? record.parameters.thinkingBudget.toLocaleString()
                : 'Désactivé'
              }
            />
            <MetadataCard
              label="Extended thinking"
              value={record.parameters.thinkingEnabled ? 'Activé' : 'Désactivé'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MetadataCardProps {
  label: string;
  value: string;
  monospace?: boolean;
}

function MetadataCard({ label, value, monospace = false }: MetadataCardProps) {
  return (
    <div className="rounded-md border bg-muted/10 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xs font-medium text-foreground mt-0.5 truncate ${monospace ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
