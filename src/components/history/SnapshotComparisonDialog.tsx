// ABOUTME: Read-only viewer for comparing one saved snapshot to a server-captured current state.
// ABOUTME: Shows changed chapter structure first, then a textual and rich-block side-by-side diff.

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  loadSnapshotComparisonAction,
  type SerializedSnapshotComparison,
} from '@/app/actions/snapshot-actions';

interface SnapshotComparisonDialogProps {
  projectId: string;
  snapshotId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TipTapNode = { type?: string; text?: string; attrs?: Record<string, unknown>; content?: TipTapNode[] };

function parseDocument(content: string): TipTapNode {
  try {
    return JSON.parse(content) as TipTapNode;
  } catch {
    return { type: 'paragraph', content: [{ type: 'text', text: content }] };
  }
}

function nodeText(node: TipTapNode): string {
  if (node.type === 'text') return node.text ?? '';
  const childText = (node.content ?? []).map(nodeText).join(node.type === 'paragraph' || node.type === 'heading' ? '\n' : '');
  return node.type === 'hardBreak' ? '\n' : childText;
}

function richBlocks(node: TipTapNode): TipTapNode[] {
  const blocks = (node.content ?? []).flatMap(richBlocks);
  return ['doc', 'paragraph', 'heading', 'text', 'hardBreak'].includes(node.type ?? '') ? blocks : [node, ...blocks];
}

function changedMiddle(before: string, after: string): { before: string; after: string; prefix: string; suffix: string } {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let end = 0;
  while (
    end < before.length - start && end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) end += 1;
  return {
    prefix: before.slice(0, start),
    before: before.slice(start, before.length - end),
    after: after.slice(start, after.length - end),
    suffix: before.slice(before.length - end),
  };
}

type DiffPart = { kind: 'same' | 'removed' | 'added'; text: string };

function textDiff(before: string, after: string): DiffPart[] {
  const tokenize = (text: string) => text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
  const left = tokenize(before);
  const right = tokenize(after);
  // Keep long chapters responsive; their outer changed span remains truthful.
  if (left.length * right.length > 250_000) {
    const change = changedMiddle(before, after);
    const fallback: DiffPart[] = [
      { kind: 'same', text: change.prefix },
      { kind: 'removed', text: change.before },
      { kind: 'added', text: change.after },
      { kind: 'same', text: change.suffix },
    ];
    return fallback.filter((part) => part.text);
  }
  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffPart['kind'], text: string) => {
    const last = parts.at(-1);
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0; let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) { push('same', left[i]); i += 1; j += 1; }
    else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) { push('added', right[j]); j += 1; }
    else { push('removed', left[i]); i += 1; }
  }
  return parts;
}

function DiffPane({ value, otherValue, kind }: { value: string; otherValue: string; kind: 'past' | 'current' }) {
  const parts = textDiff(kind === 'past' ? value : otherValue, kind === 'past' ? otherValue : value);
  return (
    <p className="whitespace-pre-wrap leading-6">
      {parts.map((part, index) => {
        if (part.kind === 'same') return <span key={index}>{part.text}</span>;
        if (kind === 'past' && part.kind === 'removed') {
          return <del key={index} className="bg-red-100 text-red-900 decoration-red-700">{part.text}</del>;
        }
        if (kind === 'current' && part.kind === 'added') {
          return <ins key={index} className="bg-green-100 text-green-900 no-underline">{part.text}</ins>;
        }
        return null;
      })}
    </p>
  );
}

function RichBlockPreview({ block }: { block: TipTapNode }) {
  if (block.type === 'horizontalRule') return <hr className="my-2 border-slate-400" />;
  if (block.type === 'image' && typeof block.attrs?.src === 'string') {
    return <img src={block.attrs.src} alt="Illustration du manuscrit" className="max-h-32 max-w-full object-contain" />;
  }
  return <code className="block whitespace-pre-wrap break-words text-xs">{JSON.stringify(block)}</code>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function richBlockChanges(before: TipTapNode[], after: TipTapNode[]): Array<{ block: TipTapNode; status: 'Ajouté' | 'Supprimé' | 'Modifié' }> {
  const remainingAfter = [...after];
  const unmatchedBefore = before.filter((block) => {
    const matchIndex = remainingAfter.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(block));
    if (matchIndex < 0) return true;
    remainingAfter.splice(matchIndex, 1);
    return false;
  });
  const paired = Math.min(unmatchedBefore.length, remainingAfter.length);
  return [
    ...unmatchedBefore.slice(0, paired).map((block) => ({ block, status: 'Modifié' as const })),
    ...unmatchedBefore.slice(paired).map((block) => ({ block, status: 'Supprimé' as const })),
    ...remainingAfter.slice(paired).map((block) => ({ block, status: 'Ajouté' as const })),
  ];
}

function metadataValue(value: unknown): string {
  if (value == null || value === '') return '—';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function SnapshotComparisonDialog({ projectId, snapshotId, open, onOpenChange }: SnapshotComparisonDialogProps) {
  const [comparison, setComparison] = useState<SerializedSnapshotComparison | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !snapshotId) return;
    void loadSnapshotComparisonAction(projectId, snapshotId).then((result) => {
      if (!result.success) {
        setError(result.error);
        return;
      }
      setComparison(result.data);
    });
  }, [open, projectId, snapshotId]);

  const chapterChoices = comparison ? (() => {
    const past = new Map(comparison.snapshot.chapters.map((chapter) => [chapter.id, chapter]));
    const current = new Map(comparison.current.chapters.map((chapter) => [chapter.id, chapter]));
    return [...new Set([...past.keys(), ...current.keys()])].map((id) => {
      const before = past.get(id);
      const after = current.get(id);
      const status = !before ? 'Ajouté' : !after ? 'Supprimé' : before.title !== after.title || before.content !== after.content || before.order !== after.order ? 'Modifié' : 'Inchangé';
      return { id, before, after, status };
    });
  })() : [];
  const changes = chapterChoices.filter((change) => change.status !== 'Inchangé');

  const selected = chapterChoices.find((change) => change.id === selectedChapterId) ?? changes[0] ?? chapterChoices[0] ?? null;
  const pastText = selected?.before ? nodeText(parseDocument(selected.before.content)) : '';
  const currentText = selected?.after ? nodeText(parseDocument(selected.after.content)) : '';
  const pastRich = selected?.before ? richBlocks(parseDocument(selected.before.content)) : [];
  const currentRich = selected?.after ? richBlocks(parseDocument(selected.after.content)) : [];
  const richChanges = richBlockChanges(pastRich, currentRich);
  const pastRichChanges = richChanges.filter((change) => change.status !== 'Ajouté');
  const currentRichChanges = richChanges.filter((change) => change.status !== 'Supprimé');
  const metadataKeys = [
    ['Titre', 'title'], ['Sous-titre', 'subtitle'], ['Genre', 'genre'], ['Résumé', 'summary'],
    ['Synopsis', 'synopsis'], ['Point de vue', 'pointOfView'], ['Temps', 'tense'],
    ['Public visé', 'targetAudience'], ['ISBN', 'isbn'], ['Contributeurs', 'contributors'], ['Œuvres liées', 'relatedWorks'],
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-none max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Prévisualiser et comparer la version</DialogTitle>
          <DialogDescription>
            Lecture seule — le projet courant n’est pas édité par cette prévisualisation.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!comparison && !error && <p className="py-8 text-center text-muted-foreground">Chargement de la comparaison…</p>}
        {comparison && (
          <div className="min-h-0 flex-1 space-y-4 overflow-hidden">
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              État courant enregistré côté serveur, figé le {formatDate(comparison.comparedAt)}. Les modifications locales non enregistrées ne sont pas incluses.
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded border p-3"><strong>Version passée</strong><br />{comparison.snapshot.projectTitle}</div>
              <div className="rounded border p-3"><strong>État courant enregistré</strong><br />{comparison.current.projectTitle}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded border p-3">
                <strong>Métadonnées de la version</strong>
                <dl className="mt-2 space-y-1">{metadataKeys.map(([label, key]) => <div key={key}><dt className="font-medium">{label}</dt><dd>{metadataValue(comparison.snapshot.editorialMetadata?.[key])}</dd></div>)}</dl>
              </div>
              <div className="rounded border p-3">
                <strong>Métadonnées courantes enregistrées</strong>
                <dl className="mt-2 space-y-1">{metadataKeys.map(([label, key]) => <div key={key}><dt className="font-medium">{label}</dt><dd>{metadataValue(comparison.current.editorialMetadata?.[key])}</dd></div>)}</dl>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Chapitres modifiés</h3>
              {changes.length === 0 ? <p className="text-sm text-muted-foreground">Aucun chapitre modifié.</p> : (
                <div className="flex flex-wrap gap-2">
                  {changes.map((change) => (
                    <Button key={change.id} variant={change.id === selectedChapterId ? 'default' : 'outline'} size="sm" onClick={() => setSelectedChapterId(change.id)}>
                      {change.before?.title ?? change.after?.title} <Badge variant="secondary" className="ml-2">{change.status}</Badge>
                    </Button>
                  ))}
                </div>
              )}
              {chapterChoices.length > changes.length && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Autres chapitres de la version</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chapterChoices.filter((change) => change.status === 'Inchangé').map((change) => (
                      <Button key={change.id} variant={change.id === selectedChapterId ? 'default' : 'outline'} size="sm" onClick={() => setSelectedChapterId(change.id)}>
                        {change.before?.title ?? change.after?.title}
                      </Button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {selected && (
              <ScrollArea className="h-[45vh] rounded border">
                <div className="grid min-w-[700px] grid-cols-2 divide-x">
                  <section className="p-4">
                    <h3 className="mb-3 font-medium">Version passée {selected.before ? `— ${selected.before.title}` : ''}</h3>
                    <DiffPane value={pastText} otherValue={currentText} kind="past" />
                    {pastRichChanges.length > 0 && <div className="mt-4 rounded bg-red-50 p-3"><Badge variant="outline">Blocs riches supprimés ou modifiés</Badge>{pastRichChanges.map((change, index) => <div key={index}><span className="text-xs font-medium">{change.status}</span><RichBlockPreview block={change.block} /></div>)}</div>}
                  </section>
                  <section className="p-4">
                    <h3 className="mb-3 font-medium">État courant {selected.after ? `— ${selected.after.title}` : ''}</h3>
                    <DiffPane value={currentText} otherValue={pastText} kind="current" />
                    {currentRichChanges.length > 0 && <div className="mt-4 rounded bg-green-50 p-3"><Badge variant="outline">Blocs riches ajoutés ou modifiés</Badge>{currentRichChanges.map((change, index) => <div key={index}><span className="text-xs font-medium">{change.status}</span><RichBlockPreview block={change.block} /></div>)}</div>}
                  </section>
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
