// ABOUTME: Side sheet component displaying spell check results
// ABOUTME: Shows corrections with ability to apply individual fixes or all at once

'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Copy, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SpellCheckCorrectionDTO {
  original: string;
  corrected: string;
  type: 'spelling' | 'grammar' | 'style' | 'punctuation';
  explanation: string;
  typeLabel: string;
}

interface SpellCheckResultDTO {
  corrections: SpellCheckCorrectionDTO[];
  correctedText: string;
  hasErrors: boolean;
  summary: string;
}

interface SpellCheckSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SpellCheckResultDTO | null;
  onApplyCorrection: (original: string, corrected: string) => void;
  onApplyAll: (correctedText: string) => void;
  loading?: boolean;
}

const typeColors: Record<string, string> = {
  spelling: 'bg-red-100 text-red-800 border-red-200',
  grammar: 'bg-orange-100 text-orange-800 border-orange-200',
  punctuation: 'bg-blue-100 text-blue-800 border-blue-200',
  style: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function SpellCheckSheet({
  open,
  onOpenChange,
  result,
  onApplyCorrection,
  onApplyAll,
  loading = false,
}: SpellCheckSheetProps) {
  const [appliedCorrections, setAppliedCorrections] = useState<Set<number>>(new Set());

  const handleApplyCorrection = (index: number, original: string, corrected: string) => {
    onApplyCorrection(original, corrected);
    setAppliedCorrections((prev) => new Set(prev).add(index));
  };

  const handleApplyAll = () => {
    if (result?.correctedText) {
      onApplyAll(result.correctedText);
      // Mark all as applied
      const allIndices = new Set(result.corrections.map((_, i) => i));
      setAppliedCorrections(allIndices);
    }
  };

  // Reset applied corrections when result changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAppliedCorrections(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-[400px] sm:w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {loading ? (
              <>Vérification en cours...</>
            ) : result?.hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Corrections suggérées
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Aucune erreur détectée
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {loading
              ? 'Analyse du texte...'
              : result?.summary || 'Vérification orthographique et grammaticale'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : result?.hasErrors ? (
          <div className="mt-4 space-y-4">
            {/* Apply All Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleApplyAll}
                disabled={appliedCorrections.size === result.corrections.length}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Appliquer toutes les corrections
              </Button>
            </div>

            {/* Corrections List */}
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-3 pr-4">
                {result.corrections.map((correction, index) => (
                  <CorrectionCard
                    key={index}
                    correction={correction}
                    applied={appliedCorrections.has(index)}
                    onApply={() =>
                      handleApplyCorrection(index, correction.original, correction.corrected)
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-slate-700">Parfait !</p>
            <p className="text-sm text-slate-500 mt-2">
              Aucune erreur d&apos;orthographe ou de grammaire détectée.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CorrectionCardProps {
  correction: SpellCheckCorrectionDTO;
  applied: boolean;
  onApply: () => void;
}

function CorrectionCard({ correction, applied, onApply }: CorrectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(correction.corrected);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`border rounded-lg p-3 transition-opacity ${
        applied ? 'opacity-50 bg-slate-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="outline" className={typeColors[correction.type]}>
          {correction.typeLabel}
        </Badge>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copier la correction"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onApply}
            disabled={applied}
            className="h-7 w-7 p-0"
            title="Appliquer cette correction"
          >
            {applied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="line-through text-red-600 bg-red-50 px-1 rounded">
            {correction.original}
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-green-600 bg-green-50 px-1 rounded font-medium">
            {correction.corrected}
          </span>
        </div>

        <p className="text-xs text-slate-500">{correction.explanation}</p>
      </div>
    </div>
  );
}
