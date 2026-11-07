import { db } from '../db/db';

export async function seedSampleData(force = false) {
  const taskCount = await db.tasks.count();
  if (taskCount > 0 && !force) {
    return;
  }

  // Ensure default statuses
  const statusCount = await db.statuses.count();
  if (statusCount === 0) {
    await db.statuses.bulkAdd([
      { id: 'todo', title: 'To Do', order: 0 },
      { id: 'in_progress', title: 'In Progress', order: 1 },
      { id: 'done', title: 'Done', order: 2 },
    ]);
  }

  // Clear existing if force
  if (force) {
    await db.tasks.clear();
    await db.sprints.clear();
    await db.mindMaps.clear();
    await db.mindMapNodes.clear();
    await db.mindMapEdges.clear();
    await db.flowcharts.clear();
    await db.flowchartNodes.clear();
    await db.flowchartEdges.clear();
    await db.docs.clear();
    await db.dailyNotes.clear();
  }

  const now = Date.now();
  const day = 86400000;
  const sprintStart = now - 3 * day;

  // Active Sprint
  await db.sprints.add({
    id: 'sprint-1',
    name: 'Sprint 24: Core Workspace & Graph Sync',
    goal: 'Deliver local-first desktop workspace with unified docs, agile planning, and visual graphs.',
    status: 'active',
    startDate: sprintStart,
    endDate: sprintStart + 14 * day,
    durationDays: 14,
    createdAt: sprintStart,
  });

  // Sprint Tasks
  await db.tasks.bulkAdd([
    {
      id: 'task-1',
      title: 'Design Modern Glassmorphism Theme',
      description: 'Create CSS variables and clean dark/light mode palette with polished badges.',
      statusId: 'done',
      priority: 'high',
      order: 0,
      sprintId: 'sprint-1',
      startDate: sprintStart,
      createdAt: sprintStart,
      updatedAt: now - day,
      duration: 2,
      dueDate: now - day,
    },
    {
      id: 'task-2',
      title: 'Implement Tiptap Document Engine & Math',
      description: 'Integrate KaTeX math equations, table support, slash commands, and smart date badge system.',
      statusId: 'done',
      priority: 'medium',
      order: 1,
      sprintId: 'sprint-1',
      docId: 'doc-1',
      startDate: sprintStart + 1 * day,
      createdAt: sprintStart,
      updatedAt: now - day,
      duration: 3,
      dueDate: now,
    },
    {
      id: 'task-3',
      title: 'Local-First Dexie / IndexedDB Persistence',
      description: 'Ensure 100% offline data storage with instant reactive queries and JSON backup.',
      statusId: 'in_progress',
      priority: 'urgent',
      order: 0,
      sprintId: 'sprint-1',
      startDate: sprintStart + 2 * day,
      createdAt: now - 2 * day,
      updatedAt: now,
      duration: 4,
      dueDate: now + 2 * day,
    },
    {
      id: 'task-4',
      title: 'Build Flowchart & Node Canvas Engine',
      description: 'Enable drag-and-drop workflow nodes with 4-way connector handles, quick-actions, and auto-layout.',
      statusId: 'in_progress',
      priority: 'high',
      order: 1,
      sprintId: 'sprint-1',
      flowchartId: 'fc-1',
      startDate: sprintStart + 3 * day,
      createdAt: now - 2 * day,
      updatedAt: now,
      duration: 5,
      dueDate: now + 4 * day,
    },
    {
      id: 'task-5',
      title: 'Interactive Mind Map Hierarchical Graph',
      description: 'Support keyboard shortcuts (Tab for child, Enter for sibling) and non-overlapping auto-dagre layout.',
      statusId: 'todo',
      priority: 'medium',
      order: 0,
      sprintId: 'sprint-1',
      mindMapId: 'mm-1',
      startDate: sprintStart + 6 * day,
      createdAt: now - day,
      updatedAt: now,
      duration: 3,
      dueDate: now + 6 * day,
    },
    {
      id: 'task-6',
      title: 'Daily Notes Calendar & Journaling Mode',
      description: 'Dual-mode calendar view with single-day focus and rolling timeline notes.',
      statusId: 'todo',
      priority: 'low',
      order: 1,
      sprintId: 'sprint-1',
      startDate: sprintStart + 8 * day,
      createdAt: now - day,
      updatedAt: now,
      duration: 3,
      dueDate: now + 8 * day,
    },
    // Backlog tasks
    {
      id: 'task-7',
      title: 'Audio & Video Media Attachments',
      description: 'Add blob storage support for multimedia comments and attachments.',
      statusId: 'todo',
      priority: 'medium',
      order: 0,
      createdAt: now,
      updatedAt: now,
      duration: 4,
    },
    {
      id: 'task-8',
      title: 'Cloud Encrypted Backup & Sync',
      description: 'Optional E2EE sync between devices using peer-to-peer or self-hosted relay.',
      statusId: 'todo',
      priority: 'low',
      order: 1,
      createdAt: now,
      updatedAt: now,
      duration: 7,
    },
  ]);

  // Mind Map
  const mmId = 'mm-1';
  await db.mindMaps.add({
    id: mmId,
    title: 'PlanSpace Workspace Architecture',
    createdAt: now,
    updatedAt: now,
  });

  await db.mindMapNodes.bulkAdd([
    { id: 'node-root', mindMapId: mmId, label: 'PlanSpace Workspace', position: { x: 420, y: 60 } },
    { id: 'node-agile', mindMapId: mmId, label: 'Agile Engine (Kanban, Backlog, Gantt)', position: { x: 40, y: 220 } },
    { id: 'node-editor', mindMapId: mmId, label: 'Rich Docs & Tiptap Editor', position: { x: 320, y: 220 } },
    { id: 'node-graphs', mindMapId: mmId, label: 'Visual Graphs (MindMap, Flowchart)', position: { x: 580, y: 220 } },
    { id: 'node-local', mindMapId: mmId, label: 'Local-First Dexie DB (Offline)', position: { x: 880, y: 220 } },
  ]);

  await db.mindMapEdges.bulkAdd([
    { id: 'edge-1', mindMapId: mmId, source: 'node-root', target: 'node-agile' },
    { id: 'edge-2', mindMapId: mmId, source: 'node-root', target: 'node-editor' },
    { id: 'edge-3', mindMapId: mmId, source: 'node-root', target: 'node-graphs' },
    { id: 'edge-4', mindMapId: mmId, source: 'node-root', target: 'node-local' },
  ]);

  // Flowchart
  const fcId = 'fc-1';
  await db.flowcharts.add({
    id: fcId,
    title: 'Engineering Development Cycle',
    createdAt: now,
    updatedAt: now,
  });

  await db.flowchartNodes.bulkAdd([
    { id: 'fc-node-1', flowchartId: fcId, label: 'Requirement & Idea', shape: 'oval', position: { x: 60, y: 140 } },
    { id: 'fc-node-2', flowchartId: fcId, label: 'Backlog Grooming', shape: 'rectangle', position: { x: 290, y: 140 } },
    { id: 'fc-node-3', flowchartId: fcId, label: 'Sprint Planning', shape: 'rectangle', position: { x: 520, y: 140 } },
    { id: 'fc-node-4', flowchartId: fcId, label: 'Code Review & QA', shape: 'diamond', position: { x: 750, y: 120 } },
    { id: 'fc-node-5', flowchartId: fcId, label: 'Production Release', shape: 'oval', position: { x: 1000, y: 140 } },
  ]);

  await db.flowchartEdges.bulkAdd([
    { id: 'fe-1', flowchartId: fcId, source: 'fc-node-1', target: 'fc-node-2', sourceHandle: 'right', targetHandle: 'left' },
    { id: 'fe-2', flowchartId: fcId, source: 'fc-node-2', target: 'fc-node-3', sourceHandle: 'right', targetHandle: 'left' },
    { id: 'fe-3', flowchartId: fcId, source: 'fc-node-3', target: 'fc-node-4', sourceHandle: 'right', targetHandle: 'left' },
    { id: 'fe-4', flowchartId: fcId, source: 'fc-node-4', target: 'fc-node-5', sourceHandle: 'right', targetHandle: 'left', label: 'Approved' },
  ]);

  // Documentation
  await db.docs.add({
    id: 'doc-1',
    title: 'Product Specification & Design System',
    content: `<h1>PlanSpace Workspace Specification</h1><p>Welcome to <strong>PlanSpace</strong>, an ultra-fast, local-first productivity ecosystem combining agile project management, rich documentation, and visual knowledge graphs.</p><h2>Core Design Tenets</h2><ul><li><strong>Speed & Privacy:</strong> Zero cloud latency, 100% offline-ready with IndexedDB.</li><li><strong>Deep Interlinking:</strong> Seamlessly reference tasks, embed diagrams, and insert smart date badges.</li><li><strong>Visual Thinking:</strong> Native flowcharts and mindmaps directly inside your workspace.</li></ul><p>Next release scheduled: <span data-type="date-badge" data-date="2026-11-15">📅 Nov 15, 2026</span></p><h3>Architecture Stack</h3><table style="width: 100%; border-collapse: collapse;"><thead><tr><th style="border: 1px solid var(--border-color); padding: 8px;">Layer</th><th style="border: 1px solid var(--border-color); padding: 8px;">Technology</th><th style="border: 1px solid var(--border-color); padding: 8px;">Purpose</th></tr></thead><tbody><tr><td style="border: 1px solid var(--border-color); padding: 8px;"><strong>UI / Client</strong></td><td style="border: 1px solid var(--border-color); padding: 8px;">React 19 + TypeScript + Vite</td><td style="border: 1px solid var(--border-color); padding: 8px;">Responsive desktop experience</td></tr><tr><td style="border: 1px solid var(--border-color); padding: 8px;"><strong>Editor</strong></td><td style="border: 1px solid var(--border-color); padding: 8px;">Tiptap + KaTeX + Custom Nodes</td><td style="border: 1px solid var(--border-color); padding: 8px;">Notion-like extensible editor</td></tr><tr><td style="border: 1px solid var(--border-color); padding: 8px;"><strong>Graphs</strong></td><td style="border: 1px solid var(--border-color); padding: 8px;">@xyflow/react + Dagre</td><td style="border: 1px solid var(--border-color); padding: 8px;">Interactive node graphs & flowcharts</td></tr><tr><td style="border: 1px solid var(--border-color); padding: 8px;"><strong>Database</strong></td><td style="border: 1px solid var(--border-color); padding: 8px;">Dexie.js (IndexedDB)</td><td style="border: 1px solid var(--border-color); padding: 8px;">Local-first zero latency storage</td></tr></tbody></table>`,
    createdAt: now - 5 * day,
    updatedAt: now,
  });

  // Daily Notes
  const todayStr = new Date().toISOString().split('T')[0];
  await db.dailyNotes.put({
    date: todayStr,
    content: `<h2>Daily Log — ${todayStr}</h2><p>Focus for today: Finalizing Sprint 24 deliverables and polishing the visual graph canvas.</p><ul data-type="taskList"><li data-type="taskItem" data-checked="true">Verified electron release workflow on GitHub Actions</li><li data-type="taskItem" data-checked="true">Tested smart date badges & calendar popover</li><li data-type="taskItem" data-checked="false">Review mind map auto-layout performance on large trees</li></ul>`,
    createdAt: now,
    updatedAt: now,
  });
}
