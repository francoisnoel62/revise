// ABOUTME: Panel displaying 5 AI-generated rewrite proposals with insert buttons
// ABOUTME: Implements 2-click UX requirement (select → rewrite → insert)

'use client';

import { Button } from '@/components/ui/button';

interface Proposal {
  content: string;
  styleLabel?: string;
}

interface ProposalsPanelProps {
  proposals: Proposal[];
  onInsert: (content: string) => void;
  onClose: () => void;
}

export function ProposalsPanel({
  proposals,
  onInsert,
  onClose,
}: ProposalsPanelProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-6 max-h-[50vh] overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Propositions</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {proposals.map((proposal, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm text-slate-900">{proposal.content}</p>
                {proposal.styleLabel && (
                  <span className="text-xs text-slate-500 mt-1 inline-block">
                    {proposal.styleLabel}
                  </span>
                )}
              </div>
              <Button
                onClick={() => onInsert(proposal.content)}
                size="sm"
                variant="outline"
              >
                Insérer
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
