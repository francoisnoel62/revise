// ABOUTME: Right-side panel for AI request visualization
// ABOUTME: Shows how an AI chapter generation was constructed with analyses, prompt, and metadata

'use client';

import dynamic from 'next/dynamic';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Code2, Clock, History } from 'lucide-react';
import { useRequestVisualizationStore } from '@/store/requestVisualizationStore';
import { AnalysisContextCards } from './AnalysisContextCards';
import { PromptSection } from './PromptSection';
import { MetadataSection } from './MetadataSection';
import { RequestHistoryList } from './RequestHistoryList';

// Load React Flow dynamically to avoid SSR issues and reduce initial bundle
const RequestFlowDiagram = dynamic(
  () => import('./RequestFlowDiagram').then((mod) => mod.RequestFlowDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] rounded-lg border bg-muted/10 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Chargement du diagramme...</p>
      </div>
    ),
  }
);

interface RequestVisualizationSheetProps {
  projectId: string;
}

export function RequestVisualizationSheet({ projectId }: RequestVisualizationSheetProps) {
  const {
    isOpen,
    isAdvancedView,
    activeRecord,
    history,
    isLoadingRecord,
    isLoadingHistory,
    closePanel,
    toggleAdvancedView,
    loadHistory,
    selectRecord,
  } = useRequestVisualizationStore();

  const handleOpenChange = (open: boolean) => {
    if (!open) closePanel();
  };

  const handleOpenHistory = () => {
    loadHistory(projectId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[650px] lg:w-[700px] flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualisation de la requête IA
            </SheetTitle>

            <div className="flex items-center gap-2">
              {/* History toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleOpenHistory}
                title="Voir l'historique"
              >
                <History className="h-3 w-3" />
              </Button>

              {/* Simple/Advanced toggle */}
              <Button
                variant={isAdvancedView ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={toggleAdvancedView}
              >
                <Code2 className="h-3 w-3" />
                {isAdvancedView ? 'Simple' : 'Avancé'}
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {isLoadingRecord ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Chargement...</p>
                </div>
              </div>
            ) : activeRecord ? (
              <>
                {/* Flow Diagram */}
                <section>
                  <RequestFlowDiagram record={activeRecord} />
                </section>

                <Separator />

                {/* Analysis Context */}
                <section>
                  <AnalysisContextCards record={activeRecord} />
                </section>

                <Separator />

                {/* Prompt */}
                <section>
                  <PromptSection record={activeRecord} isAdvanced={isAdvancedView} />
                </section>

                <Separator />

                {/* Metadata */}
                <section>
                  <MetadataSection record={activeRecord} isAdvanced={isAdvancedView} />
                </section>

                {/* History (shown when loaded) */}
                {history.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Historique</h3>
                      <RequestHistoryList
                        history={history}
                        activeRecordId={activeRecord.id}
                        isLoading={isLoadingHistory}
                        onSelect={selectRecord}
                      />
                    </section>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Aucune requête sélectionnée</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
