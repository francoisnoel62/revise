// ABOUTME: Interactive, cross-project table of captured AI exchanges with a plain-language detail view
// ABOUTME: Lists metadata only; decrypts content on demand when a row is expanded

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AI_OPERATION_LABELS,
  AI_OPERATION_TYPES,
} from '@/domain/value-objects/AIOperationType';
import {
  listAIExchangesAction,
  getAIExchangeAction,
  type SerializedExchangeSummary,
  type SerializedExchangeDetail,
  type ListExchangeFilters,
} from '@/app/actions/exchange-actions';
import { listProjectsAction } from '@/app/actions/project-actions';

const ALL = '__all__';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatCost(costEur: number | null): string {
  if (costEur === null) return '—';
  return `~${costEur.toFixed(costEur < 0.01 ? 4 : 2)} €`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

export function AIExchangeLedger() {
  const [summaries, setSummaries] = useState<SerializedExchangeSummary[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [projectFilter, setProjectFilter] = useState(ALL);
  const [operationFilter, setOperationFilter] = useState(ALL);

  const [details, setDetails] = useState<Record<string, SerializedExchangeDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listProjectsAction().then((result) => {
      if (result.success) {
        const map: Record<string, string> = {};
        for (const project of result.data) {
          map[project.id] = project.title;
        }
        setProjects(map);
      }
    });
  }, []);

  useEffect(() => {
    let active = true;
    const filters: ListExchangeFilters = {};
    if (projectFilter !== ALL) filters.projectId = projectFilter;
    if (operationFilter !== ALL) filters.operation = operationFilter;

    listAIExchangesAction(filters).then((result) => {
      if (!active) return;
      if (result.success) {
        setSummaries(result.data);
        setError('');
      } else {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectFilter, operationFilter]);

  function handleFilterChange(setter: (value: string) => void, value: string) {
    setLoading(true);
    setter(value);
  }

  const usedOperations = useMemo(
    () => AI_OPERATION_TYPES.filter((op) => AI_OPERATION_LABELS[op]),
    []
  );

  async function handleOpen(id: string) {
    if (details[id] || detailLoading === id) return;
    setDetailLoading(id);
    const result = await getAIExchangeAction(id);
    if (result.success && result.data) {
      setDetails((prev) => ({ ...prev, [id]: result.data as SerializedExchangeDetail }));
    }
    setDetailLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select
          value={projectFilter}
          onValueChange={(value) => handleFilterChange(setProjectFilter, value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les projets</SelectItem>
            {Object.entries(projects).map(([id, title]) => (
              <SelectItem key={id} value={id}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={operationFilter}
          onValueChange={(value) => handleFilterChange(setOperationFilter, value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Toutes les opérations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les opérations</SelectItem>
            {usedOperations.map((op) => (
              <SelectItem key={op} value={op}>
                {AI_OPERATION_LABELS[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucun échange journalisé pour l&apos;instant. Activez la journalisation
          dans les paramètres, puis utilisez l&apos;IA sur un projet.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => value && handleOpen(value)}
        >
          {summaries.map((summary) => (
            <AccordionItem key={summary.id} value={summary.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 pr-4 text-left text-sm">
                  <span className="w-40 text-muted-foreground">
                    {formatDate(summary.createdAt)}
                  </span>
                  <span className="font-medium">
                    {AI_OPERATION_LABELS[summary.operation] ?? summary.operation}
                  </span>
                  <span className="text-muted-foreground">
                    {projects[summary.projectId] ?? 'Projet'}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {summary.model}
                  </span>
                  <span className="w-20 text-right text-muted-foreground">
                    {formatCost(summary.costEur)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ExchangeDetail
                  id={summary.id}
                  detail={details[summary.id]}
                  loading={detailLoading === summary.id}
                  showTechnical={!!showTechnical[summary.id]}
                  onToggleTechnical={() =>
                    setShowTechnical((prev) => ({
                      ...prev,
                      [summary.id]: !prev[summary.id],
                    }))
                  }
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
        {children}
      </pre>
    </div>
  );
}

function ExchangeDetail({
  detail,
  loading,
  showTechnical,
  onToggleTechnical,
}: {
  id: string;
  detail?: SerializedExchangeDetail;
  loading: boolean;
  showTechnical: boolean;
  onToggleTechnical: () => void;
}) {
  if (loading || !detail) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      <Block title="Ce que vous avez envoyé">{detail.input}</Block>
      <Block title="Ce que l'IA a répondu">{detail.output}</Block>

      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-md border p-3 text-xs text-muted-foreground">
        <span>Modèle : {detail.model}</span>
        <span>
          Tokens : {detail.inputTokens ?? '—'} entrée / {detail.outputTokens ?? '—'} sortie
        </span>
        <span>Coût : {formatCost(detail.costEur)}</span>
        <span>Durée : {formatDuration(detail.durationMs)}</span>
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={onToggleTechnical}>
          {showTechnical ? 'Masquer le détail technique' : 'Voir le détail technique'}
        </Button>
        {showTechnical && (
          <div className="mt-3">
            <Block title="Consigne système transmise à l'IA (brut)">
              {detail.systemPrompt}
            </Block>
          </div>
        )}
      </div>
    </div>
  );
}
