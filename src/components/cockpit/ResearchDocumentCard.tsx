// ABOUTME: Card component displaying research document summary
// ABOUTME: Shows type icon, title, tags, and quick actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Link as LinkIcon,
  Quote,
  BookOpen,
  Image,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { SerializedResearchDocument } from '@/app/actions/research-document-actions';
import { ResearchDocumentType } from '@/domain/entities/ResearchDocument';

const TYPE_ICONS: Record<ResearchDocumentType, typeof FileText> = {
  note: FileText,
  link: LinkIcon,
  quote: Quote,
  reference: BookOpen,
  image: Image,
};

const TYPE_LABELS: Record<ResearchDocumentType, string> = {
  note: 'Note',
  link: 'Lien',
  quote: 'Citation',
  reference: 'Référence',
  image: 'Image',
};

interface ResearchDocumentCardProps {
  document: SerializedResearchDocument;
  onEdit: (document: SerializedResearchDocument) => void;
  onDelete: (documentId: string) => void;
}

export function ResearchDocumentCard({
  document,
  onEdit,
  onDelete,
}: ResearchDocumentCardProps) {
  const Icon = TYPE_ICONS[document.type];

  return (
    <Card className="relative group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase">
              {TYPE_LABELS[document.type]}
            </span>
            <CardTitle className="text-lg line-clamp-1">{document.title}</CardTitle>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(document)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(document.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {document.url && (
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{document.url}</span>
          </a>
        )}

        {document.sourceTitle && (
          <p className="text-sm text-muted-foreground italic">
            {document.sourceAuthor && `${document.sourceAuthor}, `}
            {document.sourceTitle}
          </p>
        )}

        {typeof document.content?.text === 'string' && document.content.text.trim() && (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {document.content.text}
          </p>
        )}

        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{document.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
