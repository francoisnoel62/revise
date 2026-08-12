// ABOUTME: Author-facing controls for typography by semantic text role.
// ABOUTME: Edits one complete, bounded LevelStyleSet for the active PDF profile.

'use client';

import { useState } from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  LEVEL_STYLE_ROLES,
  LevelStyleSet,
  type LevelStyle,
  type LevelStyleRole,
  type LevelStyleSetProperties,
} from '@/domain/value-objects/LevelStyleSet';
import type { PdfPublicationProfileId } from '@/domain/entities/ProjectSettings';

const ROLE_LABELS: Record<LevelStyleRole, string> = {
  'titre-de-chapitre': 'Titre de chapitre',
  'sous-titre': 'Sous-titre',
  corps: 'Corps',
  citation: 'Citation',
  epigraphe: 'Épigraphe',
};

interface LevelStylesPanelProps {
  readonly profileId: PdfPublicationProfileId;
  readonly styles: LevelStyleSetProperties;
  readonly onChange: (styles: LevelStyleSetProperties) => void;
  /** Project-wide, unlike the styles above, which apply to the selected role only. */
  readonly honorBlankLines: boolean;
  readonly onHonorBlankLinesChange: (honorBlankLines: boolean) => void;
  readonly isSaving?: boolean;
}

export function LevelStylesPanel({
  profileId,
  styles,
  onChange,
  honorBlankLines,
  onHonorBlankLinesChange,
  isSaving = false,
}: LevelStylesPanelProps) {
  const [role, setRole] = useState<LevelStyleRole>('titre-de-chapitre');
  const style = styles[role];

  const update = (patch: Partial<LevelStyle>) => {
    onChange(
      LevelStyleSet.create({
        ...styles,
        [role]: { ...style, ...patch },
      }).values,
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={isSaving}>
          <Type className="h-4 w-4" />
          Typographie
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-h-[75vh] overflow-y-auto">
        <div className="space-y-4" aria-label="Typographie par niveau">
          <div>
            <p className="font-medium">Typographie par niveau</p>
            <p className="text-xs text-muted-foreground">
              Profil {profileId === 'kdp-6x9' ? 'KDP 6×9' : 'A5'} · aperçu en direct
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="level-style-role">Niveau de texte</Label>
            <select
              id="level-style-role"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(event) => setRole(event.target.value as LevelStyleRole)}
            >
              {LEVEL_STYLE_ROLES.map((item) => (
                <option key={item} value={item}>{ROLE_LABELS[item]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="level-font-size">Taille (pt)</Label>
              <Input
                id="level-font-size"
                aria-label="Taille (pt)"
                type="number"
                min={6}
                max={48}
                step={0.5}
                value={style.fontSizePoints}
                onChange={(event) => update({ fontSizePoints: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level-line-height">Interligne</Label>
              <Input
                id="level-line-height"
                type="number"
                min={1}
                max={3}
                step={0.05}
                value={style.lineHeight}
                onChange={(event) => update({ lineHeight: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level-space-before">Espace avant (pt)</Label>
              <Input
                id="level-space-before"
                type="number"
                min={0}
                max={200}
                value={style.spaceBeforePoints}
                onChange={(event) => update({ spaceBeforePoints: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level-space-after">Espace après (pt)</Label>
              <Input
                id="level-space-after"
                type="number"
                min={0}
                max={200}
                value={style.spaceAfterPoints}
                onChange={(event) => update({ spaceAfterPoints: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="level-font-family">Police</Label>
            <select
              id="level-font-family"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={style.fontFamily}
              onChange={(event) => update({ fontFamily: event.target.value as LevelStyle['fontFamily'] })}
            >
              <option value="EB Garamond">EB Garamond</option>
              <option value="Arial">Arial</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="level-font-weight">Graisse</Label>
              <select
                id="level-font-weight"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={style.fontWeight}
                onChange={(event) => update({ fontWeight: event.target.value as LevelStyle['fontWeight'] })}
              >
                <option value="normal">Normale</option>
                <option value="bold">Gras</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level-alignment">Alignement</Label>
              <select
                id="level-alignment"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={style.alignment}
                onChange={(event) => update({ alignment: event.target.value as LevelStyle['alignment'] })}
              >
                <option value="left">Gauche</option>
                <option value="center">Centré</option>
                <option value="right">Droite</option>
                <option value="justify">Justifié</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="level-italic">Italique</Label>
            <Switch
              id="level-italic"
              checked={style.italic}
              onCheckedChange={(checked) => update({ italic: checked })}
            />
          </div>

          <div className="space-y-1.5 border-t pt-4">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="honor-blank-lines">Lignes vides visibles</Label>
              <Switch
                id="honor-blank-lines"
                checked={honorBlankLines}
                onCheckedChange={onHonorBlankLinesChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              S&apos;applique au projet entier, pas au niveau sélectionné. Une ligne vide que vous
              tapez occupe alors une ligne sur la page. Les lignes vides collées à un titre restent
              supprimées : ces titres gèrent déjà leur espacement.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
