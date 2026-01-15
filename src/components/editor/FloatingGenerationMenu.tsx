// ABOUTME: Floating menu for AI chapter generation when editor is empty
// ABOUTME: Offers 3 generation options: beginning, full chapter, or outline

'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, FileText, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateChapterAction } from '@/app/actions/chapter-generation-actions';
import { CHAPTER_GENERATION_TYPES, ChapterGenerationTypeKey } from '@/domain';

interface FloatingGenerationMenuProps {
  editor: Editor | null;
  projectId: string;
  isVisible: boolean;
}

export function FloatingGenerationMenu({
  editor,
  projectId,
  isVisible,
}: FloatingGenerationMenuProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeType, setActiveType] = useState<ChapterGenerationTypeKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isVisible || !editor) return null;

  const handleGenerate = async (generationType: ChapterGenerationTypeKey) => {
    setIsGenerating(true);
    setActiveType(generationType);
    setError(null);

    try {
      const result = await generateChapterAction(projectId, generationType);

      if (!result.success) {
        setError(result.error || 'Erreur lors de la génération');
        return;
      }

      // Insert generated content into editor
      const content = JSON.parse(result.data.tipTapContent);
      editor.commands.setContent(content);

      // Show suggestions if available
      if (result.data.suggestions && result.data.suggestions.length > 0) {
        console.log('Suggestions pour la suite:', result.data.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setIsGenerating(false);
      setActiveType(null);
    }
  };

  const generationOptions = [
    {
      type: 'chapter-beginning' as ChapterGenerationTypeKey,
      icon: Sparkles,
      label: CHAPTER_GENERATION_TYPES['chapter-beginning'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-beginning'].description,
    },
    {
      type: 'chapter-full' as ChapterGenerationTypeKey,
      icon: FileText,
      label: CHAPTER_GENERATION_TYPES['chapter-full'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-full'].description,
    },
    {
      type: 'chapter-outline' as ChapterGenerationTypeKey,
      icon: List,
      label: CHAPTER_GENERATION_TYPES['chapter-outline'].name,
      description: CHAPTER_GENERATION_TYPES['chapter-outline'].description,
    },
  ];

  return (
    <div className="absolute inset-0 flex items-start justify-center pt-16 pointer-events-none z-10">
      <Card className="pointer-events-auto shadow-lg max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Génération IA
          </CardTitle>
          <CardDescription>
            Ce chapitre est vide. Utilisez l&apos;IA pour commencer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <div className="p-2 mb-2 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {generationOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeType === option.type;

            return (
              <Button
                key={option.type}
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleGenerate(option.type)}
                disabled={isGenerating}
              >
                <div className="flex items-start gap-3 text-left">
                  {isActive && isGenerating ? (
                    <Loader2 className="h-5 w-5 mt-0.5 animate-spin text-purple-500" />
                  ) : (
                    <Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                  )}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-500 font-normal">
                      {option.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}

          <p className="text-xs text-slate-400 text-center pt-2">
            Le contenu généré est une impulsion créative, pas un texte définitif.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
