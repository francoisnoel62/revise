// ABOUTME: Settings card for per-project autocomplete preferences
// ABOUTME: Controls suggestion length, audace, partial acceptance, and opt-in learning

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import {
  AutocompletePreferences,
  DEFAULT_AUTOCOMPLETE_PREFERENCES,
  SuggestionLength,
  AudaceLevel,
} from '@/domain/value-objects/AutocompletePreferences';
import { updateProjectSettingsAction } from '@/app/actions/project-settings-actions';

interface AutocompletePreferencesCardProps {
  projectId: string;
  initialPreferences: AutocompletePreferences;
}

export function AutocompletePreferencesCard({
  projectId,
  initialPreferences,
}: AutocompletePreferencesCardProps) {
  const [prefs, setPrefs] = useState<AutocompletePreferences>(
    initialPreferences ?? DEFAULT_AUTOCOMPLETE_PREFERENCES
  );
  const [saved, setSaved] = useState<AutocompletePreferences>(
    initialPreferences ?? DEFAULT_AUTOCOMPLETE_PREFERENCES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(saved);

  const set = <K extends keyof AutocompletePreferences>(key: K, value: AutocompletePreferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProjectSettingsAction(projectId, {
        autocompletePreferences: prefs,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setSaved(prefs);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card id="autocomplete">
      <CardHeader>
        <CardTitle>Autocomplétion</CardTitle>
        <CardDescription>
          Configurez le comportement de l&apos;assistant d&apos;écriture IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="ac-enabled" className="cursor-pointer">
            Autocomplétion activée
          </Label>
          <Switch
            id="ac-enabled"
            checked={prefs.enabled}
            onCheckedChange={(checked) => set('enabled', checked)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Suggestion length */}
          <div className="space-y-2">
            <Label>Longueur de suggestion</Label>
            <Select
              value={prefs.suggestionLength}
              onValueChange={(v) => set('suggestionLength', v as SuggestionLength)}
              disabled={!prefs.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Courte</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="long">Longue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audace level */}
          <div className="space-y-2">
            <Label>Audace de l&apos;IA</Label>
            <Select
              value={prefs.audace}
              onValueChange={(v) => set('audace', v as AudaceLevel)}
              disabled={!prefs.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prudent">Prudente</SelectItem>
                <SelectItem value="balanced">Équilibrée</SelectItem>
                <SelectItem value="bold">Audacieuse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Smart prefetch */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ac-prefetch" className="cursor-pointer">
              Préchargement discret
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prépare une suggestion après une pause, sans l&apos;afficher avant Tab
            </p>
          </div>
          <Switch
            id="ac-prefetch"
            checked={prefs.smartPrefetch}
            onCheckedChange={(checked) => set('smartPrefetch', checked)}
            disabled={!prefs.enabled}
          />
        </div>

        {/* Partial acceptance */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ac-partial" className="cursor-pointer">
              Acceptation partielle par mot
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ctrl+→ accepte un mot à la fois depuis la suggestion
            </p>
          </div>
          <Switch
            id="ac-partial"
            checked={prefs.partialAcceptance}
            onCheckedChange={(checked) => set('partialAcceptance', checked)}
            disabled={!prefs.enabled}
          />
        </div>

        {/* Learn from rejections — opt-in */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ac-learn" className="cursor-pointer">
              Apprendre des rejets
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Opt-in — aucune donnée partagée sans votre accord
            </p>
          </div>
          <Switch
            id="ac-learn"
            checked={prefs.learnFromRejections}
            onCheckedChange={(checked) => set('learnFromRejections', checked)}
            disabled={!prefs.enabled}
          />
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">Préférences enregistrées</p>}
          </div>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
