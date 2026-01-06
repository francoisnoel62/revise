// ABOUTME: Document import/export controls with loading states
// ABOUTME: Handles file selection and triggers import/export actions

'use client';

import { Button } from '@/components/ui/button';
import { Upload, Download, Loader2 } from 'lucide-react';
import { useRef } from 'react';

interface DocumentControlsProps {
  onImport: (formData: FormData) => Promise<void>;
  onExport: () => Promise<void>;
  importing?: boolean;
  exporting?: boolean;
}

export function DocumentControls({
  onImport,
  onExport,
  importing = false,
  exporting = false,
}: DocumentControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    await onImport(formData);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        onClick={handleImportClick}
        variant="outline"
        disabled={importing}
      >
        {importing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Import...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </>
        )}
      </Button>

      <Button onClick={onExport} variant="outline" disabled={exporting}>
        {exporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Export...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </>
        )}
      </Button>
    </div>
  );
}
