// ABOUTME: Export controls with format selection dropdown.
// ABOUTME: Supports DOCX and PDF export via server actions.

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/store/projectStore';
import { exportProject, exportProjectPdf } from '@/app/actions';
import { Download, Loader2, ChevronDown, FileText, File } from 'lucide-react';

type ExportFormat = 'docx' | 'pdf';

const FORMAT_CONFIG = {
  docx: {
    label: 'DOCX (Word)',
    icon: FileText,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    action: exportProject,
  },
  pdf: {
    label: 'PDF',
    icon: File,
    mimeType: 'application/pdf',
    action: exportProjectPdf,
  },
} as const;

export function DocumentControls() {
  const router = useRouter();

  const { projectId, project, isExporting, setIsExporting } = useProjectStore();

  const handleExport = async (format: ExportFormat) => {
    if (!projectId) return;

    setIsExporting(true);

    try {
      const config = FORMAT_CONFIG[format];
      const result = await config.action(projectId);

      if (!result.success) {
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }
        throw new Error(result.error);
      }

      // Create blob and download
      const blob = new Blob([new Uint8Array(result.data.buffer)], {
        type: config.mimeType,
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
      alert(error instanceof Error ? error.message : 'Échec de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || !project} className="px-2 md:px-3">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin md:mr-2" />
              <span className="hidden md:inline">Export en cours...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Exporter</span>
              <ChevronDown className="ml-1 h-3 w-3 md:ml-2 md:h-4 md:w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('docx')}>
          <FileText className="mr-2 h-4 w-4" />
          DOCX (Word)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <File className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
