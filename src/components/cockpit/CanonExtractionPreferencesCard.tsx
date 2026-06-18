// ABOUTME: Settings card for per-project canon extraction preferences
// ABOUTME: Controls whether extraction triggers automatically at session end or manually

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import {
  CanonExtractionPreferences,
  DEFAULT_CANON_EXTRACTION_PREFERENCES,
} from '@/domain/value-objects/CanonExtractionPreferences';
import { updateProjectSettingsAction } from '@/app/actions/project-settings-actions';

interface CanonExtractionPreferencesCardProps {
  projectId: string;
  initialPreferences: CanonExtractionPreferences;
}

export function CanonExtractionPreferencesCard({
  projectId,
  initialPreferences,
}: CanonExtractionPreferencesCardProps) {
  const [prefs, setPrefs] = useState<CanonExtractionPreferences>(
    initialPreferences ?? DEFAULT_CANON_EXTRACTION_PREFERENCES
  );
  const [saved, setSaved] = useState<CanonExtractionPreferences>(
    initialPreferences ?? DEFAULT_CANON_EXTRACTION_PREFERENCES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(saved);

  const handleSessionEndToggle = (checked: boolean) => {
    setPrefs({ mode: checked ? 'session-end' : 'manual' });
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProjectSettingsAction(projectId, {
        canonExtractionPreferences: prefs,
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
    <Card id="canon-extraction">
      <CardHeader>
        <CardTitle>Faits canon</CardTitle>
        <CardDescription>
          Configurez quand l&apos;extraction des faits canon se déclenche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="canon-session-end" className="cursor-pointer">
              Extraction automatique en fin de session
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Après 15 minutes d&apos;inactivité, l&apos;extraction incrémentale se
              déclenche silencieusement en arrière-plan. Désactivé par défaut.
            </p>
          </div>
          <Switch
            id="canon-session-end"
            checked={prefs.mode === 'session-end'}
            onCheckedChange={handleSessionEndToggle}
          />
        </div>

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
