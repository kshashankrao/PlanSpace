import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { FlowchartNodeData, FlowchartEdgeData } from '../db/db';
import FlowchartNode from '../components/FlowchartNode';
import FlowchartSidebar from '../components/FlowchartSidebar';

const nodeTypes = {
  custom: FlowchartNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

function FlowchartCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();

  const [activeFlowchartId, setActiveFlowchartId] = useState<string | null>(null);

  const flowcharts = useLiveQuery(() => db.flowcharts.toArray());
  const dbNodes = useLiveQuery(() => activeFlowchartId ? db.flowchartNodes.where('flowchartId').equals(activeFlowchartId).toArray() : Promise.resolve([] as FlowchartNodeData[]), [activeFlowchartId]);
  const dbEdges = useLiveQuery(() => activeFlowchartId ? db.flowchartEdges.where('flowchartId').equals(activeFlowchartId).toArray() : Promise.resolve([] as FlowchartEdgeData[]), [activeFlowchartId]);

  // Load active flowchart or create default
  React.useEffect(() => {
    if (flowcharts && flowcharts.length > 0 && !activeFlowchartId) {
      setActiveFlowchartId(flowcharts[0].id);
    } else if (flowcharts && flowcharts.length === 0) {
      const newId = crypto.randomUUID();
      db.flowcharts.add({
        id: newId,
        title: 'Main Flowchart',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }).then(() => setActiveFlowchartId(newId));
    }
  }, [flowcharts, activeFlowchartId]);

  // Sync DB to ReactFlow state
  React.useEffect(() => {
    if (dbNodes) {
      setNodes(dbNodes.map(n => ({
        id: n.id,
        type: 'custom',
        position: n.position,
        data: { label: n.label, shape: n.shape }
      })));
    }
  }, [dbNodes, setNodes]);

  React.useEffect(() => {
    if (dbEdges) {
      setEdges(dbEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label
      })));
    }
  }, [dbEdges, setEdges]);

  const onConnect = useCallback(async (params: Connection | Edge) => {
    if (!activeFlowchartId) return;
    const newEdgeId = `e-${params.source}-${params.target}-${Date.now()}`;
    
    await db.flowchartEdges.add({
      id: newEdgeId,
      flowchartId: activeFlowchartId,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle
    });
  }, [activeFlowchartId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!activeFlowchartId || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const shape = event.dataTransfer.getData('application/reactflow/shape');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNodeId = crypto.randomUUID();

      await db.flowchartNodes.add({
        id: newNodeId,
        flowchartId: activeFlowchartId,
        label: '',
        shape: shape as any,
        position
      });

      // After adding, focus it for editing
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
      }, 50);
    },
    [screenToFlowPosition, activeFlowchartId]
  );

  const handleDoubleClickShape = useCallback(async (shape: string) => {
    if (!activeFlowchartId) return;

    let targetY = 100;
    let targetX = 300;
    let sourceNodeId: string | null = null;

    if (dbNodes && dbNodes.length > 0) {
      const bottomMost = dbNodes.reduce((prev, curr) => prev.position.y > curr.position.y ? prev : curr);
      targetX = bottomMost.position.x;
      targetY = bottomMost.position.y + 150;
      sourceNodeId = bottomMost.id;
    }

    const newNodeId = crypto.randomUUID();

    await db.flowchartNodes.add({
      id: newNodeId,
      flowchartId: activeFlowchartId,
      label: '',
      shape: shape as any,
      position: { x: targetX, y: targetY }
    });

    if (sourceNodeId) {
      await db.flowchartEdges.add({
        id: `e-${sourceNodeId}-${newNodeId}-${Date.now()}`,
        flowchartId: activeFlowchartId,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top'
      });
    }

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 50);
  }, [activeFlowchartId, dbNodes]);

  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    await db.flowchartNodes.update(node.id, { position: node.position });
    
    if (activeFlowchartId && dbNodes) {
      const SNAP_DISTANCE = 150;
      let closestNode: typeof dbNodes[0] | null = null;
      let minDistance = Infinity;

      for (const n of dbNodes) {
        if (n.id === node.id) continue;
        const dx = node.position.x - n.position.x;
        const dy = node.position.y - n.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDistance && dist < SNAP_DISTANCE) {
          minDistance = dist;
          closestNode = n;
        }
      }

      if (closestNode) {
        const edgeExists = dbEdges?.some(e => 
          (e.source === node.id && e.target === closestNode!.id) || 
          (e.source === closestNode!.id && e.target === node.id)
        );

        if (!edgeExists) {
          const isBelow = node.position.y > closestNode.position.y;
          const source = isBelow ? closestNode.id : node.id;
          const target = isBelow ? node.id : closestNode.id;
          
          await db.flowchartEdges.add({
            id: `e-${source}-${target}-${Date.now()}`,
            flowchartId: activeFlowchartId,
            source,
            target,
            sourceHandle: 'bottom',
            targetHandle: 'top'
          });
        }
      }
    }
  }, [activeFlowchartId, dbNodes, dbEdges]);
  
  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    const nodeIds = deletedNodes.map(n => n.id);
    await db.flowchartNodes.bulkDelete(nodeIds);
    // Delete connected edges
    if (dbEdges) {
      const edgesToDelete = dbEdges.filter(e => nodeIds.includes(e.source) || nodeIds.includes(e.target)).map(e => e.id);
      await db.flowchartEdges.bulkDelete(edgesToDelete);
    }
  }, [dbEdges]);

  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    await db.flowchartEdges.bulkDelete(deletedEdges.map(e => e.id));
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <FlowchartSidebar onDoubleClickShape={handleDoubleClickShape} />
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Flowchart() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)' }}>
      <div style={{ padding: '24px 40px', backgroundColor: 'var(--n0)', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Flowchart</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Drag and drop shapes to create workflows.</p>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlowProvider>
          <FlowchartCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
