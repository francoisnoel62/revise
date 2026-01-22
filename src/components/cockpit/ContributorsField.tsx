// ABOUTME: Dynamic field for managing project contributors
// ABOUTME: Allows adding, editing, and removing contributors with roles

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { CONTRIBUTOR_ROLES, CONTRIBUTOR_ROLE_LABELS } from '@/lib/ui-labels';

interface Contributor {
  name: string;
  role: string;
}

interface ContributorsFieldProps {
  contributors: Contributor[];
  onChange: (contributors: Contributor[]) => void;
  disabled?: boolean;
}

export function ContributorsField({
  contributors,
  onChange,
  disabled = false,
}: ContributorsFieldProps) {
  const handleAdd = () => {
    onChange([...contributors, { name: '', role: 'author' }]);
  };

  const handleRemove = (index: number) => {
    const updated = contributors.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (index: number, field: keyof Contributor, value: string) => {
    const updated = contributors.map((c, i) => {
      if (i !== index) return c;
      return { ...c, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Contributeurs</Label>
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

      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun contributeur ajouté
        </p>
      ) : (
        <div className="space-y-2">
          {contributors.map((contributor, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Nom"
                value={contributor.name}
                onChange={(e) => handleChange(index, 'name', e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Select
                value={contributor.role}
                onValueChange={(value) => handleChange(index, 'role', value)}
                disabled={disabled}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTOR_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {CONTRIBUTOR_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
