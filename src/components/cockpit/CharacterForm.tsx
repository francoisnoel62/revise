// ABOUTME: Form component for creating/editing characters
// ABOUTME: Handles all character profile fields, with optional AI auto-fill for edit mode

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { SerializedCharacter, generateCharacterSheetFieldsAction } from '@/app/actions/character-actions';

interface CharacterFormData {
  name: string;
  identity: string;
  appearance: string;
  psychology: string;
  voiceAndLanguage: string;
  backstory: string;
  relationships: string;
  narrativeFunction: string;
  openQuestions: string;
}

interface CharacterFormProps {
  onSubmit: (data: CharacterFormData) => Promise<void>;
  initialValues?: Partial<SerializedCharacter>;
  submitLabel?: string;
  isLoading?: boolean;
  showAllFields?: boolean;
  characterId?: string;
  projectId?: string;
}

export function CharacterForm({
  onSubmit,
  initialValues,
  submitLabel = 'Créer le personnage',
  isLoading = false,
  showAllFields = false,
  characterId,
  projectId,
}: CharacterFormProps) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: initialValues?.name ?? '',
    identity: initialValues?.identity ?? '',
    appearance: initialValues?.appearance ?? '',
    psychology: initialValues?.psychology ?? '',
    voiceAndLanguage: initialValues?.voiceAndLanguage ?? '',
    backstory: initialValues?.backstory ?? '',
    relationships: initialValues?.relationships ?? '',
    narrativeFunction: initialValues?.narrativeFunction ?? '',
    openQuestions: initialValues?.openQuestions ?? '',
  });
  const [isExpanded, setIsExpanded] = useState(showAllFields);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    if (!initialValues) {
      setFormData({
        name: '',
        identity: '',
        appearance: '',
        psychology: '',
        voiceAndLanguage: '',
        backstory: '',
        relationships: '',
        narrativeFunction: '',
        openQuestions: '',
      });
    }
  };

  const handleChange = (field: keyof CharacterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoFill = async () => {
    if (!characterId || !projectId) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateCharacterSheetFieldsAction(characterId, projectId);
      if (result.success) {
        setFormData((prev) => ({ ...prev, ...result.fields }));
      } else {
        setGenerateError(result.error);
      }
    } catch {
      setGenerateError('Erreur inattendue lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const optionalFields = [
    { key: 'identity' as const, label: 'Identité', placeholder: 'Qui est ce personnage ?' },
    { key: 'appearance' as const, label: 'Apparence', placeholder: 'Description physique' },
    { key: 'psychology' as const, label: 'Psychologie', placeholder: 'Traits de caractère, motivations' },
    { key: 'voiceAndLanguage' as const, label: 'Voix et langage', placeholder: 'Façon de parler, registre' },
    { key: 'backstory' as const, label: 'Histoire', placeholder: 'Passé du personnage' },
    { key: 'relationships' as const, label: 'Relations', placeholder: 'Liens avec d\'autres personnages' },
    { key: 'narrativeFunction' as const, label: 'Fonction narrative', placeholder: 'Rôle dans l\'histoire' },
    { key: 'openQuestions' as const, label: 'Questions ouvertes', placeholder: 'Points à développer' },
  ];

  const showAutoFill = !!(characterId && projectId && isExpanded);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {initialValues ? 'Modifier le personnage' : 'Nouveau personnage'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nom du personnage"
              required
              disabled={isLoading || isGenerating}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Détails du personnage
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {isExpanded && (
            <div className="space-y-4 pt-2">
              {optionalFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Textarea
                    id={field.key}
                    value={formData[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={isLoading || isGenerating}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}

          {showAutoFill && (
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAutoFill}
                disabled={isLoading || isGenerating || !formData.name.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? 'Génération en cours…' : 'Auto-remplir avec l\'IA'}
              </Button>
              {generateError && (
                <p className="text-sm text-destructive">{generateError}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isGenerating || !formData.name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
