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
import { MoreHorizontal, Trash2, Edit2, AlignCenter } from 'lucide-react';

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

function FlowchartCanvas({ flowchartId }: { flowchartId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, fitView } = useReactFlow();

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
      targetX = bottomMost.position.x;
      targetY = bottomMost.position.y + 160;
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
      const SNAP_DIST = 160;
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

  // Auto-layout: arrange nodes top-to-bottom in a single column, evenly spaced
  const handleAutoLayout = useCallback(async () => {
    if (!dbNodes || dbNodes.length === 0) return;
    const GAP_Y = 160;
    const centerX = 300;
    const updates = dbNodes.map((n, i) => ({ id: n.id, position: { x: centerX, y: 80 + i * GAP_Y } }));
    for (const u of updates) {
      await db.flowchartNodes.update(u.id, { position: u.position });
    }
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 100);
  }, [dbNodes, fitView]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <FlowchartSidebar onDoubleClickShape={handleDoubleClickShape} />
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        {/* Auto-layout button */}
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
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 0.45 }}
          fitView
          fitViewOptions={{ maxZoom: 0.55, padding: 0.3 }}
          deleteKeyCode={['Backspace', 'Delete']}
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
            <div className="breadcrumb">Projects / Task Manager</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--prio-medium)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>TM</div>
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
