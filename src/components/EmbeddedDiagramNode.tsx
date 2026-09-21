import { NodeViewWrapper } from '@tiptap/react';
import { Network, FileImage } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { db } from '../db/db';
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDiagram = async () => {
      if (!diagramId) return;
      if (diagramType === 'mindmap') {
        const dbNodes = await db.mindMapNodes.where('mindMapId').equals(diagramId).toArray();
        const dbEdges = await db.mindMapEdges.where('mindMapId').equals(diagramId).toArray();
        if (!isMounted) return;
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
        if (!isMounted) return;
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
    return () => { isMounted = false; };
  }, [diagramId, diagramType]);

  return (
    <NodeViewWrapper className="embedded-diagram-node" contentEditable={false}>
      <div 
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px 0',
          backgroundColor: 'var(--n20)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '450px'
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--b500)'}
        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--n800)' }}>
          {diagramType === 'mindmap' ? <Network size={14} color="var(--b500)" /> : <FileImage size={14} color="var(--prio-high)" />}
          <span style={{ fontWeight: 500, fontSize: '11px', textTransform: 'none' }}>
            {title || 'Untitled Diagram'}
          </span>
        </div>
        <div style={{
          height: '240px',
          backgroundColor: 'var(--bg-board)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'none' // Let clicks pass through to open the modal
        }}>
          {nodes.length > 0 ? (
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                minZoom={0.01}
              />
            </ReactFlowProvider>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading preview...
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
