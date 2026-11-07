import { useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Background, MiniMap, Controls, MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getSmartHandles } from '../utils/layout';
import { X, ExternalLink } from 'lucide-react';
import MindMapNode from './MindMapNode';
import FlowchartNode from './FlowchartNode';

const nodeTypes = {
  custom: MindMapNode,
  flowchart: FlowchartNode,
};

interface Props {
  diagramId: string;
  diagramType: 'mindmap' | 'flowchart';
  title: string;
  onClose: () => void;
}

export default function EmbeddedDiagramModal({ diagramId, diagramType, title, onClose }: Props) {
  const rawData = useLiveQuery(async () => {
    if (!diagramId) return { dbNodes: [], dbEdges: [] };
    if (diagramType === 'mindmap') {
      const [dbNodes, dbEdges] = await Promise.all([
        db.mindMapNodes.where('mindMapId').equals(diagramId).toArray(),
        db.mindMapEdges.where('mindMapId').equals(diagramId).toArray(),
      ]);
      return { dbNodes, dbEdges };
    } else {
      const [dbNodes, dbEdges] = await Promise.all([
        db.flowchartNodes.where('flowchartId').equals(diagramId).toArray(),
        db.flowchartEdges.where('flowchartId').equals(diagramId).toArray(),
      ]);
      return { dbNodes, dbEdges };
    }
  }, [diagramId, diagramType]);

  const { nodes, edges } = useMemo(() => {
    if (!rawData) return { nodes: [] as Node[], edges: [] as Edge[] };
    const { dbNodes, dbEdges } = rawData;

    if (diagramType === 'mindmap') {
      return {
        nodes: dbNodes.map((n: any) => ({
          id: n.id,
          type: 'custom',
          position: n.position,
          data: { label: n.label, taskId: n.taskId },
        })),
        edges: dbEdges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'default',
          animated: false,
          style: { stroke: 'var(--n500)', strokeWidth: 1.5 },
        })),
      };
    } else {
      const nodeMap = new Map(dbNodes.map((n: any) => [n.id, n]));
      return {
        nodes: dbNodes.map((n: any) => ({
          id: n.id,
          type: 'flowchart',
          position: n.position,
          data: { label: n.label, shape: n.shape, taskId: n.taskId },
        })),
        edges: dbEdges.map((e: any) => {
          const srcNode = nodeMap.get(e.source);
          const tgtNode = nodeMap.get(e.target);
          const computed = srcNode && tgtNode
            ? getSmartHandles(srcNode.position, tgtNode.position)
            : { sourceHandle: 'bottom', targetHandle: 'top' };
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? computed.sourceHandle,
            targetHandle: e.targetHandle ?? computed.targetHandle,
            label: e.label,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: 'var(--n600)', strokeWidth: 1.5 },
          };
        }),
      };
    }
  }, [rawData, diagramType]);

  const handleOpenInEditor = () => {
    onClose();
    if (diagramType === 'mindmap') {
      window.location.hash = `#/mindmap?map=${diagramId}`;
    } else {
      window.location.hash = `#/flowchart?map=${diagramId}`;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 30, 66, 0.65)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-board)',
        width: '88vw',
        height: '86vh',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-modal)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', backgroundColor: 'var(--n0)', borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--n800)', textTransform: 'none' }}>{title}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--n20)', padding: '2px 8px', borderRadius: '4px' }}>
              {diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleOpenInEditor} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} /> Open in Editor
            </button>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 0.95 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
              minZoom={0.1}
            >
              <Background gap={24} size={2} color="var(--n40)" />
              <Controls />
              <MiniMap zoomable pannable nodeColor="var(--b100)" maskColor="rgba(244, 245, 247, 0.7)" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

      </div>
    </div>
  );
}
