// ABOUTME: Client panel listing price swings held back by the daily sync, with apply actions.
// ABOUTME: Lets the admin apply one variation or all of them; edits to values go through the table below.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { applyPricingVariationsAction } from '@/app/actions/pricing-admin-actions';
import type { ModelPriceChange, PriceSnapshot } from '@/domain/interfaces/EmailService';

const FIELDS: { label: string; key: keyof PriceSnapshot }[] = [
  { label: 'Entrée', key: 'inputPerM' },
  { label: 'Sortie', key: 'outputPerM' },
  { label: 'Cache', key: 'cachedInputPerM' },
];

function formatUsd(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} $`;
}

function formatDelta(previous: number, current: number): string {
  if (previous === current) return '=';
  if (previous === 0) return current > previous ? '↑' : '↓';
  const percent = ((current - previous) / previous) * 100;
  const arrow = percent > 0 ? '↑ +' : '↓ ';
  return `${arrow}${percent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

interface Props {
  variations: ModelPriceChange[];
}

export function PendingVariationsPanel({ variations }: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | 'all' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function apply(keys?: string[]) {
    setBusyKey(keys && keys.length === 1 ? keys[0] : 'all');
    setMessage(null);
    const result = await applyPricingVariationsAction(keys);
    setBusyKey(null);
    if (result.success) {
      const count = result.data.appliedKeys.length;
      setMessage(`✓ ${count} variation${count > 1 ? 's' : ''} appliquée${count > 1 ? 's' : ''}`);
      router.refresh();
    } else {
      setMessage(`Erreur : ${result.error}`);
    }
  }

  return (
    <section id="variations" className="mb-8 rounded-md border border-amber-300 bg-amber-50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-amber-900">
            {variations.length} variation{variations.length > 1 ? 's' : ''} à valider
          </h2>
          <p className="text-sm text-amber-800">
            Écart supérieur à 50 % : non appliqué automatiquement. Prix OpenRouter actuels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-sm text-amber-900">{message}</span>}
          <Button size="sm" onClick={() => apply()} disabled={busyKey !== null}>
            <Check className="mr-2 h-4 w-4" />
            {busyKey === 'all' ? 'Application…' : `Tout appliquer (${variations.length})`}
          </Button>
        </div>
      </div>

      <ul className="grid gap-3">
        {variations.map((v) => (
          <li key={v.key} className="rounded-md border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold">{v.key}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => apply([v.key])}
                disabled={busyKey !== null}
              >
                {busyKey === v.key ? 'Application…' : 'Appliquer'}
              </Button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {FIELDS.map(({ label, key }) => {
                  const previous = v.previous?.[key] ?? 0;
                  const current = v.current[key];
                  return (
                    <tr key={key}>
                      <td className="w-20 py-0.5 text-muted-foreground">{label}</td>
                      <td className="py-0.5">
                        <span className="text-muted-foreground line-through">{formatUsd(previous)}</span>
                        {' → '}
                        <strong>{formatUsd(current)}</strong>
                      </td>
                      <td className="py-0.5 text-right font-semibold">{formatDelta(previous, current)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </li>
        ))}
      </ul>
    </section>
  );
}
