// ABOUTME: Export controls using server-backed actions.
// ABOUTME: Export loads project from database and downloads as .docx file.

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/store/projectStore';
import { exportProject } from '@/app/actions';
import { Download, Loader2 } from 'lucide-react';

export function DocumentControls() {
  const router = useRouter();

  const { projectId, project, isExporting, setIsExporting } = useProjectStore();

  const handleExport = async () => {
    if (!projectId) return;

    setIsExporting(true);

    try {
      const result = await exportProject(projectId);

      if (!result.success) {
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }
        throw new Error(result.error);
      }

      // Create blob and download
      const blob = new Blob([new Uint8Array(result.data.buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || !project}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </>
      )}
    </Button>
  );
}
