import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

import FlowchartNode from '../components/FlowchartNode';
import FlowchartSidebar from '../components/FlowchartSidebar';
import CreateFlowchartModal from '../components/CreateFlowchartModal';
import { MoreHorizontal, Trash2, Edit2, AlignCenter, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = { custom: FlowchartNode };

// Determine which handles to use based on relative position
function getSmartHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Mostly horizontal
    return dx > 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' };
  } else {
    // Mostly vertical
    return dy > 0
      ? { sourceHandle: 'bottom', targetHandle: 'top' }
      : { sourceHandle: 'top', targetHandle: 'bottom' };
  }
}

// Approximate rendered height per shape (matches FlowchartNode.tsx container sizes)
// Diamond: 100 * sqrt(2) ≈ 142px.  Others: minHeight 52 or 72.
function getNodeHeight(shape: string): number {
  switch (shape) {
    case 'diamond': return 142;
    case 'cylinder': return 72;
    default: return 52; // rectangle, oval
  }
}

// Vertical gap between bottom of one node and top of the next
const NODE_MARGIN = 24;

function FlowchartCanvas({ flowchartId }: { flowchartId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleDownloadImage = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    toPng(reactFlowWrapper.current, { backgroundColor: 'var(--bg-board)' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `flowchart-${flowchartId}.png`;
        link.href = dataUrl;
        link.click();
      });
  }, [flowchartId]);

  useEffect(() => {
    const handler = () => handleDownloadImage();
    window.addEventListener('export-flowchart-png', handler);
    return () => window.removeEventListener('export-flowchart-png', handler);
  }, [handleDownloadImage]);

  // Edge context menu state
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);

  const dbNodes = useLiveQuery(
    () => db.flowchartNodes.where('flowchartId').equals(flowchartId).toArray(),
    [flowchartId]
  );
  const dbEdges = useLiveQuery(
    () => db.flowchartEdges.where('flowchartId').equals(flowchartId).toArray(),
    [flowchartId]
  );

  // Sync DB → ReactFlow
  useEffect(() => {
    if (dbNodes) {
      setNodes(dbNodes.map(n => ({
        id: n.id,
        type: 'custom',
        position: n.position,
        data: { label: n.label, shape: n.shape },
      })));
    }
  }, [dbNodes, setNodes]);

  useEffect(() => {
    if (dbEdges) {
      setEdges(dbEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
        type: 'straight',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        markerStart: (e as any).markerStart === 'arrow' ? { type: MarkerType.ArrowClosed, width: 14, height: 14 } : undefined,
        style: { stroke: 'var(--n500)', strokeWidth: 1.5 },
        label: e.label,
      })));
    }
  }, [dbEdges, setEdges]);

  const onConnect = useCallback(async (params: Connection | Edge) => {
    const newEdgeId = `e-${params.source}-${params.target}-${Date.now()}`;
    await db.flowchartEdges.add({
      id: newEdgeId,
      flowchartId,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
    });
  }, [flowchartId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowWrapper.current) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const shape = event.dataTransfer.getData('application/reactflow/shape');
    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNodeId = crypto.randomUUID();

    await db.flowchartNodes.add({
      id: newNodeId, flowchartId,
      label: '', shape: shape as any, position
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 50);
  }, [screenToFlowPosition, flowchartId]);

  // Double-click palette: auto-place below bottommost and connect
  const handleDoubleClickShape = useCallback(async (shape: string) => {
    let targetY = 100, targetX = 200, sourceNodeId: string | null = null;

    if (dbNodes && dbNodes.length > 0) {
      const bottomMost = dbNodes.reduce((p, c) => p.position.y > c.position.y ? p : c);
      const srcHeight = getNodeHeight(bottomMost.shape as string);
      targetX = bottomMost.position.x;
      targetY = bottomMost.position.y + srcHeight + NODE_MARGIN;
      sourceNodeId = bottomMost.id;
    }

    const newNodeId = crypto.randomUUID();
    await db.flowchartNodes.add({ id: newNodeId, flowchartId, label: '', shape: shape as any, position: { x: targetX, y: targetY } });

    if (sourceNodeId && dbNodes) {
      const src = dbNodes.find(n => n.id === sourceNodeId)!;
      const handles = getSmartHandles(src.position, { x: targetX, y: targetY });
      await db.flowchartEdges.add({
        id: `e-${sourceNodeId}-${newNodeId}-${Date.now()}`,
        flowchartId,
        source: sourceNodeId,
        target: newNodeId,
        ...handles,
      });
    }

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 50);
  }, [flowchartId, dbNodes]);

  // On drag stop: persist position + smart auto-connect if close to another node
  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    await db.flowchartNodes.update(node.id, { position: node.position });

    if (dbNodes) {
      const SNAP_DIST = 100;
      let closest: typeof dbNodes[0] | null = null;
      let minDist = Infinity;

      for (const n of dbNodes) {
        if (n.id === node.id) continue;
        const dx = node.position.x - n.position.x;
        const dy = node.position.y - n.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist < SNAP_DIST) { minDist = dist; closest = n; }
      }

      if (closest) {
        const alreadyConnected = dbEdges?.some(e =>
          (e.source === node.id && e.target === closest!.id) ||
          (e.source === closest!.id && e.target === node.id)
        );

        if (!alreadyConnected) {
          // Determine source/target based on which is "earlier" (top/left)
          const nodeIsAfter =
            node.position.y > closest.position.y ||
            (Math.abs(node.position.y - closest.position.y) < 40 && node.position.x > closest.position.x);

          const source = nodeIsAfter ? closest.id : node.id;
          const target = nodeIsAfter ? node.id : closest.id;
          const srcPos = nodeIsAfter ? closest.position : node.position;
          const tgtPos = nodeIsAfter ? node.position : closest.position;
          const handles = getSmartHandles(srcPos, tgtPos);

          await db.flowchartEdges.add({
            id: `e-${source}-${target}-${Date.now()}`,
            flowchartId,
            source, target, ...handles,
          });
        }
      }
    }
  }, [flowchartId, dbNodes, dbEdges]);

  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    const ids = deletedNodes.map(n => n.id);
    await db.flowchartNodes.bulkDelete(ids);
    if (dbEdges) {
      const edgeIds = dbEdges.filter(e => ids.includes(e.source) || ids.includes(e.target)).map(e => e.id);
      await db.flowchartEdges.bulkDelete(edgeIds);
    }
  }, [dbEdges]);

  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    await db.flowchartEdges.bulkDelete(deletedEdges.map(e => e.id));
  }, []);

  // Edge right-click context menu
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  const handleReverseEdge = useCallback(async () => {
    if (!edgeMenu) return;
    const dbEdge = dbEdges?.find(e => e.id === edgeMenu.edgeId);
    if (!dbEdge) return;
    await db.flowchartEdges.update(edgeMenu.edgeId, {
      source: dbEdge.target,
      target: dbEdge.source,
      sourceHandle: dbEdge.targetHandle,
      targetHandle: dbEdge.sourceHandle,
    });
    setEdgeMenu(null);
  }, [edgeMenu, dbEdges]);

  const handleDoubleArrow = useCallback(async () => {
    if (!edgeMenu) return;
    const dbEdge = dbEdges?.find(e => e.id === edgeMenu.edgeId);
    if (!dbEdge) return;
    // Toggle: if already has markerStart (double arrow), remove it; otherwise add it
    const hasDouble = (dbEdge as any).markerStart !== undefined;
    if (hasDouble) {
      await db.flowchartEdges.update(edgeMenu.edgeId, { markerStart: undefined } as any);
    } else {
      await db.flowchartEdges.update(edgeMenu.edgeId, { markerStart: 'arrow' } as any);
    }
    setEdgeMenu(null);
  }, [edgeMenu, dbEdges]);

  const handleDeleteEdge = useCallback(async () => {
    if (!edgeMenu) return;
    await db.flowchartEdges.delete(edgeMenu.edgeId);
    setEdgeMenu(null);
  }, [edgeMenu]);

  // Auto-layout: for each connected chain, straighten nodes and equalize spacing.
  // Disconnected (isolated) nodes are NOT moved.
  const handleAutoLayout = useCallback(async () => {
    if (!dbNodes || !dbEdges || dbNodes.length === 0) return;

    // Build adjacency sets (undirected, for component detection)
    const neighbors = new Map<string, Set<string>>();
    for (const n of dbNodes) neighbors.set(n.id, new Set());
    for (const e of dbEdges) {
      neighbors.get(e.source)?.add(e.target);
      neighbors.get(e.target)?.add(e.source);
    }

    // BFS to find connected components
    const visited = new Set<string>();
    const components: string[][] = [];
    for (const n of dbNodes) {
      if (visited.has(n.id)) continue;
      const component: string[] = [];
      const queue = [n.id];
      while (queue.length) {
        const cur = queue.shift()!;
        if (visited.has(cur)) continue;
        visited.add(cur);
        component.push(cur);
        for (const nb of neighbors.get(cur) ?? []) {
          if (!visited.has(nb)) queue.push(nb);
        }
      }
      components.push(component);
    }

    // For each component with 2+ nodes: topological BFS layout
    // Gap = height of previous node + fixed margin between visual edges
    const updates: { id: string; position: { x: number; y: number } }[] = [];

    for (const component of components) {
      if (component.length < 2) continue; // leave isolated nodes untouched

      // Build directed edges within component
      const compSet = new Set(component);
      const inDegree = new Map<string, number>();
      const children = new Map<string, string[]>();
      for (const id of component) { inDegree.set(id, 0); children.set(id, []); }

      for (const e of dbEdges) {
        if (!compSet.has(e.source) || !compSet.has(e.target)) continue;
        inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
        children.get(e.source)?.push(e.target);
      }

      // Find root(s): nodes with no incoming edges in this component
      const roots = component.filter(id => (inDegree.get(id) ?? 0) === 0);
      // If it's a cycle (no roots), pick the first node as root
      const startNodes = roots.length > 0 ? roots : [component[0]];

      // Anchor: use the root's current X, but normalize it to a clean center.
      // We keep the root's Y so the chain doesn't jump vertically.
      const anchorNode = dbNodes.find(n => n.id === startNodes[0]);
      const anchorX = anchorNode?.position.x ?? 200;
      const anchorY = anchorNode?.position.y ?? 100;

      const levelVisited = new Set<string>();
      const posMap = new Map<string, { x: number; y: number }>();
      // queue items: the node to place, its branchX, and the Y-bottom of its parent
      const levelQueue: { id: string; branchX: number; parentBottom: number }[] = [];

      // Seed root nodes — place them at anchorY and compute their own bottoms
      for (let ri = 0; ri < startNodes.length; ri++) {
        const rootId = startNodes[ri];
        const rootBranchX = anchorX + ri * 200;
        const rootH = getNodeHeight((dbNodes.find(n => n.id === rootId)?.shape as string) ?? 'rectangle');
        posMap.set(rootId, { x: rootBranchX, y: anchorY });
        levelVisited.add(rootId);
        const rootBottom = anchorY + rootH;
        // Enqueue root's children
        const kids = (children.get(rootId) ?? []).filter(k => !levelVisited.has(k));
        kids.forEach((kid, i) => {
          levelVisited.add(kid);
          const kidX = kids.length > 1 ? rootBranchX + (i - (kids.length - 1) / 2) * 200 : rootBranchX;
          levelQueue.push({ id: kid, branchX: kidX, parentBottom: rootBottom });
        });
      }

      while (levelQueue.length) {
        const { id, branchX, parentBottom } = levelQueue.shift()!;
        const thisH = getNodeHeight((dbNodes.find(n => n.id === id)?.shape as string) ?? 'rectangle');
        const y = parentBottom + NODE_MARGIN;
        posMap.set(id, { x: branchX, y });
        const myBottom = y + thisH;

        const kids = (children.get(id) ?? []).filter(k => !levelVisited.has(k));
        kids.forEach((kid, i) => {
          levelVisited.add(kid);
          const kidX = kids.length > 1 ? branchX + (i - (kids.length - 1) / 2) * 200 : branchX;
          levelQueue.push({ id: kid, branchX: kidX, parentBottom: myBottom });
        });
      }

      // Queue updates for nodes in this component
      for (const [id, pos] of posMap) {
        updates.push({ id, position: pos });
      }
    }

    for (const u of updates) {
      await db.flowchartNodes.update(u.id, { position: u.position });
    }
    setTimeout(() => fitView({ duration: 400, padding: 0.25 }), 100);
  }, [dbNodes, dbEdges, fitView]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <FlowchartSidebar onDoubleClickShape={handleDoubleClickShape} />
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <button
          onClick={handleAutoLayout}
          title="Auto-align nodes vertically"
          style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', fontSize: '13px', fontWeight: 500,
            backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--n700)',
            boxShadow: 'var(--shadow-card)',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--n0)')}
        >
          <AlignCenter size={14} />
          Auto-layout
        </button>

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
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={() => setEdgeMenu(null)}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 0.45 }}
          fitView
          fitViewOptions={{ maxZoom: 0.55, padding: 0.3 }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Shift']}
          selectionOnDrag
          panOnDrag={[1, 2]}
          defaultEdgeOptions={{
            type: 'straight',
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: 'var(--n500)', strokeWidth: 1.5 },
          }}
          connectionLineType={ConnectionLineType.Straight}
          nodesDraggable
        >
          <Background gap={20} size={1.5} color="var(--n40)" />
          <Controls />
          <MiniMap zoomable pannable nodeColor="var(--b100)" maskColor="rgba(244,245,247,0.7)" />
        </ReactFlow>

        {/* Edge context menu */}
        {edgeMenu && (
          <>
            <div
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
              onClick={() => setEdgeMenu(null)}
              onContextMenu={e => { e.preventDefault(); setEdgeMenu(null); }}
            />
            <div style={{
              position: 'fixed',
              top: edgeMenu.y,
              left: edgeMenu.x,
              zIndex: 1000,
              backgroundColor: 'var(--n0)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-dropdown)',
              minWidth: '170px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Arrow Options</div>
              <button
                onClick={handleReverseEdge}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ↩ Reverse Direction
              </button>
              <button
                onClick={handleDoubleArrow}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ↔ Toggle Double Arrow
              </button>
              <div style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleDeleteEdge}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r400)', fontSize: '14px', textAlign: 'left' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  🗑 Delete Arrow
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Flowchart() {
  const [activeView, setActiveView] = useState<'canvas' | 'list'>('canvas');
  const [activeFlowchartId, setActiveFlowchartId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const flowcharts = useLiveQuery(() => db.flowcharts.orderBy('createdAt').reverse().toArray());

  // Auto-select the most recent flowchart
  useEffect(() => {
    if (flowcharts && flowcharts.length > 0 && !activeFlowchartId) {
      setActiveFlowchartId(flowcharts[0].id);
    } else if (flowcharts && flowcharts.length === 0) {
      // Bootstrap a default flowchart on first launch
      const newId = crypto.randomUUID();
      db.flowcharts.add({ id: newId, title: 'Main Flowchart', createdAt: Date.now(), updatedAt: Date.now() })
        .then(() => setActiveFlowchartId(newId));
    }
  }, [flowcharts, activeFlowchartId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this flowchart?')) return;
    await db.flowchartNodes.where('flowchartId').equals(id).delete();
    await db.flowchartEdges.where('flowchartId').equals(id).delete();
    await db.flowcharts.delete(id);
    if (activeFlowchartId === id) { setActiveFlowchartId(null); setActiveView('list'); }
    setOpenDropdownId(null);
  };

  const activeFlowchart = flowcharts?.find(f => f.id === activeFlowchartId);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)' }}>

      {/* Header */}
      <div style={{ padding: '32px 40px 0 40px', backgroundColor: 'var(--n0)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--prio-medium)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>PS</div>
              <h1 style={{ fontSize: '24px', margin: 0, padding: 0 }}>
                {activeView === 'canvas' && activeFlowchart ? activeFlowchart.title : 'Flowcharts'}
              </h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveView('canvas')}
            className={`planning-tab ${activeView === 'canvas' ? 'active' : ''}`}
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
          >
            Canvas
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`planning-tab ${activeView === 'list' ? 'active' : ''}`}
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
          >
            All Flowcharts
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MoreHorizontal size={20} />
            </button>
            
            {showMenu && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-dropdown)', zIndex: 100, minWidth: '150px', overflow: 'hidden' }}>
                  {activeView === 'canvas' && (
                    <button 
                      onClick={() => { setShowMenu(false); window.dispatchEvent(new CustomEvent('export-flowchart-png')); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Download size={16} color="var(--text-secondary)" /> Export PNG
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '16px 40px 0 40px', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-board)' }}>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary">
          Create Flowchart
        </button>
      </div>

      {/* Content */}
      {activeView === 'list' ? (
        <div style={{ padding: '16px 40px 32px 40px', flex: 1, overflowY: 'auto' }}>
          {!flowcharts || flowcharts.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '64px' }}>
              No flowcharts yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {flowcharts.map(f => (
                <div
                  key={f.id}
                  style={{
                    padding: '24px', backgroundColor: 'var(--n0)',
                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                  }}
                  onClick={() => { setActiveFlowchartId(f.id); setActiveView('canvas'); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      {editingId === f.id ? (
                        <input
                          autoFocus
                          defaultValue={f.title}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={async (e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const t = e.currentTarget.value.trim();
                              if (t && t !== f.title) await db.flowcharts.update(f.id, { title: t });
                              setEditingId(null);
                            } else if (e.key === 'Escape') { setEditingId(null); }
                          }}
                          onBlur={async (e) => {
                            const t = e.target.value.trim();
                            if (t && t !== f.title) await db.flowcharts.update(f.id, { title: t });
                            setEditingId(null);
                          }}
                          style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--n800)', fontFamily: 'inherit', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', width: '100%', outline: 'none', fontWeight: 600 }}
                        />
                      ) : (
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--n800)' }}>{f.title}</h3>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === f.id ? null : f.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      {openDropdownId === f.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={e => { e.stopPropagation(); setOpenDropdownId(null); }} />
                          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-dropdown)', zIndex: 100, minWidth: '150px', overflow: 'hidden' }}>
                            <button onClick={e => { e.stopPropagation(); setEditingId(f.id); setOpenDropdownId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }} onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')} onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <Edit2 size={16} /> Rename
                            </button>
                            <button onClick={e => handleDelete(f.id, e)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r400)', fontSize: '14px', textAlign: 'left' }} onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')} onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Created: {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', marginTop: '16px' }}>
          {activeFlowchartId ? (
            <ReactFlowProvider key={activeFlowchartId}>
              <FlowchartCanvas flowchartId={activeFlowchartId} />
            </ReactFlowProvider>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Select or create a flowchart to begin.
            </div>
          )}
        </div>
      )}

      {isCreating && (
        <CreateFlowchartModal
          onClose={() => setIsCreating(false)}
          onSuccess={(newId) => { setActiveFlowchartId(newId); setActiveView('canvas'); }}
        />
      )}
    </div>
  );
}
