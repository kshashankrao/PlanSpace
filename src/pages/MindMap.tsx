import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import { useSearchParams } from 'react-router-dom';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import MindMapNode from '../components/MindMapNode';
import CreateMindMapModal from '../components/CreateMindMapModal';
import SendDiagramModal from '../components/SendDiagramModal';
import { MoreHorizontal, Keyboard, X, Trash2, Edit2, Download, Network, Share2, Plus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getLayoutedElements } from '../utils/layout';

const nodeTypes = {
  custom: MindMapNode,
};

function MindMapContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const pendingSelectNodeIdRef = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusNodeId = searchParams.get('node');

  const mindMaps = useLiveQuery(() => db.mindMaps.orderBy('createdAt').reverse().toArray());
  const [activeMindMapId, setActiveMindMapId] = useState<string | null>(null);

  const handleDownloadImage = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    toPng(reactFlowWrapper.current, { backgroundColor: 'var(--bg-board)' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `mindmap-${activeMindMapId}.png`;
        link.href = dataUrl;
        link.click();
      });
  }, [activeMindMapId]);

  const [activeView, setActiveView] = useState<'canvas' | 'list'>('canvas');
  const [isCreatingMindMap, setIsCreatingMindMap] = useState(false);
  const [isSendingDiagram, setIsSendingDiagram] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);

  const mapParam = searchParams.get('map');

  useEffect(() => {
    if (mapParam && mindMaps?.some(m => m.id === mapParam)) {
      setActiveMindMapId(mapParam);
      setActiveView('canvas');
      setSearchParams({}, { replace: true });
    } else if (mindMaps && mindMaps.length > 0 && !activeMindMapId) {
      setActiveMindMapId(mindMaps[0].id);
    }
  }, [mindMaps, activeMindMapId, mapParam, setSearchParams]);

  // If focusNodeId is in URL, make sure we switch to the MindMap that owns it
  useEffect(() => {
    if (focusNodeId) {
      db.mindMapNodes.get(focusNodeId).then(n => {
        if (n?.mindMapId && n.mindMapId !== activeMindMapId) {
          setActiveMindMapId(n.mindMapId);
        }
      });
    }
  }, [focusNodeId, activeMindMapId]);

  // Sync DB to State
  const dbNodes = useLiveQuery(
    () => activeMindMapId ? db.mindMapNodes.where('mindMapId').equals(activeMindMapId).toArray() : [] as any[],
    [activeMindMapId]
  );

  const dbEdges = useLiveQuery(
    () => activeMindMapId ? db.mindMapEdges.where('mindMapId').equals(activeMindMapId).toArray() : [] as any[],
    [activeMindMapId]
  );

  useEffect(() => {
    const initDb = async () => {
      const count = await db.mindMaps.count();
      if (count === 0) {
        const defaultId = crypto.randomUUID();
        await db.mindMaps.add({
          id: defaultId,
          title: 'Mind Map 1',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        await db.mindMapNodes.add({
          id: `root-${defaultId}`,
          mindMapId: defaultId,
          label: 'Mind Map 1',
          position: { x: 250, y: 250 }
        });
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    if (dbNodes && dbEdges) {
      const pendingId = pendingSelectNodeIdRef.current;
      if (pendingId && dbNodes.some(n => n.id === pendingId)) {
        pendingSelectNodeIdRef.current = null;
      }

      setNodes(nds => {
        const selectedIds = pendingId
          ? new Set([pendingId])
          : new Set(nds.filter(n => n.selected).map(n => n.id));

        return dbNodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: n.position,
          data: {
            label: n.label,
            taskId: n.taskId,
            isNew: n.id === pendingId || n.label === '',
          },
          selected: selectedIds.has(n.id)
        }));
      });
      setEdges(dbEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        animated: false,
        style: { stroke: 'var(--n500)', strokeWidth: 1.5 }
      })));
    }
  }, [dbNodes, dbEdges, setNodes, setEdges]);

  // Focus node logic
  useEffect(() => {
    if (focusNodeId && nodes.length > 0) {
      const node = nodes.find(n => n.id === focusNodeId);
      if (node) {
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === focusNodeId })));
        setTimeout(() => {
          fitView({ nodes: [{ id: focusNodeId }], duration: 600, maxZoom: 1 });
        }, 100);
        setSearchParams({});
      }
    }
  }, [focusNodeId, nodes.length, fitView, setSearchParams, setNodes]);

  // Sync Node Dragging back to DB
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        db.mindMapNodes.update(change.id, { position: change.position });
      }
    });
  }, [onNodesChange]);

  const handleConnect = useCallback(async (params: Connection) => {
    if (!activeMindMapId || !params.source || !params.target || params.source === params.target) return;
    const exists = edges.some(e => e.source === params.source && e.target === params.target);
    if (exists) return;
    await db.mindMapEdges.add({
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      mindMapId: activeMindMapId,
      source: params.source,
      target: params.target,
    });
  }, [activeMindMapId, edges]);

  const addChildToNode = useCallback(async (parentId: string) => {
    if (!activeMindMapId) return;
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = crypto.randomUUID();
    const childEdges = edges.filter(ed => ed.source === parentId);
    const childNodes = nodes.filter(n => childEdges.some(ed => ed.target === n.id));
    const maxChildY = childNodes.length > 0
      ? Math.max(...childNodes.map(c => c.position.y)) + 76
      : parentNode.position.y;

    const parentWidth = parentNode.measured?.width ?? Math.max(150, String(parentNode.data?.label || '').length * 8 + 64);
    const newPos = {
      x: Math.round(parentNode.position.x + parentWidth + 90),
      y: Math.round(maxChildY)
    };

    pendingSelectNodeIdRef.current = newId;

    await db.mindMapNodes.add({
      id: newId,
      mindMapId: activeMindMapId,
      label: '',
      position: newPos
    });
    await db.mindMapEdges.add({
      id: `e-${parentId}-${newId}`,
      mindMapId: activeMindMapId,
      source: parentId,
      target: newId
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: newId } }));
    }, 50);
  }, [activeMindMapId, nodes, edges]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.parentId) {
        addChildToNode(e.detail.parentId);
      }
    };
    window.addEventListener('mindmap-add-child', handler);
    return () => window.removeEventListener('mindmap-add-child', handler);
  }, [addChildToNode]);

  const handleDeleteMindMap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this mind map?')) return;

    const nodeIds = (await db.mindMapNodes.where('mindMapId').equals(id).toArray()).map(n => n.id);
    await db.mindMapNodes.where('mindMapId').equals(id).delete();
    await db.mindMapEdges.where('mindMapId').equals(id).delete();
    await db.mindMaps.delete(id);

    const linkedTasks = await db.tasks.filter(t => t.mindMapId === id || (!!t.mindmapNodeId && nodeIds.includes(t.mindmapNodeId))).toArray();
    for (const t of linkedTasks) {
      await db.tasks.update(t.id, {
        mindMapId: t.mindMapId === id ? undefined : t.mindMapId,
        mindmapNodeId: t.mindmapNodeId && nodeIds.includes(t.mindmapNodeId) ? undefined : t.mindmapNodeId,
      });
    }

    if (activeMindMapId === id) {
      setActiveMindMapId(null);
      setActiveView('list');
    }
    setOpenDropdownId(null);
  };

  const handleAutoLayout = useCallback(async () => {
    if (nodes.length === 0 || !activeMindMapId) return;
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'LR');

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    for (const node of layoutedNodes) {
      await db.mindMapNodes.update(node.id, { position: node.position });
    }

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 500, maxZoom: 0.95 });
    }, 50);
  }, [nodes, edges, activeMindMapId, setNodes, setEdges, fitView]);

  // --- Keyboard Shortcuts (Tab / Insert = Child, Enter = Sibling, F2 = Edit, Delete = Remove) ---
  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    const activeTag = (e.target as HTMLElement)?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedNode = selectedNodes[0];

    if (e.key === 'Tab' || e.key === 'Insert') {
      e.preventDefault();
      await addChildToNode(selectedNode.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNode.id.startsWith('root') || selectedNode.id === 'node-root') {
        await addChildToNode(selectedNode.id);
        return;
      }

      const parentEdge = edges.find(ed => ed.target === selectedNode.id);
      if (!parentEdge) {
        await addChildToNode(selectedNode.id);
        return;
      }

      const newId = crypto.randomUUID();
      const newPos = {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 76
      };

      pendingSelectNodeIdRef.current = newId;

      await db.mindMapNodes.add({
        id: newId,
        mindMapId: activeMindMapId!,
        label: '',
        position: newPos
      });
      await db.mindMapEdges.add({
        id: `e-${parentEdge.source}-${newId}`,
        mindMapId: activeMindMapId!,
        source: parentEdge.source,
        target: newId
      });

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: newId } }));
      }, 50);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selectedNode.id.startsWith('root') || selectedNode.id === 'node-root') return;

      // Recursively collect selected node and all its descendants so no orphans remain
      const toDelete = new Set<string>([selectedNode.id]);
      const queue = [selectedNode.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        edges.filter(ed => ed.source === current).forEach(ed => {
          if (!toDelete.has(ed.target)) {
            toDelete.add(ed.target);
            queue.push(ed.target);
          }
        });
      }

      const nodeIdsToDelete = Array.from(toDelete);
      const edgesToDelete = edges
        .filter(ed => toDelete.has(ed.source) || toDelete.has(ed.target))
        .map(ed => ed.id);

      await db.mindMapNodes.bulkDelete(nodeIdsToDelete);
      await db.mindMapEdges.bulkDelete(edgesToDelete);
    } else if (e.key === 'F2') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: selectedNode.id } }));
    }
  }, [nodes, edges, activeMindMapId, addChildToNode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleQuickAddToolbar = () => {
    const selected = nodes.find(n => n.selected);
    const root = nodes.find(n => n.id.startsWith('root') || n.id === 'node-root') || nodes[0];
    const targetParent = selected || root;
    if (targetParent) {
      addChildToNode(targetParent.id);
    }
  };

  const activeMindMap = mindMaps?.find(m => m.id === activeMindMapId);

  if (!mindMaps) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)' }} tabIndex={0} ref={reactFlowWrapper}>

      {/* Unified Single-Row Header */}
      <div
        style={{
          padding: '0 28px',
          height: '54px',
          backgroundColor: 'var(--n0)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
          {activeView === 'canvas' && activeMindMap ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={activeMindMap.id}
                onChange={(e) => {
                  setActiveMindMapId(e.target.value);
                  setActiveView('canvas');
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--n800)',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                }}
                title="Switch Mind Map"
              >
                {mindMaps.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          ) : (
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, padding: 0, color: 'var(--n800)' }}>
              Mind Maps
            </h1>
          )}

          <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)' }} />

          <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'center' }}>
            <button
              onClick={() => setActiveView('canvas')}
              className={`planning-tab ${activeView === 'canvas' ? 'active' : ''}`}
              style={{
                padding: '16px 4px',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: 'inherit',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              Canvas
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`planning-tab ${activeView === 'list' ? 'active' : ''}`}
              style={{
                padding: '16px 4px',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: 'inherit',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              All Maps ({mindMaps.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {activeView === 'canvas' && activeMindMap && (
            <>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', marginRight: '6px', whiteSpace: 'nowrap' }}>
                <span><kbd style={{ background: 'var(--n20)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--n40)' }}>Tab</kbd> Child</span>
                <span><kbd style={{ background: 'var(--n20)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--n40)' }}>Enter</kbd> Sibling</span>
              </div>
              <button
                onClick={handleQuickAddToolbar}
                className="btn btn-secondary"
                title="Add child idea to selected node (Tab)"
              >
                <Plus size={15} /> Add Idea
              </button>
              <button
                onClick={handleAutoLayout}
                className="btn btn-secondary"
                title="Organize mind map tree cleanly"
              >
                <Network size={15} /> Auto Layout
              </button>
              <button
                onClick={() => setIsSendingDiagram(true)}
                className="btn btn-secondary"
                style={{ color: 'var(--b400)', backgroundColor: 'var(--b50)' }}
                title="Embed this Mind Map into a Doc or attach to a Task"
              >
                <Share2 size={15} /> Add to Doc / Task
              </button>
              <button
                onClick={handleDownloadImage}
                className="btn btn-ghost"
                style={{ padding: '0 8px' }}
                title="Export Mind Map as PNG"
              >
                <Download size={16} />
              </button>
            </>
          )}
          <button onClick={() => setIsCreatingMindMap(true)} className="btn btn-primary">
            <Plus size={15} /> New Map
          </button>
        </div>
      </div>

      {activeView === 'list' ? (
        <div style={{ padding: '24px 40px 32px 40px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {mindMaps.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--n0)',
                  border: activeMindMapId === m.id ? '2px solid var(--b400)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setActiveMindMapId(m.id);
                  setActiveView('canvas');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    {editingMapId === m.id ? (
                      <input
                        autoFocus
                        defaultValue={m.title}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={async (e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            const newTitle = e.currentTarget.value.trim();
                            if (newTitle && newTitle !== m.title) {
                              await db.mindMaps.update(m.id, { title: newTitle });
                            }
                            setEditingMapId(null);
                          } else if (e.key === 'Escape') {
                            setEditingMapId(null);
                          }
                        }}
                        onBlur={async (e) => {
                          const newTitle = e.target.value.trim();
                          if (newTitle && newTitle !== m.title) {
                            await db.mindMaps.update(m.id, { title: newTitle });
                          }
                          setEditingMapId(null);
                        }}
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          color: 'var(--n800)',
                          fontFamily: 'inherit',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          width: '100%',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      />
                    ) : (
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--n800)', textTransform: 'none' }}>{m.title}</h3>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === m.id ? null : m.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n400)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {openDropdownId === m.id && (
                      <>
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: 'var(--n0)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-dropdown)', zIndex: 100, minWidth: '150px', overflow: 'hidden' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMapId(m.id);
                              setOpenDropdownId(null);
                            }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 size={16} /> Rename
                          </button>
                          <button
                            onClick={(e) => handleDeleteMindMap(m.id, e)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r500)', fontSize: '14px', textAlign: 'left' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created: {new Date(m.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{ flex: 1, backgroundColor: 'var(--bg-board)', position: 'relative' }}
          onDoubleClick={async (event) => {
            const target = event.target as HTMLElement;
            if (!target.classList.contains('react-flow__pane') || !activeMindMapId) return;
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const selected = nodes.find(n => n.selected);
            const root = nodes.find(n => n.id.startsWith('root') || n.id === 'node-root') || nodes[0];
            const parentNode = selected || root;
            const newNodeId = `node-${crypto.randomUUID()}`;
            pendingSelectNodeIdRef.current = newNodeId;

            await db.transaction('rw', [db.mindMapNodes, db.mindMapEdges], async () => {
              await db.mindMapNodes.add({
                id: newNodeId,
                mindMapId: activeMindMapId,
                label: '',
                position,
              });
              if (parentNode) {
                await db.mindMapEdges.add({
                  id: `e-${parentNode.id}-${newNodeId}`,
                  mindMapId: activeMindMapId,
                  source: parentNode.id,
                  target: newNodeId,
                });
              }
            });

            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: newNodeId } }));
            }, 40);
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            deleteKeyCode={null}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ maxZoom: 0.85, padding: 0.25 }}
            minZoom={0.2}
          >
            <Controls />
            <MiniMap zoomable pannable nodeColor="var(--b100)" maskColor="rgba(244, 245, 247, 0.7)" />
            <Background gap={24} size={2} color="var(--n40)" />
          </ReactFlow>
        </div>
      )}

      {isCreatingMindMap && (
        <CreateMindMapModal
          onClose={() => setIsCreatingMindMap(false)}
          onSuccess={(newId) => {
            setActiveMindMapId(newId);
            setActiveView('canvas');
          }}
        />
      )}

      {isSendingDiagram && activeMindMap && (
        <SendDiagramModal
          diagramId={activeMindMap.id}
          diagramType="mindmap"
          diagramTitle={activeMindMap.title}
          onClose={() => setIsSendingDiagram(false)}
        />
      )}

      {showControls && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowControls(false)}>
          <div style={{ backgroundColor: 'var(--n0)', padding: '24px', borderRadius: 'var(--radius)', width: '400px', maxWidth: '90%', boxShadow: 'var(--shadow-modal)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--n800)' }}>
                <Keyboard size={20} color="var(--text-secondary)" /> Keyboard Controls
              </h2>
              <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => setShowControls(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--n800)', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Add Child Idea</span>
                <kbd style={{ background: 'var(--n30)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Tab / Insert</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Add Sibling Idea</span>
                <kbd style={{ background: 'var(--n30)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Enter</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Edit Selected Node</span>
                <kbd style={{ background: 'var(--n30)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Double-Click / F2</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delete Node & Subtree</span>
                <kbd style={{ background: 'var(--n30)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Delete / Backspace</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MindMap() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  );
}
