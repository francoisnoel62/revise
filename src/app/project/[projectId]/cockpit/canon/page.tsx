// ABOUTME: Canon ledger cockpit page — lists facts by character with CRUD and regeneration.
// ABOUTME: Author facts survive re-extraction; derived facts show a freshness indicator.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, RefreshCw, Trash2, Pencil, BookMarked, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SerializedCanonFact,
  listCanonFactsAction,
  createCanonFactAction,
  updateCanonFactAction,
  deleteCanonFactAction,
  generateCanonFactsAction,
  checkCanonFreshnessAction,
} from '@/app/actions/canon-actions';
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';
import { loadProjectAction } from '@/app/actions/project-actions';
import { useNotificationStore } from '@/store/notificationStore';

interface FactsByEntity {
  [entity: string]: SerializedCanonFact[];
}

interface EditingFact {
  id: string;
  entity: string;
  statement: string;
  validFromChapter: number;
  validToChapter: number | null;
}

function groupByEntity(facts: SerializedCanonFact[]): FactsByEntity {
  const result: FactsByEntity = {};
  for (const fact of facts) {
    if (!result[fact.entity]) result[fact.entity] = [];
    result[fact.entity].push(fact);
  }
  return result;
}

export default function CockpitCanonPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [facts, setFacts] = useState<SerializedCanonFact[]>([]);
  const [providers, setProviders] = useState<SafeProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // New-fact form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEntity, setNewEntity] = useState('');
  const [newStatement, setNewStatement] = useState('');
  const [newFromChapter, setNewFromChapter] = useState(0);
  const [newToChapter, setNewToChapter] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit dialog state
  const [editingFact, setEditingFact] = useState<EditingFact | null>(null);

  // Delete confirmation state — a fact (author or derived) is never removed
  // without an explicit confirmation (the author owns and decides).
  const [deletingFact, setDeletingFact] = useState<SerializedCanonFact | null>(null);

  const { addNotification, hasNotificationOfType } = useNotificationStore();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const projectResult = await loadProjectAction(projectId);
      if (!projectResult.success) {
        if (projectResult.redirect) {
          router.push(projectResult.redirect);
          return;
        }
        setLoadError(projectResult.error);
        return;
      }
      const [factsResult, providersResult, freshnessResult] = await Promise.all([
        listCanonFactsAction(projectId),
        listProvidersAction(),
        checkCanonFreshnessAction(projectId),
      ]);

      if (!factsResult.success) {
        setLoadError(factsResult.error);
        return;
      }
      setFacts(factsResult.data.facts);

      if (providersResult.success) {
        setProviders(providersResult.data);
        const defaultId = projectResult.data.providerId ?? providersResult.data[0]?.id ?? '';
        setSelectedProviderId(defaultId);
      }

      if (freshnessResult.success) {
        setIsStale(freshnessResult.data.isStale);
      }
    } catch {
      setLoadError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Push an actionable "canon-stale" notification once when staleness is detected
  useEffect(() => {
    if (!isStale || !selectedProviderId) return;
    if (hasNotificationOfType('canon-stale')) return;
    addNotification({
      type: 'canon-stale',
      title: 'Faits canon périmés',
      message: 'Le manuscrit a été modifié depuis la dernière extraction. Régénérer les faits canon ?',
      severity: 'warning',
      action: {
        label: 'Régénérer',
        confirmMessage: 'L\'extraction incrémentale sera relancée pour les chapitres modifiés. Les faits de l\'auteur sont préservés.',
        onConfirm: async () => {
          await generateCanonFactsAction(projectId, selectedProviderId);
          await loadData();
        },
      },
    });
  }, [isStale, selectedProviderId, addNotification, hasNotificationOfType, projectId, loadData]);

  const handleGenerate = async () => {
    if (!selectedProviderId) {
      setActionError('Sélectionnez un fournisseur IA');
      return;
    }
    setIsGenerating(true);
    setActionError(null);
    setActionNotice(null);

    const result = await generateCanonFactsAction(projectId, selectedProviderId);
    if (!result.success) {
      setActionError(result.error);
    } else {
      // A fast, empty result is almost always "this project has no characters
      // yet" — surface that instead of silently showing an empty canon.
      if (result.data.factCount === 0) {
        setActionNotice(
          result.data.characterCount === 0
            ? "Aucun personnage n'a été identifié dans le manuscrit. Vérifiez que le manuscrit contient du contenu suffisant."
            : "Aucun fait n'a pu être extrait du manuscrit pour les personnages connus."
        );
      }
      await loadData();
    }
    setIsGenerating(false);
  };

  const handleCreate = async () => {
    if (!newEntity.trim() || !newStatement.trim()) {
      setActionError('Personnage et fait sont requis');
      return;
    }
    setIsSaving(true);
    setActionError(null);

    const toChapter = newToChapter === '' ? null : parseInt(newToChapter, 10);
    const result = await createCanonFactAction(projectId, {
      entity: newEntity,
      statement: newStatement,
      validFromChapter: newFromChapter,
      validToChapter: isNaN(toChapter as number) ? null : toChapter,
    });

    if (!result.success) {
      setActionError(result.error);
    } else {
      setFacts((prev) => [...prev, result.data.fact]);
      setShowNewForm(false);
      setNewEntity('');
      setNewStatement('');
      setNewFromChapter(0);
      setNewToChapter('');
    }
    setIsSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingFact) return;
    setIsSaving(true);
    setActionError(null);

    const result = await updateCanonFactAction(projectId, editingFact.id, {
      entity: editingFact.entity,
      statement: editingFact.statement,
      validFromChapter: editingFact.validFromChapter,
      validToChapter: editingFact.validToChapter,
    });

    if (!result.success) {
      setActionError(result.error);
    } else {
      setFacts((prev) =>
        prev.map((f) => (f.id === result.data.fact.id ? result.data.fact : f))
      );
      setEditingFact(null);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingFact) return;
    const factId = deletingFact.id;
    setActionError(null);
    const result = await deleteCanonFactAction(projectId, factId);
    if (!result.success) {
      setActionError(result.error);
    } else {
      setFacts((prev) => prev.filter((f) => f.id !== factId));
    }
    setDeletingFact(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canon</h1>
          <p className="text-muted-foreground">Faits établis par personnage</p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canon</h1>
          <p className="text-muted-foreground">Faits établis par personnage</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const grouped = groupByEntity(facts);
  const entityNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-7 w-7" />
            Canon
          </h1>
          <p className="text-muted-foreground">
            Faits atomiques par personnage, avec validité temporelle.
            Les faits <Badge variant="secondary">auteur</Badge> survivent à la régénération.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {providers.length > 0 && (
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Fournisseur IA" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProviderId}
            size="sm"
            title="Remplace les faits déduits par l'IA. Vos faits (source : auteur) restent intacts."
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Génération…' : 'Générer / Régénérer'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Staleness warning */}
      {isStale && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            Le manuscrit a été modifié depuis la dernière extraction. Les faits dérivés peuvent être
            périmés — régénérez le canon pour les mettre à jour.
          </AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {actionNotice && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionNotice}</AlertDescription>
        </Alert>
      )}

      {/* New-fact inline form */}
      {showNewForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="font-medium text-sm">Nouveau fait (source : auteur)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-entity">Personnage</Label>
              <Input
                id="new-entity"
                value={newEntity}
                onChange={(e) => setNewEntity(e.target.value)}
                placeholder="ex. Léa"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-statement">Fait</Label>
              <Input
                id="new-statement"
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                placeholder="ex. est morte au chapitre 10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-from">Valide depuis (ch. index)</Label>
              <Input
                id="new-from"
                type="number"
                min={0}
                value={newFromChapter}
                onChange={(e) => setNewFromChapter(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-to">Valide jusqu&apos;à (vide = toujours)</Label>
              <Input
                id="new-to"
                type="number"
                min={0}
                value={newToChapter}
                onChange={(e) => setNewToChapter(e.target.value)}
                placeholder="∞"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewForm(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Facts grouped by character */}
      {entityNames.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          Aucun fait de canon. Cliquez sur &quot;Générer / Régénérer&quot; pour extraire les faits du manuscrit,
          ou sur &quot;Ajouter&quot; pour saisir un fait manuellement.
        </p>
      ) : (
        <div className="space-y-6">
          {entityNames.map((entity) => (
            <div key={entity} className="space-y-2">
              <h2 className="font-semibold text-lg">{entity}</h2>
              <div className="space-y-1">
                {grouped[entity].map((fact) => (
                  <div
                    key={fact.id}
                    className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex-1 space-y-0.5">
                      <p>{fact.statement}</p>
                      <p className="text-muted-foreground text-xs">
                        depuis ch.{fact.validFromChapter}
                        {fact.validToChapter !== null
                          ? ` → ch.${fact.validToChapter}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={fact.source === 'author' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {fact.source === 'author' ? 'auteur' : 'dérivé'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setEditingFact({
                            id: fact.id,
                            entity: fact.entity,
                            statement: fact.statement,
                            validFromChapter: fact.validFromChapter,
                            validToChapter: fact.validToChapter,
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingFact(fact)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editingFact && (
        <Dialog open onOpenChange={(open) => !open && setEditingFact(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le fait (source : auteur)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Personnage</Label>
                <Input
                  value={editingFact.entity}
                  onChange={(e) =>
                    setEditingFact((prev) => prev && { ...prev, entity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Fait</Label>
                <Input
                  value={editingFact.statement}
                  onChange={(e) =>
                    setEditingFact((prev) => prev && { ...prev, statement: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valide depuis (ch. index)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingFact.validFromChapter}
                    onChange={(e) =>
                      setEditingFact(
                        (prev) =>
                          prev && {
                            ...prev,
                            validFromChapter: parseInt(e.target.value, 10) || 0,
                          }
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Valide jusqu&apos;à (vide = toujours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingFact.validToChapter ?? ''}
                    onChange={(e) =>
                      setEditingFact(
                        (prev) =>
                          prev && {
                            ...prev,
                            validToChapter:
                              e.target.value === ''
                                ? null
                                : parseInt(e.target.value, 10) || null,
                          }
                      )
                    }
                    placeholder="∞"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFact(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation — protects author-curated facts from accidental loss */}
      <AlertDialog
        open={!!deletingFact}
        onOpenChange={(open) => !open && setDeletingFact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fait ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingFact
                ? `« ${deletingFact.entity} : ${deletingFact.statement} » sera définitivement supprimé. Cette action est irréversible.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
