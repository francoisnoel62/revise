// ABOUTME: Settings card for spell-check per-project vocabulary management
// ABOUTME: Lets authors manage their custom dictionary and ignored words list

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, BookOpen, EyeOff, Plus } from 'lucide-react';
import {
  removeWordFromCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  removeIgnoredWordAction,
  clearIgnoredWordsAction,
} from '@/app/actions/spell-check-actions';

interface SpellCheckSettingsCardProps {
  projectId: string;
  initialCustomDictionary: string[];
  initialIgnoredWords: string[];
}

function wordCount(n: number) {
  return n === 1 ? '1 mot' : `${n} mots`;
}

export function SpellCheckSettingsCard({
  projectId,
  initialCustomDictionary,
  initialIgnoredWords,
}: SpellCheckSettingsCardProps) {
  const [dictionary, setDictionary] = useState<string[]>(initialCustomDictionary);
  const [ignored, setIgnored] = useState<string[]>(initialIgnoredWords);
  const [newWord, setNewWord] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleRemoveFromDictionary = useCallback(
    async (word: string) => {
      setDictionary((prev) => prev.filter((w) => w !== word));
      await removeWordFromCustomDictionaryAction(projectId, word);
    },
    [projectId]
  );

  const handleAddWord = useCallback(async () => {
    const trimmed = newWord.trim();
    if (!trimmed || dictionary.includes(trimmed)) return;
    setIsAdding(true);
    setDictionary((prev) => [...prev, trimmed]);
    setNewWord('');
    await addWordToCustomDictionaryAction(projectId, trimmed);
    setIsAdding(false);
  }, [projectId, newWord, dictionary]);

  const handleRemoveIgnored = useCallback(
    async (word: string) => {
      setIgnored((prev) => prev.filter((w) => w !== word));
      await removeIgnoredWordAction(projectId, word);
    },
    [projectId]
  );

  const handleClearIgnored = useCallback(async () => {
    setIgnored([]);
    await clearIgnoredWordsAction(projectId);
  }, [projectId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Orthographe
        </CardTitle>
        <CardDescription>
          Gérez le vocabulaire spécifique à ce projet — termes inventés, noms propres, mots volontairement incorrects.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Custom dictionary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Dictionnaire personnalisé</h3>
            <Badge variant="secondary">{wordCount(dictionary.length)}</Badge>
          </div>

          {dictionary.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun terme — les mots ajoutés ici ne seront plus soulignés.
            </p>
          ) : (
            <ul className="space-y-1">
              {dictionary.map((word) => (
                <li key={word} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                  <span className="text-sm font-mono">{word}</span>
                  <button
                    aria-label={`Supprimer ${word}`}
                    onClick={() => handleRemoveFromDictionary(word)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Ajouter un mot…"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddWord(); }}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddWord}
              disabled={isAdding || !newWord.trim()}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Ignored words */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Mots ignorés</h3>
            </div>
            <Badge variant="secondary">{wordCount(ignored.length)}</Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Mots intentionnellement incorrects (dialecte, voix de personnage). Jamais signalés dans ce projet.
          </p>

          {ignored.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun mot ignoré pour l&apos;instant.</p>
          ) : (
            <>
              <ul className="space-y-1">
                {ignored.map((word) => (
                  <li key={word} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                    <span className="text-sm font-mono">{word}</span>
                    <button
                      aria-label={`Supprimer ${word}`}
                      onClick={() => handleRemoveIgnored(word)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearIgnored}
                className="text-xs text-muted-foreground"
              >
                Vider la liste
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
