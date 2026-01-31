// ABOUTME: Cockpit metadata editor page with TipTap integration.
// ABOUTME: Allows viewing and editing metadata content within the cockpit.

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  SerializedMetadata,
  loadMetadataAction,
  updateMetadataContentAction,
} from '@/app/actions/metadata-actions';
import { METADATA_TYPES } from '@/domain/value-objects/MetadataType';

export default function CockpitMetadataEditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const metadataId = params.metadataId as string;

  const [metadata, setMetadata] = useState<SerializedMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load metadata on mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const metadataResult = await loadMetadataAction(metadataId);
      if (!metadataResult.success) {
        setError(metadataResult.error);
        return;
      }
      setMetadata(metadataResult.data);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [metadataId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save handler
  const handleSave = useCallback(async (content: string) => {
    setIsSaving(true);

    try {
      const result = await updateMetadataContentAction(metadataId, content);
      if (!result.success) {
        console.error('Save failed:', result.error);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [metadataId]);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: metadata?.content ? JSON.parse(metadata.content) : { type: 'doc', content: [] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none p-8 min-h-[500px] focus:outline-none',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        handleSave(JSON.stringify(json));
      }, 1000);
    },
  });

  // Update editor content when metadata loads
  useEffect(() => {
    if (editor && metadata?.content) {
      try {
        const content = JSON.parse(metadata.content);
        editor.commands.setContent(content);
      } catch {
        // Invalid JSON, keep empty
      }
    }
  }, [editor, metadata?.content]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}/cockpit/metadata`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métadonnée</h1>
            <p className="text-muted-foreground">Erreur de chargement</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href={`/project/${projectId}/cockpit/metadata`}>
          <Button>Retour aux métadonnées</Button>
        </Link>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}/cockpit/metadata`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{metadata.title}</h1>
            <p className="text-muted-foreground">
              {METADATA_TYPES[metadata.typeKey]?.name ?? metadata.typeKey}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {isSaving ? 'Enregistrement...' : 'Enregistré'}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
