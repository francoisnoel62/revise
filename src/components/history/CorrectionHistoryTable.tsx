// ABOUTME: Table component displaying correction history with filtering
// ABOUTME: Uses accordion for expandable rows with copy functionality

'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trash2, Copy, Check } from 'lucide-react';
import { type CorrectionHistoryListItem } from '@/app/actions/correction-history-actions';

interface CorrectionHistoryTableProps {
  data: CorrectionHistoryListItem[];
  onDelete?: (id: string) => void;
  isDeleting?: string | null;
}

export function CorrectionHistoryTable({
  data,
  onDelete,
  isDeleting,
}: CorrectionHistoryTableProps) {
  const [searchText, setSearchText] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter data based on search inputs
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesText =
        !searchText ||
        item.selectedText.toLowerCase().includes(searchText.toLowerCase()) ||
        item.proposals.some((p) =>
          p.toLowerCase().includes(searchText.toLowerCase())
        );

      const matchesDate =
        !searchDate ||
        formatDate(item.createdAt).includes(searchDate);

      return matchesText && matchesDate;
    });
  }, [data, searchText, searchDate]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Search filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Date
          </label>
          <Input
            placeholder="Rechercher par date..."
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Texte
          </label>
          <Input
            placeholder="Rechercher dans le texte..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredData.length} résultat{filteredData.length !== 1 ? 's' : ''}
        {data.length !== filteredData.length && ` sur ${data.length}`}
      </div>

      {/* Accordion list */}
      <ScrollArea className="h-100 rounded-md border">
        {filteredData.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            {data.length === 0
              ? 'Aucun historique de correction'
              : 'Aucun résultat pour cette recherche'}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredData.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2 px-4">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center gap-4 w-full min-w-0">
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="text-sm line-clamp-1 flex-1 text-left wrap-break-word">
                        {item.selectedText}
                      </span>
                    </div>
                  </AccordionTrigger>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      disabled={isDeleting === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <AccordionContent className="px-4">
                  <div className="space-y-3 pt-2">
                    {/* Selected text */}
                    <TextBlock
                      label="Texte sélectionné"
                      text={item.selectedText}
                      id={`${item.id}-selected`}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                    />

                    {/* Proposals - stacked vertically */}
                    {item.proposals.slice(0, 3).map((proposal, idx) => (
                      <TextBlock
                        key={idx}
                        label={`Proposition ${idx + 1}`}
                        text={proposal}
                        id={`${item.id}-prop-${idx}`}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        variant="proposal"
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
}

interface TextBlockProps {
  label: string;
  text: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  variant?: 'default' | 'proposal';
}

function TextBlock({ label, text, id, copiedId, onCopy, variant = 'default' }: TextBlockProps) {
  const isCopied = copiedId === id;

  return (
    <div className={`rounded-lg border p-3 overflow-hidden ${variant === 'proposal' ? 'bg-muted/50' : 'bg-background'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => onCopy(text, id)}
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
              <span className="text-xs text-green-600">Copié</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Copier</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-sm whitespace-pre-wrap wrap-break-word">{text}</p>
    </div>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
