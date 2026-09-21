import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // We assume standard dimensions for our nodes if they aren't measured yet.
    const width = node.measured?.width ?? 200;
    const height = node.measured?.height ?? 80;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // We are shifting the dagre node position (anchor=center) to the top left
      // so it matches React Flow node anchors.
      position: {
        x: nodeWithPosition.x - (node.measured?.width ?? 200) / 2,
        y: nodeWithPosition.y - (node.measured?.height ?? 80) / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes as Node[], edges };
};
