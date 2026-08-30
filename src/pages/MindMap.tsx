import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import MindMapNode from '../components/MindMapNode';
import CreateMindMapModal from '../components/CreateMindMapModal';
import { MoreHorizontal, Keyboard, X, Trash2, Edit2 } from 'lucide-react';

const nodeTypes = {
  custom: MindMapNode,
};

function MindMapContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { project, setViewport, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusNodeId = searchParams.get('node');

  const [activeView, setActiveView] = useState<'canvas' | 'list'>('canvas');
  const [isCreatingMindMap, setIsCreatingMindMap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);

  const mindMaps = useLiveQuery(() => db.mindMaps.orderBy('createdAt').reverse().toArray());
  const [activeMindMapId, setActiveMindMapId] = useState<string | null>(null);

  const mapParam = searchParams.get('map');

  useEffect(() => {
    if (mapParam && mindMaps?.some(m => m.id === mapParam)) {
      setActiveMindMapId(mapParam);
    } else if (mindMaps && mindMaps.length > 0 && !activeMindMapId) {
      setActiveMindMapId(mindMaps[0].id);
    }
  }, [mindMaps, activeMindMapId, mapParam]);

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
    // Initialize root node if empty
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
      setNodes(nds => {
        const selectedIds = new Set(nds.filter(n => n.selected).map(n => n.id));
        return dbNodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: n.position,
          data: { label: n.label, taskId: n.taskId },
          selected: selectedIds.has(n.id)
        }));
      });
      setEdges(dbEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default', // Bezier curve
        animated: false,
        style: { stroke: 'var(--n800)', strokeWidth: 1 }
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
          fitView({ nodes: [{ id: focusNodeId }], duration: 800, maxZoom: 1 });
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

  const handleNodeUpdated = useCallback(() => {
    // Just a trigger to re-fetch or re-render if needed, useLiveQuery handles most of it
  }, []);

  useEffect(() => {
    window.addEventListener('node-updated', handleNodeUpdated);
    return () => window.removeEventListener('node-updated', handleNodeUpdated);
  }, [handleNodeUpdated]);

  const handleDeleteMindMap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this mind map?')) return;
    
    await db.mindMapNodes.where('mindMapId').equals(id).delete();
    await db.mindMapEdges.where('mindMapId').equals(id).delete();
    await db.mindMaps.delete(id);
    
    if (activeMindMapId === id) {
      setActiveMindMapId(null);
      setActiveView('list');
    }
    setOpenDropdownId(null);
  };

  // --- Keyboard Shortcuts (FreeMind style) ---
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedNode = selectedNodes[0];

    // Don't trigger shortcuts if user is typing in an input (e.g. editing node)
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    if (e.key === 'Insert') {
      e.preventDefault();
      // Add Child
      const newId = crypto.randomUUID();
      const children = edges.filter(ed => ed.source === selectedNode.id);
      const newPos = {
        x: selectedNode.position.x + 250,
        y: selectedNode.position.y + (children.length * 80)
      };

      await db.mindMapNodes.add({
        id: newId,
        mindMapId: activeMindMapId!,
        label: '',
        position: newPos
      });
      await db.mindMapEdges.add({
        id: `e-${selectedNode.id}-${newId}`,
        mindMapId: activeMindMapId!,
        source: selectedNode.id,
        target: newId
      });

      setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat({
        id: newId,
        type: 'custom',
        position: newPos,
        data: { label: '', isNew: true },
        selected: true
      }));

      // Select new node and edit
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: newId } }));
      }, 50);

    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNode.id.startsWith('root')) return; // Cannot add sibling to root usually

      // Add Sibling
      // Find parent of selected node
      const parentEdge = edges.find(ed => ed.target === selectedNode.id);
      if (!parentEdge) return;

      const newId = crypto.randomUUID();
      const newPos = {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 80
      };

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

      setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat({
        id: newId,
        type: 'custom',
        position: newPos,
        data: { label: '', isNew: true },
        selected: true
      }));

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: newId } }));
      }, 50);

    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selectedNode.id.startsWith('root')) return; // Cannot delete root
      
      // Delete node and all its incoming/outgoing edges (Dexie will just delete the node, we must clean edges)
      await db.mindMapNodes.delete(selectedNode.id);
      const edgesToDelete = edges.filter(ed => ed.source === selectedNode.id || ed.target === selectedNode.id).map(e => e.id);
      await db.mindMapEdges.bulkDelete(edgesToDelete);

    } else if (e.key === 'F2') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('start-node-edit', { detail: { id: selectedNode.id } }));
    }
  }, [nodes, edges, activeMindMapId]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    return () => document.removeEventListener('keydown', handleKeyDown as any);
  }, [handleKeyDown]);

  const activeMindMap = mindMaps?.find(m => m.id === activeMindMapId);

  if (!mindMaps) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)' }} tabIndex={0} ref={reactFlowWrapper}>
      
      {/* Header matching PlanningLayout */}
      <div style={{ padding: '32px 40px 0 40px', backgroundColor: 'var(--n0)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="breadcrumb">Projects / Task Manager</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--prio-medium)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>TM</div>
              <h1 style={{ fontSize: '24px', margin: 0, padding: 0 }}>Software project</h1>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
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
            All Maps
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
                  <button 
                    onClick={() => { setShowMenu(false); setShowControls(true); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Keyboard size={16} color="var(--text-secondary)" /> Controls
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shared Action Bar */}
      <div style={{ padding: '16px 40px 0 40px', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-board)' }}>
        <button onClick={() => setIsCreatingMindMap(true)} className="btn btn-primary">
          Create Mind Map
        </button>
      </div>

      {activeView === 'list' ? (
        <div style={{ padding: '16px 40px 32px 40px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {mindMaps.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  padding: '24px', 
                  backgroundColor: 'var(--n0)', 
                  border: '1px solid var(--border-color)', 
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
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--n800)' }}>{m.title}</h3>
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
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--n30)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 size={16} /> Rename
                          </button>
                          <button 
                            onClick={(e) => handleDeleteMindMap(m.id, e)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r400)', fontSize: '14px', textAlign: 'left' }}
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
        <div style={{ flex: 1, backgroundColor: 'var(--bg-board)', position: 'relative', marginTop: '16px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            deleteKeyCode={null}
            fitView
            fitViewOptions={{ maxZoom: 0.8, padding: 0.2 }}
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
                <span style={{ color: 'var(--text-secondary)' }}>Add Child Node</span>
                <kbd style={{ background: 'var(--n40)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Insert</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Add Sibling Node</span>
                <kbd style={{ background: 'var(--n40)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Enter</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Edit Selected Node</span>
                <kbd style={{ background: 'var(--n40)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>F2</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Remove Node</span>
                <kbd style={{ background: 'var(--n40)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Delete</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Open/Create Task</span>
                <kbd style={{ background: 'var(--n40)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Double-Click</kbd>
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
