// ABOUTME: Main application page integrating editor, controls, and rewrite flow
// ABOUTME: Orchestrates the complete user journey from import to rewrite to export

'use client';

import { useState } from 'react';
import { TextEditor } from '@/components/editor/TextEditor';
import { DocumentControls } from '@/components/document/DocumentControls';
import { RewriteButton } from '@/components/editor/RewriteButton';
import { ProposalsPanel } from '@/components/proposals/ProposalsPanel';
import { rewriteText } from '@/app/actions';
import { getSelectionPosition } from '@/lib/selection-position';

interface Proposal {
  content: string;
  styleLabel?: string;
}

export default function HomePage() {
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState({ from: 0, to: 0 });
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectionChange = (from: number, to: number) => {
    setSelection({ from, to });

    if (from !== to) {
      const position = getSelectionPosition();
      if (position) {
        setButtonPosition(position);
        setShowRewriteButton(true);
      }
    } else {
      setShowRewriteButton(false);
      setProposals([]);
    }
  };

  const handleRewrite = async () => {
    setLoading(true);
    setShowRewriteButton(false);

    try {
      const result = await rewriteText(
        content,
        selection.from,
        selection.to
      );

      if ('error' in result) {
        alert(`Erreur: ${result.error}`);
        return;
      }

      setProposals(result.proposals);

      // Performance warning in development
      if ('duration' in result && result.duration) {
        if (result.duration > 3000 && process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ Performance target exceeded: ${result.duration.toFixed(0)}ms (target: < 3000ms)`
          );
        }
      }
    } catch (error) {
      alert('Une erreur est survenue lors de la réécriture.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (newText: string) => {
    const before = content.substring(0, selection.from);
    const after = content.substring(selection.to);
    const updated = before + newText + after;

    setContent(updated);
    setProposals([]);
    setShowRewriteButton(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Revise</h1>
          <p className="text-slate-600">
            Outil d'aide à l'écriture minimaliste
          </p>
        </header>

        <DocumentControls onImport={setContent} currentContent={content} />

        <div className="relative">
          <TextEditor
            content={content}
            onContentChange={setContent}
            onSelectionChange={handleSelectionChange}
          />

          <RewriteButton
            visible={showRewriteButton}
            position={buttonPosition}
            onRewrite={handleRewrite}
            loading={loading}
          />
        </div>

        <ProposalsPanel
          proposals={proposals}
          onInsert={handleInsert}
          onClose={() => setProposals([])}
        />
      </div>
    </div>
  );
}
