// ABOUTME: Main form component for project settings
// ABOUTME: Handles all project settings fields including cover, narration, contributors

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { CoverImageUpload } from './CoverImageUpload';
import { ContributorsField } from './ContributorsField';
import { RelatedWorksField } from './RelatedWorksField';
import {
  SerializedProjectSettings,
  updateProjectSettingsAction,
  uploadCoverImageAction,
  deleteCoverImageAction,
} from '@/app/actions/project-settings-actions';
import { Contributor } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import {
  POINTS_OF_VIEW,
  POINT_OF_VIEW_LABELS,
  NARRATION_TENSES,
  NARRATION_TENSE_LABELS,
  TARGET_AUDIENCES,
  TARGET_AUDIENCE_LABELS,
  PointOfView,
  NarrationTense,
  TargetAudience,
} from '@/domain/value-objects/NarrationSettings';
import type { TocDepth, TocStyle, TocPreferences } from '@/domain/value-objects/TocPreferences';

const TOC_DEPTHS: readonly TocDepth[] = ['chapters', 'chapters-and-subtitles'];
const TOC_DEPTH_LABELS: Record<TocDepth, string> = {
  chapters: 'Chapitres seuls',
  'chapters-and-subtitles': 'Chapitres et sous-titres',
};

const TOC_STYLES: readonly TocStyle[] = ['classique', 'epure', 'litteraire'];
const TOC_STYLE_LABELS: Record<TocStyle, string> = {
  classique: 'Classique',
  epure: 'Épuré',
  litteraire: 'Littéraire',
};

interface ProjectSettingsFormProps {
  projectId: string;
  initialSettings: SerializedProjectSettings;
}

interface FormData {
  title: string;
  subtitle: string;
  summary: string;
  genre: string;
  synopsis: string;
  pointOfView: PointOfView | '';
  tense: NarrationTense | '';
  targetAudience: TargetAudience | '';
  isbn: string;
  contributors: Contributor[];
  relatedWorks: RelatedWork[];
  tocPreferences: TocPreferences;
}

export function ProjectSettingsForm({ projectId, initialSettings }: ProjectSettingsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: initialSettings.title,
    subtitle: initialSettings.subtitle || '',
    summary: initialSettings.summary,
    genre: initialSettings.genre,
    synopsis: initialSettings.synopsis,
    pointOfView: initialSettings.pointOfView || '',
    tense: initialSettings.tense || '',
    targetAudience: initialSettings.targetAudience || '',
    isbn: initialSettings.isbn || '',
    contributors: initialSettings.contributors,
    relatedWorks: initialSettings.relatedWorks,
    tocPreferences: initialSettings.tocPreferences,
  });

  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initialSettings.coverImageUrl
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      formData.title !== initialSettings.title ||
      formData.subtitle !== (initialSettings.subtitle || '') ||
      formData.summary !== initialSettings.summary ||
      formData.genre !== initialSettings.genre ||
      formData.synopsis !== initialSettings.synopsis ||
      formData.pointOfView !== (initialSettings.pointOfView || '') ||
      formData.tense !== (initialSettings.tense || '') ||
      formData.targetAudience !== (initialSettings.targetAudience || '') ||
      formData.isbn !== (initialSettings.isbn || '') ||
      JSON.stringify(formData.contributors) !== JSON.stringify(initialSettings.contributors) ||
      JSON.stringify(formData.relatedWorks) !== JSON.stringify(initialSettings.relatedWorks) ||
      JSON.stringify(formData.tocPreferences) !== JSON.stringify(initialSettings.tocPreferences);

    setHasChanges(changed);
  }, [formData, initialSettings]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProjectSettingsAction(projectId, {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        summary: formData.summary,
        genre: formData.genre,
        synopsis: formData.synopsis,
        pointOfView: formData.pointOfView || undefined,
        tense: formData.tense || undefined,
        targetAudience: formData.targetAudience || undefined,
        isbn: formData.isbn || undefined,
        contributors: formData.contributors.filter((c) => c.name.trim()),
        relatedWorks: formData.relatedWorks.filter((w) => w.title.trim()),
        tocPreferences: formData.tocPreferences,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setHasChanges(false);
        // Clear success after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadCover = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadCoverImageAction(projectId, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      setCoverImageUrl(result.settings.coverImageUrl);
    } finally {
      setIsUploading(false);
    }
  }, [projectId]);

  const handleDeleteCover = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCoverImageAction(projectId);

      if (!result.success) {
        throw new Error(result.error);
      }

      setCoverImageUrl(undefined);
    } finally {
      setIsDeleting(false);
    }
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Titre, sous-titre et résumé de votre projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Titre du projet"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="Sous-titre (optionnel)"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Résumé</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              placeholder="Un bref résumé de votre projet"
              disabled={isSaving}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                placeholder="Ex: Fantasy, Romance, Thriller"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleChange('isbn', e.target.value)}
                placeholder="978-..."
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle>Couverture</CardTitle>
          <CardDescription>
            Image de couverture de votre livre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoverImageUpload
            currentImageUrl={coverImageUrl}
            onUpload={handleUploadCover}
            onDelete={handleDeleteCover}
            isUploading={isUploading}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Synopsis */}
      <Card>
        <CardHeader>
          <CardTitle>Synopsis</CardTitle>
          <CardDescription>
            Description détaillée de l&apos;histoire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.synopsis}
            onChange={(e) => handleChange('synopsis', e.target.value)}
            placeholder="Le synopsis complet de votre histoire..."
            disabled={isSaving}
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Narration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Narration</CardTitle>
          <CardDescription>
            Paramètres de style narratif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Point de vue</Label>
              <Select
                value={formData.pointOfView}
                onValueChange={(value) => handleChange('pointOfView', value as PointOfView | '')}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {POINTS_OF_VIEW.map((pov) => (
                    <SelectItem key={pov} value={pov}>
                      {POINT_OF_VIEW_LABELS[pov]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temps</Label>
              <Select
                value={formData.tense}
                onValueChange={(value) => handleChange('tense', value as NarrationTense | '')}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {NARRATION_TENSES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {NARRATION_TENSE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Public cible</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) => handleChange('targetAudience', value as TargetAudience | '')}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_AUDIENCES.map((audience) => (
                    <SelectItem key={audience} value={audience}>
                      {TARGET_AUDIENCE_LABELS[audience]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of contents (Sommaire) */}
      <Card>
        <CardHeader>
          <CardTitle>Sommaire</CardTitle>
          <CardDescription>
            Réglages globaux, identiques pour tous les formats d&apos;export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profondeur</Label>
              <Select
                value={formData.tocPreferences.depth}
                onValueChange={(value) =>
                  handleChange('tocPreferences', { ...formData.tocPreferences, depth: value as TocDepth })
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOC_DEPTHS.map((depth) => (
                    <SelectItem key={depth} value={depth}>
                      {TOC_DEPTH_LABELS[depth]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Design</Label>
              <Select
                value={formData.tocPreferences.style}
                onValueChange={(value) =>
                  handleChange('tocPreferences', { ...formData.tocPreferences, style: value as TocStyle })
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOC_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {TOC_STYLE_LABELS[style]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Section (collapsible) */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Avancé</CardTitle>
              <CardDescription>
                Contributeurs et œuvres liées
              </CardDescription>
            </div>
            {isAdvancedExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {isAdvancedExpanded && (
          <CardContent className="space-y-6">
            <ContributorsField
              contributors={formData.contributors}
              onChange={(contributors) => handleChange('contributors', contributors)}
              disabled={isSaving}
            />

            <Separator />

            <RelatedWorksField
              relatedWorks={formData.relatedWorks}
              onChange={(relatedWorks) => handleChange('relatedWorks', relatedWorks)}
              disabled={isSaving}
            />
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Modifications enregistrées</p>}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || !formData.title.trim()}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
