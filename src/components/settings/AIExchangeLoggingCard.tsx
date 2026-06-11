// ABOUTME: Settings card to opt in/out of the AI transparency ledger and set its retention
// ABOUTME: Lets the author enable content capture, choose a purge window, and erase captured content

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, Trash2 } from 'lucide-react';
import {
  getAIExchangeLoggingAction,
  setAIExchangeLoggingAction,
  purgeAIExchangesAction,
} from '@/app/actions/exchange-actions';

const RETENTION_OPTIONS = [7, 30, 90, 180, 365];

export function AIExchangeLoggingCard() {
  const [enabled, setEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAIExchangeLoggingAction().then((result) => {
      if (active && result.success) {
        setEnabled(result.data.enabled);
        setRetentionDays(result.data.retentionDays);
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function persist(nextEnabled: boolean, nextRetention: number) {
    setSaving(true);
    setError('');
    const result = await setAIExchangeLoggingAction(nextEnabled, nextRetention);
    if (result.success) {
      setEnabled(result.data.enabled);
      setRetentionDays(result.data.retentionDays);
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  async function handleToggle(next: boolean) {
    setEnabled(next);
    await persist(next, retentionDays);
  }

  async function handleRetentionChange(value: string) {
    const days = Number(value);
    setRetentionDays(days);
    await persist(enabled, days);
  }

  async function handlePurge() {
    setPurging(true);
    setError('');
    const result = await purgeAIExchangesAction();
    if (!result.success) {
      setError(result.error);
    }
    setPurging(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Journal de transparence IA
        </CardTitle>
        <CardDescription>
          Conservez le contenu réel de vos échanges avec l&apos;IA — ce qui a été
          envoyé et ce qui a été répondu — pour pouvoir le relire opération par
          opération.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="ai-exchange-logging">Activer la journalisation</Label>
            <p className="text-sm text-muted-foreground">
              Désactivée par défaut. Le contenu capturé est chiffré au repos et
              n&apos;est jamais utilisé pour l&apos;entraînement.
            </p>
          </div>
          <Switch
            id="ai-exchange-logging"
            checked={enabled}
            disabled={loading || saving}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>Durée de conservation</Label>
            <p className="text-sm text-muted-foreground">
              Les échanges plus anciens sont automatiquement supprimés.
            </p>
          </div>
          <Select
            value={String(retentionDays)}
            disabled={loading || saving || !enabled}
            onValueChange={handleRetentionChange}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RETENTION_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} jours
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/historique-ia">Consulter le journal</Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-600" disabled={purging}>
                <Trash2 className="mr-2 h-4 w-4" />
                Effacer le contenu capturé
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer tout le contenu capturé ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprime définitivement le contenu de tous vos
                  échanges journalisés. Les statistiques de consommation
                  (tokens, coûts) ne sont pas affectées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={purging}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handlePurge();
                  }}
                  disabled={purging}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {purging ? 'Suppression...' : 'Tout effacer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
