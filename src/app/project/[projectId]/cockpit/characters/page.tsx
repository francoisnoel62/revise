// ABOUTME: Characters page for managing project characters
// ABOUTME: Allows creating, viewing, editing, and deleting character profiles

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  listCharactersAction,
  createCharacterAction,
  updateCharacterAction,
  deleteCharacterAction,
  SerializedCharacter,
} from '@/app/actions/character-actions';
import { CharacterForm, CharacterCard, CharacterChatSheet } from '@/components/cockpit';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [characters, setCharacters] = useState<SerializedCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<SerializedCharacter | null>(null);
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);
  const [chattingCharacter, setChattingCharacter] = useState<SerializedCharacter | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listCharactersAction(projectId);
      if (result.success) {
        setCharacters(result.characters);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: {
    name: string;
    identity: string;
    appearance: string;
    psychology: string;
    voiceAndLanguage: string;
    backstory: string;
    relationships: string;
    narrativeFunction: string;
    openQuestions: string;
  }) => {
    setIsCreating(true);
    try {
      // First create the character with just the name
      const createResult = await createCharacterAction(projectId, data.name);

      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      // Then update with all the details if provided
      const hasDetails =
        data.identity ||
        data.appearance ||
        data.psychology ||
        data.voiceAndLanguage ||
        data.backstory ||
        data.relationships ||
        data.narrativeFunction ||
        data.openQuestions;

      if (hasDetails) {
        const updateResult = await updateCharacterAction(createResult.character.id, {
          identity: data.identity,
          appearance: data.appearance,
          psychology: data.psychology,
          voiceAndLanguage: data.voiceAndLanguage,
          backstory: data.backstory,
          relationships: data.relationships,
          narrativeFunction: data.narrativeFunction,
          openQuestions: data.openQuestions,
        });

        if (updateResult.success) {
          setCharacters((prev) => [...prev, updateResult.character].sort((a, b) =>
            a.name.localeCompare(b.name, 'fr')
          ));
        } else {
          // If update fails, still add the basic character
          setCharacters((prev) => [...prev, createResult.character].sort((a, b) =>
            a.name.localeCompare(b.name, 'fr')
          ));
        }
      } else {
        setCharacters((prev) => [...prev, createResult.character].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        ));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (data: {
    name: string;
    identity: string;
    appearance: string;
    psychology: string;
    voiceAndLanguage: string;
    backstory: string;
    relationships: string;
    narrativeFunction: string;
    openQuestions: string;
  }) => {
    if (!editingCharacter) return;

    const result = await updateCharacterAction(editingCharacter.id, data);

    if (result.success) {
      setCharacters((prev) =>
        prev
          .map((c) => (c.id === editingCharacter.id ? result.character : c))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      );
      setEditingCharacter(null);
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingCharacterId) return;

    const result = await deleteCharacterAction(deletingCharacterId);

    if (result.success) {
      setCharacters((prev) => prev.filter((c) => c.id !== deletingCharacterId));
    }

    setDeletingCharacterId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personnages</h1>
          <p className="text-muted-foreground">
            Fiches détaillées de vos personnages
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personnages</h1>
        <p className="text-muted-foreground">
          Gérez les fiches de vos personnages et suivez leur évolution
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Character Form */}
        <CharacterForm onSubmit={handleCreate} isLoading={isCreating} />

        {/* Characters List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Vos personnages ({characters.length})
          </h2>
          {characters.length === 0 ? (
            <p className="text-muted-foreground">
              Aucun personnage créé. Ajoutez votre premier personnage !
            </p>
          ) : (
            <div className="space-y-3">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onEdit={setEditingCharacter}
                  onDelete={setDeletingCharacterId}
                  onChat={setChattingCharacter}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier {editingCharacter?.name}</DialogTitle>
          </DialogHeader>
          {editingCharacter && (
            <CharacterForm
              onSubmit={handleEdit}
              initialValues={editingCharacter}
              submitLabel="Enregistrer"
              showAllFields
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCharacterId}
        onOpenChange={() => setDeletingCharacterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce personnage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le personnage sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Character Chat */}
      {chattingCharacter && (
        <CharacterChatSheet
          open={!!chattingCharacter}
          character={chattingCharacter}
          projectId={projectId}
          onClose={() => setChattingCharacter(null)}
        />
      )}
    </div>
  );
}
