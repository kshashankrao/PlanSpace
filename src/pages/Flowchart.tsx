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
import { useSearchParams } from 'react-router-dom';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

import FlowchartNode from '../components/FlowchartNode';
import FlowchartSidebar from '../components/FlowchartSidebar';
import CreateFlowchartModal from '../components/CreateFlowchartModal';
import SendDiagramModal from '../components/SendDiagramModal';
import { getSmartHandles } from '../utils/layout';
import { MoreHorizontal, Trash2, Edit2, AlignCenter, ArrowRightLeft, Download, Share2, Plus } from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = { custom: FlowchartNode };

function getNodeHeight(shape: string): number {
  switch (shape) {
    case 'diamond': return 148;
    case 'cylinder': return 72;
    default: return 54;
  }
}

const NODE_MARGIN_Y = 36;
const NODE_MARGIN_X = 210;

function FlowchartCanvas({ flowchartId }: { flowchartId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const pendingSelectNodeIdRef = useRef<string | null>(null);
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

  // Edge context menu & label editing state
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [editingEdge, setEditingEdge] = useState<{ edgeId: string; label: string } | null>(null);

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
            shape: n.shape,
            taskId: n.taskId,
            isNew: n.id === pendingId || n.label === '',
          },
          selected: selectedIds.has(n.id),
        }));
      });
    }
  }, [dbNodes, setNodes]);

  useEffect(() => {
    if (dbEdges && dbNodes) {
      const nodeMap = new Map(dbNodes.map(n => [n.id, n]));
      setEdges(dbEdges.map(e => {
        const srcNode = nodeMap.get(e.source);
        const tgtNode = nodeMap.get(e.target);
        const computedHandles = srcNode && tgtNode
          ? getSmartHandles(srcNode.position, tgtNode.position)
          : { sourceHandle: 'bottom', targetHandle: 'top' };

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? computedHandles.sourceHandle,
          targetHandle: e.targetHandle ?? computedHandles.targetHandle,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          markerStart: (e as any).markerStart === 'arrow' ? { type: MarkerType.ArrowClosed, width: 14, height: 14 } : undefined,
          style: { stroke: 'var(--n600)', strokeWidth: 1.5 },
          label: e.label,
          labelStyle: { fill: 'var(--n800)', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: 'var(--n0)', fillOpacity: 0.9 },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
        };
      }));
    }
  }, [dbEdges, dbNodes, setEdges]);

  const onConnect = useCallback(async (params: Connection | Edge) => {
    if (!params.source || !params.target || params.source === params.target) return;
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
    pendingSelectNodeIdRef.current = newNodeId;

    await db.flowchartNodes.add({
      id: newNodeId,
      flowchartId,
      label: '',
      shape: shape as any,
      position,
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 50);
  }, [screenToFlowPosition, flowchartId]);

  // Add connected shape after the currently selected node (or last node)
  const handleAddShape = useCallback(async (shape: string, explicitSourceId?: string) => {
    let targetX = 160;
    let targetY = 140;
    let sourceNode: NonNullable<typeof dbNodes>[0] | undefined;

    if (dbNodes && dbNodes.length > 0) {
      const selectedNodeId = explicitSourceId || nodes.find(n => n.selected)?.id;
      sourceNode = (selectedNodeId ? dbNodes.find(n => n.id === selectedNodeId) : undefined)
        || dbNodes.reduce((p, c) => (c.position.x + c.position.y > p.position.x + p.position.y ? c : p));

      if (sourceNode) {
        // Detect whether the chart around sourceNode flows horizontally or vertically
        const incomingEdge = dbEdges?.find(e => e.target === sourceNode!.id);
        const parentNode = incomingEdge ? dbNodes.find(n => n.id === incomingEdge.source) : undefined;
        const flowsHorizontally = parentNode
          ? Math.abs(sourceNode.position.x - parentNode.position.x) > Math.abs(sourceNode.position.y - parentNode.position.y)
          : dbNodes.length >= 2 && Math.abs(dbNodes[1].position.x - dbNodes[0].position.x) > Math.abs(dbNodes[1].position.y - dbNodes[0].position.y);

        if (flowsHorizontally) {
          targetX = sourceNode.position.x + NODE_MARGIN_X;
          targetY = sourceNode.position.y;
        } else {
          const srcHeight = getNodeHeight(sourceNode.shape as string);
          targetX = sourceNode.position.x;
          targetY = sourceNode.position.y + srcHeight + NODE_MARGIN_Y;
        }
      }
    }

    const newNodeId = crypto.randomUUID();
    pendingSelectNodeIdRef.current = newNodeId;

    await db.flowchartNodes.add({
      id: newNodeId,
      flowchartId,
      label: '',
      shape: shape as any,
      position: { x: targetX, y: targetY },
    });

    if (sourceNode) {
      const handles = getSmartHandles(sourceNode.position, { x: targetX, y: targetY });
      await db.flowchartEdges.add({
        id: `e-${sourceNode.id}-${newNodeId}-${Date.now()}`,
        flowchartId,
        source: sourceNode.id,
        target: newNodeId,
        ...handles,
      });
    }

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 50);
  }, [flowchartId, dbNodes, dbEdges, nodes]);

  useEffect(() => {
    const handler = (e: any) => {
      handleAddShape('rectangle', e.detail?.sourceId);
    };
    window.addEventListener('flowchart-add-next', handler);
    return () => window.removeEventListener('flowchart-add-next', handler);
  }, [handleAddShape]);

  // Live 60fps handle switching while dragging a node
  const onNodeDrag = useCallback((_event: any, node: Node) => {
    setEdges(currEdges =>
      currEdges.map(edge => {
        if (edge.source !== node.id && edge.target !== node.id) return edge;
        const srcNode = edge.source === node.id ? node : nodes.find(n => n.id === edge.source);
        const tgtNode = edge.target === node.id ? node : nodes.find(n => n.id === edge.target);
        if (!srcNode || !tgtNode) return edge;
        const handles = getSmartHandles(srcNode.position, tgtNode.position);
        if (edge.sourceHandle === handles.sourceHandle && edge.targetHandle === handles.targetHandle) {
          return edge;
        }
        return { ...edge, ...handles };
      })
    );
  }, [nodes, setEdges]);

  // On drag stop: persist position and connected edge handles in a single DB transaction
  const onNodeDragStop = useCallback(async (event: any, node: Node) => {
    await db.transaction('rw', [db.flowchartNodes, db.flowchartEdges], async () => {
      await db.flowchartNodes.update(node.id, { position: node.position });

      if (dbNodes && dbEdges) {
        const nodeMap = new Map(dbNodes.map(n => [n.id, n.id === node.id ? { ...n, position: node.position } : n]));
        for (const edge of dbEdges) {
          if (edge.source === node.id || edge.target === node.id) {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (src && tgt) {
              const handles = getSmartHandles(src.position, tgt.position);
              await db.flowchartEdges.update(edge.id, handles);
            }
          }
        }

        // Only auto-connect by proximity if user explicitly holds Alt while dragging
        if (event.altKey) {
          const SNAP_DIST = 110;
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
            const alreadyConnected = dbEdges.some(e =>
              (e.source === node.id && e.target === closest!.id) ||
              (e.source === closest!.id && e.target === node.id)
            );
            if (!alreadyConnected) {
              const handles = getSmartHandles(closest.position, node.position);
              await db.flowchartEdges.add({
                id: `e-${closest.id}-${node.id}-${Date.now()}`,
                flowchartId,
                source: closest.id,
                target: node.id,
                ...handles,
              });
            }
          }
        }
      }
    });
  }, [flowchartId, dbNodes, dbEdges]);

  // Double-clicking empty canvas creates a step right at the cursor
  const handlePaneDoubleClick = useCallback(async (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('react-flow__pane')) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNodeId = crypto.randomUUID();
    pendingSelectNodeIdRef.current = newNodeId;

    const selectedNode = nodes.find(n => n.selected);
    await db.transaction('rw', [db.flowchartNodes, db.flowchartEdges], async () => {
      await db.flowchartNodes.add({
        id: newNodeId,
        flowchartId,
        label: '',
        shape: 'rectangle',
        position,
      });
      if (selectedNode) {
        const handles = getSmartHandles(selectedNode.position, position);
        await db.flowchartEdges.add({
          id: `e-${selectedNode.id}-${newNodeId}`,
          flowchartId,
          source: selectedNode.id,
          target: newNodeId,
          ...handles,
        });
      }
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-flowchart-node-edit', { detail: { id: newNodeId } }));
    }, 40);
  }, [screenToFlowPosition, flowchartId, nodes]);

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

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const dbEdge = dbEdges?.find(e => e.id === edge.id);
    setEditingEdge({ edgeId: edge.id, label: dbEdge?.label || '' });
  }, [dbEdges]);

  const handleSaveEdgeLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEdge) return;
    await db.flowchartEdges.update(editingEdge.edgeId, {
      label: editingEdge.label.trim() || undefined,
    });
    setEditingEdge(null);
  };

  const handleReverseEdge = useCallback(async () => {
    if (!edgeMenu) return;
    const dbEdge = dbEdges?.find(e => e.id === edgeMenu.edgeId);
    if (!dbEdge) return;
    const srcNode = dbNodes?.find(n => n.id === dbEdge.target);
    const tgtNode = dbNodes?.find(n => n.id === dbEdge.source);
    const handles = srcNode && tgtNode
      ? getSmartHandles(srcNode.position, tgtNode.position)
      : { sourceHandle: dbEdge.targetHandle, targetHandle: dbEdge.sourceHandle };

    await db.flowchartEdges.update(edgeMenu.edgeId, {
      source: dbEdge.target,
      target: dbEdge.source,
      ...handles,
    });
    setEdgeMenu(null);
  }, [edgeMenu, dbEdges, dbNodes]);

  const handleDoubleArrow = useCallback(async () => {
    if (!edgeMenu) return;
    const dbEdge = dbEdges?.find(e => e.id === edgeMenu.edgeId);
    if (!dbEdge) return;
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

  // Auto-layout supporting both Horizontal (LR) and Vertical (TB) directions + updating edge handles
  const handleAutoLayout = useCallback(async (direction: 'TB' | 'LR') => {
    if (!dbNodes || !dbEdges || dbNodes.length === 0) return;

    const neighbors = new Map<string, Set<string>>();
    for (const n of dbNodes) neighbors.set(n.id, new Set());
    for (const e of dbEdges) {
      neighbors.get(e.source)?.add(e.target);
      neighbors.get(e.target)?.add(e.source);
    }

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

    const posMap = new Map<string, { x: number; y: number }>();

    for (const component of components) {
      if (component.length < 2) continue;

      const compSet = new Set(component);
      const inDegree = new Map<string, number>();
      const children = new Map<string, string[]>();
      for (const id of component) { inDegree.set(id, 0); children.set(id, []); }

      for (const e of dbEdges) {
        if (!compSet.has(e.source) || !compSet.has(e.target)) continue;
        inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
        children.get(e.source)?.push(e.target);
      }

      const roots = component.filter(id => (inDegree.get(id) ?? 0) === 0);
      const startNodes = roots.length > 0 ? roots : [component[0]];

      const anchorNode = dbNodes.find(n => n.id === startNodes[0]);
      const anchorX = anchorNode?.position.x ?? 120;
      const anchorY = anchorNode?.position.y ?? 120;

      const levelVisited = new Set<string>();

      if (direction === 'TB') {
        const levelQueue: { id: string; branchX: number; parentBottom: number }[] = [];
        for (let ri = 0; ri < startNodes.length; ri++) {
          const rootId = startNodes[ri];
          const rootBranchX = anchorX + ri * 220;
          const rootH = getNodeHeight((dbNodes.find(n => n.id === rootId)?.shape as string) ?? 'rectangle');
          posMap.set(rootId, { x: rootBranchX, y: anchorY });
          levelVisited.add(rootId);
          const rootBottom = anchorY + rootH;
          const kids = (children.get(rootId) ?? []).filter(k => !levelVisited.has(k));
          kids.forEach((kid, i) => {
            levelVisited.add(kid);
            const kidX = kids.length > 1 ? rootBranchX + (i - (kids.length - 1) / 2) * 220 : rootBranchX;
            levelQueue.push({ id: kid, branchX: kidX, parentBottom: rootBottom });
          });
        }

        while (levelQueue.length) {
          const { id, branchX, parentBottom } = levelQueue.shift()!;
          const thisH = getNodeHeight((dbNodes.find(n => n.id === id)?.shape as string) ?? 'rectangle');
          const y = parentBottom + NODE_MARGIN_Y;
          posMap.set(id, { x: branchX, y });
          const myBottom = y + thisH;

          const kids = (children.get(id) ?? []).filter(k => !levelVisited.has(k));
          kids.forEach((kid, i) => {
            levelVisited.add(kid);
            const kidX = kids.length > 1 ? branchX + (i - (kids.length - 1) / 2) * 220 : branchX;
            levelQueue.push({ id: kid, branchX: kidX, parentBottom: myBottom });
          });
        }
      } else {
        // Horizontal (LR) layout
        const levelQueue: { id: string; parentX: number; branchY: number }[] = [];
        for (let ri = 0; ri < startNodes.length; ri++) {
          const rootId = startNodes[ri];
          const rootBranchY = anchorY + ri * 140;
          posMap.set(rootId, { x: anchorX, y: rootBranchY });
          levelVisited.add(rootId);
          const kids = (children.get(rootId) ?? []).filter(k => !levelVisited.has(k));
          kids.forEach((kid, i) => {
            levelVisited.add(kid);
            const kidY = kids.length > 1 ? rootBranchY + (i - (kids.length - 1) / 2) * 140 : rootBranchY;
            levelQueue.push({ id: kid, parentX: anchorX, branchY: kidY });
          });
        }

        while (levelQueue.length) {
          const { id, parentX, branchY } = levelQueue.shift()!;
          const x = parentX + NODE_MARGIN_X;
          posMap.set(id, { x, y: branchY });

          const kids = (children.get(id) ?? []).filter(k => !levelVisited.has(k));
          kids.forEach((kid, i) => {
            levelVisited.add(kid);
            const kidY = kids.length > 1 ? branchY + (i - (kids.length - 1) / 2) * 140 : branchY;
            levelQueue.push({ id: kid, parentX: x, branchY: kidY });
          });
        }
      }
    }

    for (const [id, pos] of posMap) {
      await db.flowchartNodes.update(id, { position: pos });
    }

    // Update all edge handles to match the new node positions
    for (const e of dbEdges) {
      const srcPos = posMap.get(e.source) ?? dbNodes.find(n => n.id === e.source)?.position;
      const tgtPos = posMap.get(e.target) ?? dbNodes.find(n => n.id === e.target)?.position;
      if (srcPos && tgtPos) {
        const handles = getSmartHandles(srcPos, tgtPos);
        await db.flowchartEdges.update(e.id, handles);
      }
    }

    setTimeout(() => fitView({ duration: 400, padding: 0.25, maxZoom: 0.85 }), 100);
  }, [dbNodes, dbEdges, fitView]);

  useEffect(() => {
    const handler = (e: any) => {
      handleAutoLayout(e.detail?.direction || 'LR');
    };
    window.addEventListener('flowchart-auto-layout', handler);
    return () => window.removeEventListener('flowchart-auto-layout', handler);
  }, [handleAutoLayout]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <FlowchartSidebar onAddShape={(shape) => handleAddShape(shape)} />
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper} onDoubleClick={handlePaneDoubleClick}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onEdgeContextMenu={onEdgeContextMenu}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneClick={() => setEdgeMenu(null)}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          fitView
          fitViewOptions={{ maxZoom: 0.85, padding: 0.25 }}
          zoomOnDoubleClick={false}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Shift']}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: 'var(--n600)', strokeWidth: 1.5 },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
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
              minWidth: '180px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Connector Options</div>
              <button
                onClick={() => {
                  const dbEdge = dbEdges?.find(e => e.id === edgeMenu.edgeId);
                  setEditingEdge({ edgeId: edgeMenu.edgeId, label: dbEdge?.label || '' });
                  setEdgeMenu(null);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ✏️ Edit Label (Yes/No)
              </button>
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
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r500)', fontSize: '14px', textAlign: 'left' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  🗑 Delete Connector
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edge Label Modal */}
        {editingEdge && (
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,30,66,0.4)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEditingEdge(null)}
          >
            <form
              onSubmit={handleSaveEdgeLabel}
              onClick={e => e.stopPropagation()}
              style={{ backgroundColor: 'var(--n0)', padding: '20px', borderRadius: 'var(--radius)', width: '320px', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--n800)', textTransform: 'none' }}>Connector Label</h3>
              <input
                autoFocus
                value={editingEdge.label}
                onChange={e => setEditingEdge({ ...editingEdge, label: e.target.value })}
                placeholder="e.g. Yes, No, Approved..."
                style={{ padding: '8px 10px', width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setEditingEdge(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Flowchart() {
  const [activeView, setActiveView] = useState<'canvas' | 'list'>('canvas');
  const [activeFlowchartId, setActiveFlowchartId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingDiagram, setIsSendingDiagram] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const mapParam = searchParams.get('map');

  const flowcharts = useLiveQuery(() => db.flowcharts.orderBy('createdAt').reverse().toArray());

  // Respect ?map= query param or auto-select the most recent flowchart
  useEffect(() => {
    if (mapParam && flowcharts?.some(f => f.id === mapParam)) {
      setActiveFlowchartId(mapParam);
      setActiveView('canvas');
      setSearchParams({}, { replace: true });
    } else if (flowcharts && flowcharts.length > 0 && !activeFlowchartId) {
      setActiveFlowchartId(flowcharts[0].id);
    } else if (flowcharts && flowcharts.length === 0) {
      const newId = crypto.randomUUID();
      db.flowcharts.add({ id: newId, title: 'Main Flowchart', createdAt: Date.now(), updatedAt: Date.now() })
        .then(() => setActiveFlowchartId(newId));
    }
  }, [flowcharts, activeFlowchartId, mapParam, setSearchParams]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this flowchart?')) return;
    const nodeIds = (await db.flowchartNodes.where('flowchartId').equals(id).toArray()).map(n => n.id);
    await db.flowchartNodes.where('flowchartId').equals(id).delete();
    await db.flowchartEdges.where('flowchartId').equals(id).delete();
    await db.flowcharts.delete(id);
    const linkedTasks = await db.tasks.filter(t => t.flowchartId === id || (!!t.flowchartNodeId && nodeIds.includes(t.flowchartNodeId))).toArray();
    for (const t of linkedTasks) {
      await db.tasks.update(t.id, {
        flowchartId: t.flowchartId === id ? undefined : t.flowchartId,
        flowchartNodeId: t.flowchartNodeId && nodeIds.includes(t.flowchartNodeId) ? undefined : t.flowchartNodeId,
      });
    }
    if (activeFlowchartId === id) { setActiveFlowchartId(null); setActiveView('list'); }
    setOpenDropdownId(null);
  };

  const activeFlowchart = flowcharts?.find(f => f.id === activeFlowchartId);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)' }}>

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
          {activeView === 'canvas' && activeFlowchart && flowcharts ? (
            <select
              value={activeFlowchart.id}
              onChange={(e) => {
                setActiveFlowchartId(e.target.value);
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
              title="Switch Flowchart"
            >
              {flowcharts.map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
          ) : (
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, padding: 0, color: 'var(--n800)' }}>
              Flowcharts
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
              }}
            >
              All Flowcharts ({flowcharts?.length || 0})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeView === 'canvas' && activeFlowchart && (
            <>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginRight: '6px' }}>
                <span><kbd style={{ background: 'var(--n20)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--n40)' }}>Tab</kbd> Next step</span>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('flowchart-auto-layout', { detail: { direction: 'LR' } }))}
                className="btn btn-secondary"
                title="Auto-align flowchart horizontally (Left → Right)"
              >
                <ArrowRightLeft size={14} /> Horizontal
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('flowchart-auto-layout', { detail: { direction: 'TB' } }))}
                className="btn btn-secondary"
                title="Auto-align flowchart vertically (Top → Bottom)"
              >
                <AlignCenter size={14} /> Vertical
              </button>
              <button
                onClick={() => setIsSendingDiagram(true)}
                className="btn btn-secondary"
                style={{ color: 'var(--b400)', backgroundColor: 'var(--b50)' }}
                title="Embed this Flowchart into a Doc or attach to a Task"
              >
                <Share2 size={15} /> Add to Doc / Task
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('export-flowchart-png'))}
                className="btn btn-ghost"
                style={{ padding: '0 8px' }}
                title="Export Flowchart as PNG"
              >
                <Download size={16} />
              </button>
            </>
          )}
          <button onClick={() => setIsCreating(true)} className="btn btn-primary">
            <Plus size={15} /> New Flowchart
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'list' ? (
        <div style={{ padding: '24px 40px 32px 40px', flex: 1, overflowY: 'auto' }}>
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
                    border: activeFlowchartId === f.id ? '2px solid var(--b400)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
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
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--n800)', textTransform: 'none' }}>{f.title}</h3>
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
                            <button onClick={e => { e.stopPropagation(); setEditingId(f.id); setOpenDropdownId(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n800)', fontSize: '14px', textAlign: 'left' }} onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')} onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <Edit2 size={16} /> Rename
                            </button>
                            <button onClick={e => handleDelete(f.id, e)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r500)', fontSize: '14px', textAlign: 'left' }} onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')} onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
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
        <div style={{ flex: 1, position: 'relative' }}>
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

      {isSendingDiagram && activeFlowchart && (
        <SendDiagramModal
          diagramId={activeFlowchart.id}
          diagramType="flowchart"
          diagramTitle={activeFlowchart.title}
          onClose={() => setIsSendingDiagram(false)}
        />
      )}
    </div>
  );
}
