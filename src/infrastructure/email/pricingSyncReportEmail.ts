// ABOUTME: Pure renderer for the AI pricing sync report email (subject, HTML, plain text).
// ABOUTME: Builds a synthetic header, per-provider grouping and old -> new price details.

import { PricingProvider } from '@/domain/interfaces/ModelPricingRepository';
import { ModelPriceChange, PriceSnapshot, PricingSyncReport } from '@/domain/interfaces/EmailService';

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const PROVIDER_LABELS: Record<PricingProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

const PROVIDER_ORDER: PricingProvider[] = ['anthropic', 'openai', 'google'];

/** USD per million tokens, formatted in French notation, e.g. "6,00 $". */
function formatPrice(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} $`;
}

/** French plural helper: pluralizes a noun based on count. */
function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular;
}

interface Variation {
  /** Signed percentage change, or null when there is no previous value to compare. */
  percent: number | null;
  direction: 'up' | 'down' | 'same';
}

function variation(previous: number | undefined, current: number): Variation {
  if (previous === undefined) return { percent: null, direction: 'same' };
  if (previous === current) return { percent: 0, direction: 'same' };
  const percent = previous === 0 ? null : ((current - previous) / previous) * 100;
  return { percent, direction: current > previous ? 'up' : 'down' };
}

function formatPercent(v: Variation): string {
  if (v.direction === 'same') return '=';
  const arrow = v.direction === 'up' ? '↑' : '↓';
  if (v.percent === null) return arrow;
  const sign = v.percent > 0 ? '+' : '';
  return `${arrow} ${sign}${v.percent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

function groupByProvider(changes: ModelPriceChange[]): Map<PricingProvider, ModelPriceChange[]> {
  const grouped = new Map<PricingProvider, ModelPriceChange[]>();
  for (const provider of PROVIDER_ORDER) {
    const forProvider = changes.filter((c) => c.provider === provider);
    if (forProvider.length) grouped.set(provider, forProvider);
  }
  return grouped;
}

const PRICE_FIELDS: { label: string; key: keyof PriceSnapshot }[] = [
  { label: 'Entrée', key: 'inputPerM' },
  { label: 'Sortie', key: 'outputPerM' },
  { label: 'Cache', key: 'cachedInputPerM' },
];

function renderChangeRowsHtml(change: ModelPriceChange): string {
  return PRICE_FIELDS.map(({ label, key }) => {
    const current = change.current[key];
    const previous = change.previous ? change.previous[key] : undefined;
    const v = variation(previous, current);
    const valueCell = change.previous
      ? `<span class="old">${formatPrice(previous as number)}</span> → <strong>${formatPrice(current)}</strong>`
      : `<strong>${formatPrice(current)}</strong>`;
    const varClass = v.direction === 'up' ? 'up' : v.direction === 'down' ? 'down' : 'same';
    const varCell = change.previous
      ? `<td class="var ${varClass}">${formatPercent(v)}</td>`
      : '<td class="var same">—</td>';
    return `<tr><td class="label">${label}</td><td class="value">${valueCell}</td>${varCell}</tr>`;
  }).join('');
}

function renderProviderSectionHtml(
  provider: PricingProvider,
  changes: ModelPriceChange[],
  badge: 'new' | 'updated'
): string {
  const badgeLabel = badge === 'new' ? 'nouveau' : 'modifié';
  const models = changes
    .map(
      (change) => `
      <div class="model">
        <div class="model-head"><span class="badge ${badge}">${badgeLabel}</span><span class="prefix">${change.prefix}</span></div>
        <table class="prices">${renderChangeRowsHtml(change)}</table>
      </div>`
    )
    .join('');
  return `<div class="provider"><h3>${PROVIDER_LABELS[provider]}</h3>${models}</div>`;
}

function renderGroupHtml(title: string, changes: ModelPriceChange[], badge: 'new' | 'updated'): string {
  if (!changes.length) return '';
  const grouped = groupByProvider(changes);
  const sections = [...grouped.entries()]
    .map(([provider, providerChanges]) => renderProviderSectionHtml(provider, providerChanges, badge))
    .join('');
  return `<h2>${title} (${changes.length})</h2>${sections}`;
}

function renderTextChange(change: ModelPriceChange): string {
  const lines = PRICE_FIELDS.map(({ label, key }) => {
    const current = change.current[key];
    if (change.previous) {
      const previous = change.previous[key];
      const v = variation(previous, current);
      return `    ${label}: ${formatPrice(previous)} → ${formatPrice(current)} (${formatPercent(v)})`;
    }
    return `    ${label}: ${formatPrice(current)}`;
  });
  return `  ${PROVIDER_LABELS[change.provider]} / ${change.prefix}\n${lines.join('\n')}`;
}

/**
 * @param reviewUrl Admin page where held-back price swings are validated; the
 *   review button is only rendered when the report has pending variations.
 */
export function renderPricingSyncReportEmail(report: PricingSyncReport, reviewUrl?: string): RenderedEmail {
  const date = report.syncedAt.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  const newCount = report.newModels.length;
  const updatedCount = report.updatedModels.length;
  const pendingCount = report.pendingVariations.length;
  const noChange = newCount === 0 && updatedCount === 0 && pendingCount === 0;

  const pendingSuffix = pendingCount ? `, ${pendingCount} à valider` : '';
  const subject = `[Revise] Tarifs IA — ${newCount} ${plural(newCount, 'nouveau', 'nouveaux')}, ${updatedCount} ${plural(updatedCount, 'modifié', 'modifiés')}${pendingSuffix}`;

  const reviewHtml =
    pendingCount && reviewUrl
      ? `<div class="review"><p>${pendingCount} ${plural(pendingCount, 'variation supérieure', 'variations supérieures')} à 50 % ${plural(pendingCount, 'attend', 'attendent')} votre validation (non ${plural(pendingCount, 'appliquée', 'appliquées')}).</p><a href="${reviewUrl}" class="btn">Valider les variations (${pendingCount})</a></div>`
      : '';

  const errorsHtml = report.errors.length
    ? `<div class="errors"><strong>Erreurs (${report.errors.length})</strong><ul>${report.errors
        .map((e) => `<li>${e}</li>`)
        .join('')}</ul></div>`
    : '';

  const summaryHtml = `
    <div class="summary">
      <div class="stat new"><span class="num">${newCount}</span><span class="lbl">Nouveaux</span></div>
      <div class="stat updated"><span class="num">${updatedCount}</span><span class="lbl">Modifiés</span></div>
      <div class="stat total"><span class="num">${report.totalModels}</span><span class="lbl">En base</span></div>
    </div>`;

  const bodyHtml = noChange
    ? '<p class="empty">Aucun changement détecté lors de cette synchronisation.</p>'
    : `${renderGroupHtml('Nouveaux modèles', report.newModels, 'new')}${renderGroupHtml('Prix mis à jour', report.updatedModels, 'updated')}`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1f2937;background:#f9fafb;padding:24px;margin:0}
  .container{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb}
  h1{font-size:18px;margin:0 0 4px}
  .date{color:#6b7280;font-size:13px;margin:0 0 20px}
  .summary{display:flex;gap:12px;margin-bottom:24px}
  .stat{flex:1;text-align:center;border-radius:10px;padding:14px 8px;background:#f3f4f6}
  .stat .num{display:block;font-size:26px;font-weight:700;line-height:1}
  .stat .lbl{display:block;font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:.03em}
  .stat.new{background:#dcfce7}.stat.new .num{color:#166534}
  .stat.updated{background:#dbeafe}.stat.updated .num{color:#1e40af}
  .stat.total{background:#f3f4f6}.stat.total .num{color:#111827}
  h2{font-size:15px;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
  .provider{margin:12px 0}
  .provider h3{font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 6px}
  .model{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin:8px 0}
  .model-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .prefix{font-weight:600;font-size:14px}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
  .badge.new{background:#dcfce7;color:#166534}.badge.updated{background:#dbeafe;color:#1e40af}
  table.prices{width:100%;border-collapse:collapse;font-size:13px}
  table.prices td{padding:3px 0}
  td.label{color:#6b7280;width:64px}
  td.value{color:#111827}
  td.value .old{color:#9ca3af;text-decoration:line-through}
  td.var{text-align:right;font-weight:600;white-space:nowrap}
  td.var.up{color:#b91c1c}td.var.down{color:#15803d}td.var.same{color:#9ca3af}
  .empty{color:#6b7280}
  .review{margin-top:20px;padding:16px;border-radius:8px;background:#fffbeb;border:1px solid #fcd34d;text-align:center}
  .review p{margin:0 0 12px;color:#92400e;font-size:14px}
  .btn{display:inline-block;padding:12px 24px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px}
  .errors{margin-top:20px;padding:12px;border-radius:8px;background:#fef2f2;color:#b91c1c;font-size:13px}
  .errors ul{margin:6px 0 0;padding-left:18px}
</style></head>
<body><div class="container">
  <h1>Synchronisation des tarifs IA</h1>
  <p class="date">${date}</p>
  ${summaryHtml}
  ${reviewHtml}
  ${bodyHtml}
  ${errorsHtml}
</div></body></html>`.trim();

  const textSections: string[] = [`Synchronisation des tarifs IA — ${date}`, '', `Total en base : ${report.totalModels} modèles`];
  if (noChange) {
    textSections.push('', 'Aucun changement détecté lors de cette synchronisation.');
  } else {
    if (newCount) {
      textSections.push('', `Nouveaux modèles (${newCount}) :`, ...report.newModels.map(renderTextChange));
    }
    if (updatedCount) {
      textSections.push('', `Prix mis à jour (${updatedCount}) :`, ...report.updatedModels.map(renderTextChange));
    }
  }
  if (pendingCount && reviewUrl) {
    textSections.push('', `Variations à valider (${pendingCount}) : ${reviewUrl}`);
  }
  if (report.errors.length) {
    textSections.push('', `Erreurs (${report.errors.length}) :`, ...report.errors.map((e) => `  - ${e}`));
  }
  const text = textSections.join('\n');

  return { subject, html, text };
}
