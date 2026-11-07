import { NodeViewWrapper } from '@tiptap/react';
import { Network, Workflow, Maximize2, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getSmartHandles } from '../utils/layout';
import MindMapNode from './MindMapNode';
import FlowchartNode from './FlowchartNode';
import EmbeddedDiagramModal from './EmbeddedDiagramModal';

const nodeTypes = {
  custom: MindMapNode,
  flowchart: FlowchartNode,
};

export default function EmbeddedDiagramNode(props: any) {
  const { diagramId, diagramType, title } = props.node.attrs;
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
            style: { stroke: 'var(--n600)', strokeWidth: 1.5 },
          };
        }),
      };
    }
  }, [rawData, diagramType]);

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (diagramType === 'mindmap') {
      window.location.hash = `#/mindmap?map=${diagramId}`;
    } else {
      window.location.hash = `#/flowchart?map=${diagramId}`;
    }
  };

  return (
    <NodeViewWrapper className="embedded-diagram-node" contentEditable={false}>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '12px',
          margin: '16px 0',
          backgroundColor: 'var(--n10)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '640px',
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--b400)')}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--n800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {diagramType === 'mindmap' ? (
              <Network size={15} color="var(--b400)" />
            ) : (
              <Workflow size={15} color="var(--prio-medium)" />
            )}
            <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'none' }}>
              {title || 'Untitled Diagram'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--n30)', padding: '1px 6px', borderRadius: '4px' }}>
              {diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleOpenInEditor}
              className="btn btn-ghost"
              style={{ height: '24px', padding: '0 8px', fontSize: '12px', gap: '4px' }}
              title="Edit in full canvas"
            >
              <ExternalLink size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
              className="btn btn-ghost"
              style={{ height: '24px', padding: '0 6px', fontSize: '12px' }}
              title="Expand preview"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
        <div style={{
          height: '240px',
          backgroundColor: 'var(--bg-board)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {!rawData ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading preview...
            </div>
          ) : nodes.length > 0 ? (
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.25, maxZoom: 0.9 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                minZoom={0.05}
              />
            </ReactFlowProvider>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Empty diagram — click Edit to add nodes.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <EmbeddedDiagramModal
          diagramId={diagramId}
          diagramType={diagramType}
          title={title}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </NodeViewWrapper>
  );
}
