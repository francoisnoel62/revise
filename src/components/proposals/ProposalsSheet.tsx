// ABOUTME: Right-side sheet for displaying AI rewrite proposals
// ABOUTME: Shows 3 proposals with insert buttons in dismissible panel

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Proposal {
  content: string;
  styleLabel?: string;
}

interface ProposalsSheetProps {
  open: boolean;
  proposals: Proposal[];
  originalText?: string;
  onInsert: (content: string) => void;
  onClose: () => void;
}

export function ProposalsSheet({
  open,
  proposals,
  originalText,
  onInsert,
  onClose,
}: ProposalsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-125 sm:w-150 flex flex-col">
        <SheetHeader>
          <SheetTitle>Propositions de réécriture</SheetTitle>
        </SheetHeader>

        {/* Original selected text */}
        {originalText && (
          <div className="mt-4 mx-4 p-3 bg-slate-100 border border-slate-200 rounded-lg shrink-0">
            <p className="text-xs text-slate-500 font-medium mb-1">Texte original</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{originalText}</p>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 mt-4">
          <div className="space-y-4 px-4 pb-4">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors bg-white"
              >
                <p className="text-sm text-slate-900 mb-3 whitespace-pre-wrap">
                  {proposal.content}
                </p>

                {proposal.styleLabel && (
                  <span className="text-xs text-slate-500 block mb-2 italic">
                    Style: {proposal.styleLabel}
                  </span>
                )}

                <Button
                  onClick={() => {
                    onInsert(proposal.content);
                    onClose();
                  }}
                  size="sm"
                  className="w-full"
                >
                  Insérer
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
