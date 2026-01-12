// ABOUTME: Table component displaying correction history with filtering
// ABOUTME: Shows date, chapter, selected text, and proposals with search functionality

'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      {/* Search filters */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Table */}
      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-[130px]">Date/Heure</TableHead>
              <TableHead className="w-[200px]">Texte sélectionné</TableHead>
              <TableHead className="w-[200px]">Proposition 1</TableHead>
              <TableHead className="w-[200px]">Proposition 2</TableHead>
              <TableHead className="w-[200px]">Proposition 3</TableHead>
              {onDelete && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onDelete ? 6 : 5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {data.length === 0
                    ? 'Aucun historique de correction'
                    : 'Aucun résultat pour cette recherche'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-sm line-clamp-2 cursor-help"
                      title={item.selectedText}
                    >
                      {item.selectedText}
                    </div>
                  </TableCell>
                  {item.proposals.slice(0, 3).map((proposal, idx) => (
                    <TableCell key={idx}>
                      <div
                        className="text-sm text-muted-foreground line-clamp-2 cursor-help"
                        title={proposal}
                      >
                        {proposal}
                      </div>
                    </TableCell>
                  ))}
                  {/* Fill empty proposal columns if less than 3 */}
                  {item.proposals.length < 3 &&
                    Array.from({ length: 3 - item.proposals.length }).map((_, idx) => (
                      <TableCell key={`empty-${idx}`}>-</TableCell>
                    ))}
                  {onDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(item.id)}
                        disabled={isDeleting === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
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
