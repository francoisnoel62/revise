// ABOUTME: Dialog for exporting projects with chapter selection.
// ABOUTME: Allows users to choose which chapters to include, export format, and DOCX style preset.

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/store/projectStore';
import { exportProject, exportProjectPdf } from '@/app/actions';
import { Download, Loader2, FileText, File } from 'lucide-react';
import type { DocxStylePreset } from '@/domain/interfaces/DocumentExporter';

type ExportFormat = 'docx' | 'pdf';

const FORMAT_CONFIG = {
  docx: {
    label: 'DOCX (Word)',
    icon: FileText,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  pdf: {
    label: 'PDF',
    icon: File,
    mimeType: 'application/pdf',
  },
} as const;

const DOCX_PRESETS: { value: DocxStylePreset; label: string; description: string }[] = [
  {
    value: 'kdp',
    label: 'KDP (6×9")',
    description: 'Format impression Amazon KDP — Garamond 11pt, marges miroir, chapitres sur pages impaires',
  },
  {
    value: 'neutral',
    label: 'Neutre',
    description: 'Titres en noir, styles natifs LibreOffice / Word sinon',
  },
  {
    value: 'structured',
    label: 'Structuré',
    description: 'Styles par défaut du lecteur (titres bleus LibreOffice)',
  },
];

export function ExportDialog() {
  const router = useRouter();
  const { projectId, project, isExporting, setIsExporting } = useProjectStore();

  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('docx');
  const [selectedPreset, setSelectedPreset] = useState<DocxStylePreset>('kdp');
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && project) {
      setSelectedChapterIds(new Set(project.chapters.map((ch) => ch.id)));
    }
  };

  const sortedChapters = useMemo(() => {
    if (!project) return [];
    return [...project.chapters].sort((a, b) => a.order - b.order);
  }, [project]);

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (project) {
      setSelectedChapterIds(new Set(project.chapters.map((ch) => ch.id)));
    }
  };

  const deselectAll = () => {
    setSelectedChapterIds(new Set());
  };

  const allSelected = project ? selectedChapterIds.size === project.chapters.length : false;
  const noneSelected = selectedChapterIds.size === 0;

  const handleExport = async () => {
    if (!projectId || noneSelected) return;

    setIsExporting(true);

    try {
      const chapterIds = Array.from(selectedChapterIds);
      const chaptersArg = allSelected ? undefined : chapterIds;

      const result =
        selectedFormat === 'docx'
          ? await exportProject(projectId, chaptersArg, selectedPreset)
          : await exportProjectPdf(projectId, chaptersArg);

      if (!result.success) {
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }
        throw new Error(result.error);
      }

      const config = FORMAT_CONFIG[selectedFormat];
      const blob = new Blob([new Uint8Array(result.data.buffer)], { type: config.mimeType });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : "Échec de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || !project}
          className="px-2 sm:px-3"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              <span className="hidden sm:inline">Export...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exporter</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter le projet
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les chapitres à inclure et le format d&apos;export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex gap-2">
              {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map((format) => {
                const config = FORMAT_CONFIG[format];
                const Icon = config.icon;
                return (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFormat(format)}
                    className="flex-1"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* DOCX Style Preset — only shown for DOCX format */}
          {selectedFormat === 'docx' && (
            <div className="space-y-2">
              <Label>Style de sortie</Label>
              <div className="space-y-2">
                {DOCX_PRESETS.map((preset) => (
                  <label
                    key={preset.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedPreset === preset.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stylePreset"
                      value={preset.value}
                      checked={selectedPreset === preset.value}
                      onChange={() => setSelectedPreset(preset.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{preset.label}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Chapitres</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={allSelected}
                  className="h-7 text-xs"
                >
                  Tout
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  disabled={noneSelected}
                  className="h-7 text-xs"
                >
                  Aucun
                </Button>
              </div>
            </div>

            <div className="max-h-48 sm:max-h-64 overflow-y-auto rounded-lg border p-2 space-y-1">
              {sortedChapters.map((chapter) => (
                <label
                  key={chapter.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedChapterIds.has(chapter.id)}
                    onCheckedChange={() => toggleChapter(chapter.id)}
                  />
                  <span className="text-sm flex-1 truncate">{chapter.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {chapter.metadata.wordCount} mots
                  </span>
                </label>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedChapterIds.size} chapitre{selectedChapterIds.size > 1 ? 's' : ''}{' '}
              sélectionné{selectedChapterIds.size > 1 ? 's' : ''}
            </p>
          </div>

          {/* Export Button */}
          <Button
            className="w-full gap-2"
            onClick={handleExport}
            disabled={isExporting || noneSelected}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exporter ({FORMAT_CONFIG[selectedFormat].label})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
