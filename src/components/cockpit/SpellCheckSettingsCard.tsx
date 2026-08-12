// ABOUTME: Settings card for the vocabulary a project invented and the words it ignores
// ABOUTME: Lets authors declare a word's nature, gender and plural so grammar rules can apply

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
import { savePersonalDictionaryAction } from '@/app/actions/personal-dictionary-actions';
import {
  toPersonalDictionaryEntry,
  type PersonalDictionaryEntry,
  type PersonalDictionaryGender,
  type PersonalDictionaryNature,
} from '@/domain/value-objects/PersonalDictionaryEntry';

interface SpellCheckSettingsCardProps {
  projectId: string;
  initialCustomDictionary: PersonalDictionaryEntry[];
  initialIgnoredWords: string[];
}

const NATURE_LABELS: { value: PersonalDictionaryNature | ''; label: string }[] = [
  { value: '', label: 'Non précisé' },
  { value: 'proper-noun', label: 'Nom propre' },
  { value: 'noun', label: 'Nom commun' },
  { value: 'adjective', label: 'Adjectif' },
];

const GENDER_LABELS: { value: PersonalDictionaryGender | ''; label: string }[] = [
  { value: '', label: 'Non précisé' },
  { value: 'masculine', label: 'Masculin' },
  { value: 'feminine', label: 'Féminin' },
  { value: 'epicene', label: 'Épicène' },
];

const FIELD_CLASS =
  'h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground';

function wordCount(n: number) {
  return n === 1 ? '1 mot' : `${n} mots`;
}

export function SpellCheckSettingsCard({
  projectId,
  initialCustomDictionary,
  initialIgnoredWords,
}: SpellCheckSettingsCardProps) {
  const [dictionary, setDictionary] =
    useState<PersonalDictionaryEntry[]>(initialCustomDictionary);
  const [ignored, setIgnored] = useState<string[]>(initialIgnoredWords);
  const [newWord, setNewWord] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleRemoveFromDictionary = useCallback(
    async (word: string) => {
      setDictionary((prev) => prev.filter((entry) => entry.word !== word));
      await removeWordFromCustomDictionaryAction(projectId, word);
    },
    [projectId]
  );

  const handleAddWord = useCallback(async () => {
    const trimmed = newWord.trim();
    if (!trimmed || dictionary.some((entry) => entry.word === trimmed)) return;
    setIsAdding(true);
    setDictionary((prev) => [...prev, { word: trimmed }]);
    setNewWord('');
    await addWordToCustomDictionaryAction(projectId, trimmed);
    setIsAdding(false);
  }, [projectId, newWord, dictionary]);

  /** Holds what is being typed; normalization waits for the field to be left. */
  const editPlural = useCallback((word: string, pluralForm: string) => {
    setDictionary((prev) =>
      prev.map((entry) => (entry.word === word ? { ...entry, pluralForm } : entry))
    );
  }, []);

  /** Declarations travel together: the engine dictionary is rebuilt from the whole list. */
  const saveDeclaration = useCallback(
    async (word: string, change: Partial<PersonalDictionaryEntry>) => {
      const updated = dictionary.map((entry) =>
        entry.word === word ? toPersonalDictionaryEntry({ ...entry, ...change }) : entry
      );
      setDictionary(updated);
      await savePersonalDictionaryAction(projectId, updated);
    },
    [projectId, dictionary]
  );

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
            <>
              <p className="text-xs text-muted-foreground">
                Précisez la nature et le genre d&apos;un mot pour que les accords soient
                vérifiés autour de lui. Sans précision, le correcteur reste muet.
              </p>
              <ul className="space-y-1">
                {dictionary.map((entry) => (
                  <li
                    key={entry.word}
                    className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
                  >
                    <span className="text-sm font-mono flex-1 min-w-24">{entry.word}</span>

                    <select
                      aria-label={`Nature de ${entry.word}`}
                      value={entry.nature ?? ''}
                      onChange={(e) =>
                        saveDeclaration(entry.word, {
                          nature: (e.target.value || undefined) as
                            | PersonalDictionaryNature
                            | undefined,
                        })
                      }
                      className={FIELD_CLASS}
                    >
                      {NATURE_LABELS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={`Genre de ${entry.word}`}
                      value={entry.gender ?? ''}
                      onChange={(e) =>
                        saveDeclaration(entry.word, {
                          gender: (e.target.value || undefined) as
                            | PersonalDictionaryGender
                            | undefined,
                        })
                      }
                      className={FIELD_CLASS}
                    >
                      {GENDER_LABELS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Typed freely, saved on blur — one save per plural, not per keystroke. */}
                    <input
                      aria-label={`Pluriel de ${entry.word}`}
                      placeholder="Invariable"
                      value={entry.pluralForm ?? ''}
                      onChange={(e) => editPlural(entry.word, e.target.value)}
                      onBlur={() => saveDeclaration(entry.word, {})}
                      className={`${FIELD_CLASS} w-28`}
                    />

                    <button
                      aria-label={`Supprimer ${entry.word}`}
                      onClick={() => handleRemoveFromDictionary(entry.word)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
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
