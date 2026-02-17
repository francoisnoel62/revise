// ABOUTME: React Flow diagram showing the multi-layer flow of an AI chapter generation request
// ABOUTME: Animated visualization of Author Text -> Analyses -> Prompt -> AI Response

'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SerializedRequestRecord } from '@/app/actions/request-visualization-actions';

interface RequestFlowDiagramProps {
  record: SerializedRequestRecord;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const ANALYSIS_NODE_HEIGHT = 48;
const COL_X = [0, 220, 440, 660];

function buildNodes(record: SerializedRequestRecord): Node[] {
  const presentEntries = record.analysisContext.entries.filter((e) => e.present);
  const totalAnalyses = Math.max(presentEntries.length, 1);
  const diagramHeight = Math.max(totalAnalyses * (ANALYSIS_NODE_HEIGHT + 12), NODE_HEIGHT + 20);
  const centerY = diagramHeight / 2;

  const nodes: Node[] = [];

  // Column 1: Author text node
  nodes.push({
    id: 'author-text',
    position: { x: COL_X[0], y: centerY - NODE_HEIGHT / 2 },
    data: {
      label: (
        <div className="text-center">
          <div className="text-xs font-semibold text-blue-900">Texte auteur</div>
          <div className="text-xs text-blue-700 mt-0.5 line-clamp-1">
            {record.responsePreview ? 'Manuscrit' : 'Texte source'}
          </div>
        </div>
      ),
    },
    style: {
      background: '#dbeafe',
      border: '1.5px solid #3b82f6',
      borderRadius: 8,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // Column 2: Analysis nodes (only present ones)
  presentEntries.forEach((entry, idx) => {
    const totalSpacing = totalAnalyses * (ANALYSIS_NODE_HEIGHT + 12);
    const startY = centerY - totalSpacing / 2 + 6;
    const y = startY + idx * (ANALYSIS_NODE_HEIGHT + 12);

    nodes.push({
      id: `analysis-${entry.typeKey}`,
      position: { x: COL_X[1], y },
      data: {
        label: (
          <div className="text-center px-1">
            <div
              className="text-xs font-semibold truncate"
              style={{ color: entry.colorCode }}
            >
              {entry.label}
            </div>
          </div>
        ),
      },
      style: {
        background: `${entry.colorCode}18`,
        border: `1.5px solid ${entry.colorCode}`,
        borderRadius: 8,
        width: NODE_WIDTH,
        height: ANALYSIS_NODE_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // If no analyses, show "No context" node
  if (presentEntries.length === 0) {
    nodes.push({
      id: 'no-analysis',
      position: { x: COL_X[1], y: centerY - ANALYSIS_NODE_HEIGHT / 2 },
      data: {
        label: (
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Aucune analyse</div>
          </div>
        ),
      },
      style: {
        background: '#f1f5f9',
        border: '1.5px dashed #94a3b8',
        borderRadius: 8,
        width: NODE_WIDTH,
        height: ANALYSIS_NODE_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  }

  // Column 3: Prompt node
  nodes.push({
    id: 'prompt',
    position: { x: COL_X[2], y: centerY - NODE_HEIGHT / 2 },
    data: {
      label: (
        <div className="text-center">
          <div className="text-xs font-semibold text-purple-900">Prompt assemblé</div>
          <div className="text-xs text-purple-700 mt-0.5 line-clamp-1 px-1">
            {record.prompt.humanReadableSummary}
          </div>
        </div>
      ),
    },
    style: {
      background: '#f3e8ff',
      border: '1.5px solid #a855f7',
      borderRadius: 8,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // Column 4: AI response node
  nodes.push({
    id: 'ai-response',
    position: { x: COL_X[3], y: centerY - NODE_HEIGHT / 2 },
    data: {
      label: (
        <div className="text-center px-1">
          <div className="text-xs font-semibold text-emerald-900">Réponse IA</div>
          <div className="text-xs text-emerald-700 mt-0.5 line-clamp-1">
            {record.provider}
          </div>
        </div>
      ),
    },
    style: {
      background: '#d1fae5',
      border: '1.5px solid #10b981',
      borderRadius: 8,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  return nodes;
}

function buildEdges(record: SerializedRequestRecord): Edge[] {
  const presentEntries = record.analysisContext.entries.filter((e) => e.present);
  const edges: Edge[] = [];

  const edgeStyle = {
    strokeWidth: 1.5,
    stroke: '#94a3b8',
  };

  const markerEnd = {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
    width: 12,
    height: 12,
  };

  // Author text -> each analysis
  const analysisTargets = presentEntries.length > 0
    ? presentEntries.map((e) => `analysis-${e.typeKey}`)
    : ['no-analysis'];

  for (const target of analysisTargets) {
    edges.push({
      id: `author-to-${target}`,
      source: 'author-text',
      target,
      style: edgeStyle,
      markerEnd,
      animated: false,
    });
  }

  // Each analysis -> prompt
  for (const target of analysisTargets) {
    edges.push({
      id: `${target}-to-prompt`,
      source: target,
      target: 'prompt',
      style: edgeStyle,
      markerEnd,
      animated: false,
    });
  }

  // Prompt -> AI response
  edges.push({
    id: 'prompt-to-response',
    source: 'prompt',
    target: 'ai-response',
    style: { ...edgeStyle, stroke: '#a855f7' },
    markerEnd: { ...markerEnd, color: '#a855f7' },
    animated: true,
  });

  return edges;
}

export function RequestFlowDiagram({ record }: RequestFlowDiagramProps) {
  const nodes = useMemo(() => buildNodes(record), [record]);
  const edges = useMemo(() => buildEdges(record), [record]);

  return (
    <div className="w-full rounded-lg border bg-muted/10 overflow-hidden" style={{ height: 220 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.8} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
