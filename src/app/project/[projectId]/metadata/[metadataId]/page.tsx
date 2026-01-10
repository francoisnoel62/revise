// ABOUTME: Metadata editor page with TipTap integration.
// ABOUTME: Allows viewing and editing metadata content.

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import {
  SerializedMetadata,
  loadMetadataAction,
  updateMetadataContentAction,
} from '@/app/actions/metadata-actions';
import { loadProjectAction } from '@/app/actions/project-actions';

export default function MetadataEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const metadataId = params.metadataId as string;

  const [projectTitle, setProjectTitle] = useState('');
  const [metadata, setMetadata] = useState<SerializedMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load metadata on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      // Load project title
      const projectResult = await loadProjectAction(projectId);
      if (!projectResult.success) {
        if (projectResult.redirect) {
          router.push(projectResult.redirect);
          return;
        }
        setError(projectResult.error);
        setIsLoading(false);
        return;
      }
      setProjectTitle(projectResult.data.title);

      // Load metadata
      const metadataResult = await loadMetadataAction(metadataId);
      if (!metadataResult.success) {
        setError(metadataResult.error);
      } else {
        setMetadata(metadataResult.data);
      }

      setIsLoading(false);
    }

    loadData();
  }, [projectId, metadataId, router]);

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
        heading: false, // We'll add our own
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: metadata?.content ? JSON.parse(metadata.content) : { type: 'doc', content: [] },
    immediatelyRender: false, // Fix SSR hydration mismatch with Next.js
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none p-8 min-h-[500px] focus:outline-none',
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/project/${projectId}/metadata`}>
            <Button>Retour aux métadonnées</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/project/${projectId}/metadata`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{metadata.title}</h1>
                <p className="text-sm text-muted-foreground">{projectTitle}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {isSaving ? 'Enregistrement...' : 'Enregistré'}
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </div>
  );
}
