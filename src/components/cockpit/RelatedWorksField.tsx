// ABOUTME: Dynamic field for managing related works
// ABOUTME: Allows adding, editing, and removing related works

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';

interface RelatedWorksFieldProps {
  relatedWorks: RelatedWork[];
  onChange: (relatedWorks: RelatedWork[]) => void;
  disabled?: boolean;
}

export function RelatedWorksField({
  relatedWorks,
  onChange,
  disabled = false,
}: RelatedWorksFieldProps) {
  const handleAdd = () => {
    onChange([...relatedWorks, { title: '' }]);
  };

  const handleRemove = (index: number) => {
    const updated = relatedWorks.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (index: number, field: keyof RelatedWork, value: string) => {
    const updated = relatedWorks.map((w, i) => {
      if (i !== index) return w;
      const newValue = value.trim() || undefined;
      return { ...w, [field]: field === 'title' ? value : newValue };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Œuvres liées</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {relatedWorks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune œuvre liée (préquelles, suites, etc.)
        </p>
      ) : (
        <div className="space-y-2">
          {relatedWorks.map((work, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Titre de l'œuvre"
                value={work.title}
                onChange={(e) => handleChange(index, 'title', e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Input
                placeholder="ID projet (optionnel)"
                value={work.projectId || ''}
                onChange={(e) => handleChange(index, 'projectId', e.target.value)}
                disabled={disabled}
                className="w-40"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
