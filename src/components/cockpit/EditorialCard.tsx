// ABOUTME: Card component for editorial annex display
// ABOUTME: Shows title, description, and content status with edit action

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Check } from 'lucide-react';
import { type SerializedEditorialAnnex } from '@/app/actions/editorial-actions';

interface EditorialCardProps {
  annex: SerializedEditorialAnnex;
  onEdit: (annex: SerializedEditorialAnnex) => void;
}

export function EditorialCard({ annex, onEdit }: EditorialCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(annex)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{annex.title}</CardTitle>
            <CardDescription>{annex.description}</CardDescription>
          </div>
          {annex.hasContent ? (
            <Badge variant="secondary" className="shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Rédigé
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 text-muted-foreground">
              À rédiger
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant={annex.hasContent ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(annex);
          }}
        >
          {annex.hasContent ? (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Rédiger
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
