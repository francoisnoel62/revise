// ABOUTME: Card component displaying a character summary
// ABOUTME: Shows name, identity preview with edit/delete actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, User } from 'lucide-react';
import { SerializedCharacter } from '@/app/actions/character-actions';

interface CharacterCardProps {
  character: SerializedCharacter;
  onEdit: (character: SerializedCharacter) => void;
  onDelete: (characterId: string) => void;
}

export function CharacterCard({ character, onEdit, onDelete }: CharacterCardProps) {
  const hasContent =
    character.identity ||
    character.appearance ||
    character.psychology ||
    character.backstory;

  return (
    <Card className="relative group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg">{character.name}</CardTitle>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(character)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(character.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="space-y-2">
            {character.identity && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                <span className="font-medium">Identité:</span> {character.identity}
              </p>
            )}
            {character.narrativeFunction && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                <span className="font-medium">Fonction:</span> {character.narrativeFunction}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Aucune information ajoutée
          </p>
        )}
      </CardContent>
    </Card>
  );
}
