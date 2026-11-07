import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export function getSmartHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' };
  } else {
    return dy >= 0
      ? { sourceHandle: 'bottom', targetHandle: 'top' }
      : { sourceHandle: 'top', targetHandle: 'bottom' };
  }
}

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: isHorizontal ? 96 : 64,
    nodesep: isHorizontal ? 44 : 60,
  });

  const nodeDims = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    const labelText = String(node.data?.label || 'New Node');
    const estimatedWidth = Math.min(320, Math.max(140, labelText.length * 8 + 64));
    const width = Math.max(node.measured?.width ?? 0, estimatedWidth);
    const height = node.measured?.height ?? 52;
    nodeDims.set(node.id, { width, height });
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (nodeDims.has(edge.source) && nodeDims.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dims = nodeDims.get(node.id) ?? { width: 180, height: 52 };
    if (!nodeWithPosition) return node;

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: Math.round(nodeWithPosition.x - dims.width / 2),
        y: Math.round(nodeWithPosition.y - dims.height / 2),
      },
    };
  });

  return { nodes: newNodes as Node[], edges };
};
