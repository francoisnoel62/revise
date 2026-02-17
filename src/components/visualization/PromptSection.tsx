// ABOUTME: Displays the prompt sent to the AI in simple or advanced view
// ABOUTME: Simple view shows human-readable summary; advanced view shows full raw prompts

'use client';

import { useState } from 'react';
import { SerializedRequestRecord } from '@/app/actions/request-visualization-actions';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PromptSectionProps {
  record: SerializedRequestRecord;
  isAdvanced: boolean;
}

export function PromptSection({ record, isAdvanced }: PromptSectionProps) {
  const [systemExpanded, setSystemExpanded] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);

  if (!isAdvanced) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Requête envoyée</h3>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-foreground">{record.prompt.humanReadableSummary}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Prompt complet</h3>

      {/* System prompt */}
      <div className="rounded-lg border bg-muted/20">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 h-auto text-left"
          onClick={() => setSystemExpanded(!systemExpanded)}
        >
          <span className="text-xs font-medium text-muted-foreground">System Prompt</span>
          {systemExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {systemExpanded && (
          <div className="px-3 pb-3">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 max-h-64 overflow-y-auto">
              {record.prompt.systemPrompt}
            </pre>
          </div>
        )}
      </div>

      {/* User message */}
      <div className="rounded-lg border bg-muted/20">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 h-auto text-left"
          onClick={() => setUserExpanded(!userExpanded)}
        >
          <span className="text-xs font-medium text-muted-foreground">Message Utilisateur</span>
          {userExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {userExpanded && (
          <div className="px-3 pb-3">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 max-h-64 overflow-y-auto">
              {record.prompt.userMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
