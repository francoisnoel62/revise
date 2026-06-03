// ABOUTME: Form component for creating/editing research documents
// ABOUTME: Handles type-specific fields (URL for links, content for quotes)

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';
import { SerializedResearchDocument } from '@/app/actions/research-document-actions';
import { ResearchDocumentType } from '@/domain/entities/ResearchDocument';

interface ResearchDocumentFormData {
  type: ResearchDocumentType;
  title: string;
  url: string;
  sourceTitle: string;
  sourceAuthor: string;
  body: string;
  tags: string[];
}

interface ResearchDocumentFormProps {
  onSubmit: (data: ResearchDocumentFormData) => Promise<void>;
  initialValues?: Partial<SerializedResearchDocument>;
  submitLabel?: string;
  isLoading?: boolean;
  onCancel?: () => void;
}

const TYPE_OPTIONS: { value: ResearchDocumentType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Lien' },
  { value: 'quote', label: 'Citation' },
  { value: 'reference', label: 'Référence' },
  { value: 'image', label: 'Image' },
];

export function ResearchDocumentForm({
  onSubmit,
  initialValues,
  submitLabel = 'Créer le document',
  isLoading = false,
  onCancel,
}: ResearchDocumentFormProps) {
  const [formData, setFormData] = useState<ResearchDocumentFormData>({
    type: initialValues?.type ?? 'note',
    title: initialValues?.title ?? '',
    url: initialValues?.url ?? '',
    sourceTitle: initialValues?.sourceTitle ?? '',
    sourceAuthor: initialValues?.sourceAuthor ?? '',
    body: typeof initialValues?.content?.text === 'string' ? initialValues.content.text : '',
    tags: initialValues?.tags ?? [],
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    if (!initialValues) {
      // Reset form only for creation
      setFormData({
        type: 'note',
        title: '',
        url: '',
        sourceTitle: '',
        sourceAuthor: '',
        body: '',
        tags: [],
      });
    }
  };

  const handleChange = <K extends keyof ResearchDocumentFormData>(
    field: K,
    value: ResearchDocumentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      handleChange('tags', [...formData.tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange(
      'tags',
      formData.tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const isLinkType = formData.type === 'link';
  const showSourceFields = ['quote', 'reference'].includes(formData.type);
  const showBody = ['note', 'quote', 'reference', 'image'].includes(formData.type);
  const isValid = formData.title.trim() && (!isLinkType || formData.url.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {initialValues ? 'Modifier le document' : 'Nouveau document'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value as ResearchDocumentType)}
              disabled={isLoading || !!initialValues}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titre du document"
              required
              disabled={isLoading}
            />
          </div>

          {isLinkType && (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {!isLinkType && (
            <div className="space-y-2">
              <Label htmlFor="url">URL (optionnel)</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
              />
            </div>
          )}

          {showSourceFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sourceTitle">Titre de la source</Label>
                <Input
                  id="sourceTitle"
                  value={formData.sourceTitle}
                  onChange={(e) => handleChange('sourceTitle', e.target.value)}
                  placeholder="Titre du livre, article..."
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceAuthor">Auteur de la source</Label>
                <Input
                  id="sourceAuthor"
                  value={formData.sourceAuthor}
                  onChange={(e) => handleChange('sourceAuthor', e.target.value)}
                  placeholder="Nom de l'auteur"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {showBody && (
            <div className="space-y-2">
              <Label htmlFor="body">Corps (optionnel)</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder={
                  formData.type === 'image'
                    ? "Légende, description de l'image, contexte pour l'IA..."
                    : "Scénario, plan détaillé, explication d'intrigue, notes..."
                }
                rows={6}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ajouter un tag..."
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={isLoading || !newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !isValid}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
