// ABOUTME: UI controls for document import and export operations
// ABOUTME: Provides file upload and download functionality with Server Actions

'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { importDocument, exportDocument } from '@/app/actions';

interface DocumentControlsProps {
  onImport: (content: string) => void;
  currentContent: string;
}

export function DocumentControls({
  onImport,
  currentContent,
}: DocumentControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const result = await importDocument(formData);

    if ('error' in result) {
      alert(`Erreur d'import: ${result.error}`);
      return;
    }

    onImport(result.content);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    const result = await exportDocument(currentContent);

    if ('error' in result) {
      alert(`Erreur d'export: ${result.error}`);
      return;
    }

    // Convert number array back to Buffer
    const buffer = Buffer.from(result.buffer);

    // Create download link
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button onClick={handleImportClick} variant="outline">
        Importer .docx
      </Button>
      <Button onClick={handleExport} variant="outline">
        Exporter .docx
      </Button>
    </div>
  );
}
