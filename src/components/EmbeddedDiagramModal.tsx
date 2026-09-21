import { useEffect, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, MiniMap, Controls } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { db } from '../db/db';
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const loadDiagram = async () => {
      if (diagramType === 'mindmap') {
        const dbNodes = await db.mindMapNodes.where('mindMapId').equals(diagramId).toArray();
        const dbEdges = await db.mindMapEdges.where('mindMapId').equals(diagramId).toArray();

        setNodes(dbNodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: n.position,
          data: { label: n.label, taskId: n.taskId },
        })));
        setEdges(dbEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'default',
          animated: false,
          style: { stroke: 'var(--n800)', strokeWidth: 1 }
        })));
      } else {
        const dbNodes = await db.flowchartNodes.where('flowchartId').equals(diagramId).toArray();
        const dbEdges = await db.flowchartEdges.where('flowchartId').equals(diagramId).toArray();

        setNodes(dbNodes.map(n => ({
          id: n.id,
          type: 'flowchart',
          position: n.position,
          data: { label: n.label, shape: n.shape, taskId: n.taskId },
        })));
        setEdges(dbEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
          type: 'smoothstep',
          style: { stroke: 'var(--n800)', strokeWidth: 1.5 }
        })));
      }
    };
    loadDiagram();
  }, [diagramId, diagramType]);

  const handleOpenInEditor = () => {
    if (diagramType === 'mindmap') {
      window.location.hash = `#/mindmap?map=${diagramId}`;
    } else {
      window.location.hash = `#/flowchart?map=${diagramId}`;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-board)',
        width: '90vw',
        height: '90vh',
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
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--n800)' }}>{title}</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleOpenInEditor} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={16} /> Open in Editor
            </button>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>
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
