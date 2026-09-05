import Dexie, { type EntityTable } from 'dexie';

export interface Task {
  id: string;
  title: string;
  description: string;
  statusId: string; // references Status.id
  priority: 'low' | 'medium' | 'high' | 'urgent';
  duration?: number; // estimated duration in days
  startDate?: number; // timestamp
  createdAt: number;
  updatedAt: number;
  mindmapNodeId?: string; // Optional link to a mindmap node
  dueDate?: number;
  order: number; // For manual ordering within a column
  sprintId?: string; // Link to sprint, undefined means Backlog
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string; // Optional sprint goal
  durationDays?: number; // duration in days
  startDate?: number;
  endDate?: number;
  status: 'planned' | 'active' | 'completed';
  createdAt: number;
}

export interface Status {
  id: string;
  title: string;
  order: number;
}

export interface MindMap {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Doc {
  id: string;
  title: string;
  content: string; // HTML string
  parentId?: string; // For nesting documents
  createdAt: number;
  updatedAt: number;
}

export interface MindMapNodeData {
  id: string;
  taskId?: string; // Link back to task
  mindMapId?: string; // To support multiple mind maps
  label: string;
  position: { x: number; y: number };
}

export interface MindMapEdgeData {
  id: string;
  source: string;
  target: string;
  mindMapId?: string; // To support multiple mind maps
}

export interface Flowchart {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface FlowchartNodeData {
  id: string;
  flowchartId: string;
  taskId?: string; // Optional link to a task
  label: string;
  shape: 'rectangle' | 'diamond' | 'oval' | 'cylinder';
  position: { x: number; y: number };
}

export interface FlowchartEdgeData {
  id: string;
  flowchartId: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  media?: string[]; // Array of Base64 Data URIs
  createdAt: number;
}

const db = new Dexie('TaskAppDatabase') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  statuses: EntityTable<Status, 'id'>;
  sprints: EntityTable<Sprint, 'id'>;
  mindMaps: EntityTable<MindMap, 'id'>;
  mindMapNodes: EntityTable<MindMapNodeData, 'id'>;
  mindMapEdges: EntityTable<MindMapEdgeData, 'id'>;
  taskComments: EntityTable<TaskComment, 'id'>;
  docs: EntityTable<Doc, 'id'>;
  flowcharts: EntityTable<Flowchart, 'id'>;
  flowchartNodes: EntityTable<FlowchartNodeData, 'id'>;
  flowchartEdges: EntityTable<FlowchartEdgeData, 'id'>;
};

db.version(1).stores({
  tasks: 'id, statusId, priority, dueDate, createdAt, mindmapNodeId, order',
  statuses: 'id, order',
  mindMapNodes: 'id, taskId',
  mindMapEdges: 'id, source, target'
});
db.version(5).stores({
  tasks: 'id, statusId, priority, dueDate, createdAt, mindmapNodeId, order, sprintId',
  statuses: 'id, order',
  sprints: 'id, status',
  mindMaps: 'id, createdAt, updatedAt',
  mindMapNodes: 'id, taskId, mindMapId',
  mindMapEdges: 'id, source, target, mindMapId',
  taskComments: 'id, taskId, createdAt'
});

db.version(6).stores({
  tasks: 'id, statusId, priority, dueDate, createdAt, mindmapNodeId, order, sprintId',
  statuses: 'id, order',
  sprints: 'id, status',
  mindMaps: 'id, createdAt, updatedAt',
  mindMapNodes: 'id, taskId, mindMapId',
  mindMapEdges: 'id, source, target, mindMapId',
  taskComments: 'id, taskId, createdAt',
  docs: 'id, parentId, createdAt, updatedAt'
}).upgrade(async tx => {
  // Existing tasks will automatically have sprintId = undefined (which means Backlog)
  
  // Re-populate statuses if they were accidentally dropped in v2
  const count = await tx.table('statuses').count();
  if (count === 0) {
    await tx.table('statuses').bulkAdd([
      { id: 'todo', title: 'To Do', order: 0 },
      { id: 'in_progress', title: 'In Progress', order: 1 },
      { id: 'done', title: 'Done', order: 2 },
    ]);
  }

  // Migrate existing mind map nodes/edges to a default mind map
  const nodes = await tx.table('mindMapNodes').toArray();
  if (nodes.length > 0 && !nodes[0].mindMapId) {
    const defaultMindMapId = crypto.randomUUID();
    await tx.table('mindMaps').add({
      id: defaultMindMapId,
      title: 'Main Mind Map',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await tx.table('mindMapNodes').toCollection().modify({ mindMapId: defaultMindMapId });
    await tx.table('mindMapEdges').toCollection().modify({ mindMapId: defaultMindMapId });
  }
});

db.version(7).stores({
  tasks: 'id, statusId, priority, dueDate, createdAt, mindmapNodeId, order, sprintId',
  statuses: 'id, order',
  sprints: 'id, status',
  mindMaps: 'id, createdAt, updatedAt',
  mindMapNodes: 'id, taskId, mindMapId',
  mindMapEdges: 'id, source, target, mindMapId',
  taskComments: 'id, taskId, createdAt',
  docs: 'id, parentId, createdAt, updatedAt',
  flowcharts: 'id, createdAt, updatedAt',
  flowchartNodes: 'id, flowchartId, taskId',
  flowchartEdges: 'id, flowchartId, source, target'
});

// Populate default statuses on initial load
db.on('populate', () => {
  db.statuses.bulkAdd([
    { id: 'todo', title: 'To Do', order: 0 },
    { id: 'in_progress', title: 'In Progress', order: 1 },
    { id: 'done', title: 'Done', order: 2 },
  ]);
});

export { db };
