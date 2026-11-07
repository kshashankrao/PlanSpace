import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatTaskId } from '../db/db';
import type { Task, Status } from '../db/db';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Network, Workflow, FileText, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

function TaskCardView({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const hasMindMap = Boolean(task.mindMapId || task.mindmapNodeId);
  const hasFlowchart = Boolean(task.flowchartId || task.flowchartNodeId);
  const hasDoc = Boolean(task.docId);

  return (
    <div
      className="task-card"
      style={
        isOverlay
          ? {
              boxShadow: 'var(--shadow-modal)',
              transform: 'rotate(2deg) scale(1.02)',
              cursor: 'grabbing',
              border: '1.5px solid var(--b300)',
            }
          : undefined
      }
    >
      <div className="task-card-title">{task.title}</div>
      {(hasMindMap || hasFlowchart || hasDoc) && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
          {hasMindMap && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'var(--b50)',
                color: 'var(--b500)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
              title="Linked Mind Map"
            >
              <Network size={10} /> Mind Map
            </span>
          )}
          {hasFlowchart && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: '#e6fcff',
                color: '#0065ff',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
              title="Linked Flowchart"
            >
              <Workflow size={10} /> Flowchart
            </span>
          )}
          {hasDoc && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: '#eae6ff',
                color: '#403294',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
              title="Linked Document"
            >
              <FileText size={10} /> Doc
            </span>
          )}
        </div>
      )}
      <div className="task-card-footer">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`priority-icon ${task.priority === 'urgent' ? 'highest' : task.priority}`}></span>
          <span className="task-id">{formatTaskId(task.id)}</span>
        </div>
        {task.duration && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task.duration}d</span>}
      </div>
    </div>
  );
}

const SortableTaskItem = React.memo(function SortableTaskItem({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
    >
      <TaskCardView task={task} />
    </div>
  );
});

const KanbanColumn = React.memo(function KanbanColumn({
  status,
  tasks,
  onQuickAdd,
}: {
  status: Status;
  tasks: Task[];
  onQuickAdd: (statusId: string, title: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: 'Column', status },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      setIsAdding(false);
      return;
    }
    const title = quickTitle.trim();
    setQuickTitle('');
    await onQuickAdd(status.id, title);
  };

  return (
    <div
      className="kanban-column"
      ref={setNodeRef}
      style={{
        outline: isOver ? '2px solid var(--b200)' : 'none',
        transition: 'outline 0.12s ease, background-color 0.12s ease',
      }}
    >
      <div className="kanban-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0 }}>{status.title}</h3>
          <span
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-ghost"
          style={{ width: '24px', height: '24px', padding: 0 }}
          title={`Quick add to ${status.title}`}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="kanban-column-content">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
        </SortableContext>

        {isAdding ? (
          <form
            onSubmit={handleQuickSubmit}
            style={{
              backgroundColor: 'var(--n0)',
              padding: '10px',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)',
              border: '2px solid var(--b400)',
            }}
          >
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setQuickTitle('');
                }
              }}
              onBlur={() => {
                if (!quickTitle.trim()) setIsAdding(false);
              }}
              placeholder="What needs to be done? (Enter)"
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: '13.5px',
                padding: '2px 0',
                outline: 'none',
                color: 'var(--n800)',
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              padding: '6px 10px',
              marginTop: '2px',
            }}
          >
            <Plus size={14} /> Create issue
          </button>
        )}
      </div>
    </div>
  );
});

export default function KanbanBoard() {
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());

  const activeSprint = sprints?.find(s => s.status === 'active');
  const dbTasks = useLiveQuery(
    () =>
      activeSprint
        ? db.tasks.filter(t => t.sprintId === activeSprint.id).toArray()
        : Promise.resolve([] as Task[]),
    [activeSprint]
  );

  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    if (dbTasks && !activeTask) {
      setLocalTasks([...dbTasks].sort((a, b) => a.order - b.order));
    }
  }, [dbTasks, activeTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (!statuses || !sprints || (activeSprint && !dbTasks)) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleQuickAdd = async (statusId: string, title: string) => {
    if (!activeSprint) return;
    await db.tasks.add({
      id: crypto.randomUUID(),
      title,
      description: '',
      statusId,
      sprintId: activeSprint.id,
      priority: 'medium',
      startDate: Date.now(),
      duration: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: localTasks.length,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const isOverColumn = over.data.current?.type === 'Column';
    const activeItem = localTasks.find(t => t.id === activeId);
    if (!activeItem) return;

    const targetStatusId = isOverColumn
      ? overId
      : localTasks.find(t => t.id === overId)?.statusId;

    if (!targetStatusId) return;

    if (activeItem.statusId !== targetStatusId) {
      setLocalTasks(prev => {
        const updated = prev.map(t => (t.id === activeId ? { ...t, statusId: targetStatusId } : t));
        if (!isOverColumn) {
          const oldIdx = updated.findIndex(t => t.id === activeId);
          const newIdx = updated.findIndex(t => t.id === overId);
          if (oldIdx !== -1 && newIdx !== -1) {
            return arrayMove(updated, oldIdx, newIdx);
          }
        }
        return updated;
      });
    } else if (!isOverColumn) {
      setLocalTasks(prev => {
        const oldIdx = prev.findIndex(t => t.id === activeId);
        const newIdx = prev.findIndex(t => t.id === overId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          return arrayMove(prev, oldIdx, newIdx);
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const dragged = activeTask;
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !dragged) return;

    const activeId = active.id as string;
    const currentItem = localTasks.find(t => t.id === activeId);
    if (!currentItem) return;

    const newStatusId = currentItem.statusId;
    const columnItems = localTasks.filter(t => t.statusId === newStatusId);

    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < columnItems.length; i++) {
        const item = columnItems[i];
        const updateData: Partial<Task> = { order: i };
        if (item.id === activeId) {
          updateData.statusId = newStatusId;
          updateData.updatedAt = Date.now();
          if (newStatusId === 'in_progress' && dragged.statusId !== 'in_progress' && !dragged.startDate) {
            updateData.startDate = Date.now();
          }
        }
        await db.tasks.update(item.id, updateData);
      }
    });
  };

  return (
    <div style={{ padding: '20px 32px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)', overflowX: 'auto' }}>
      {!activeSprint ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>No active sprint</h2>
          <p style={{ marginBottom: '16px' }}>Start a sprint in the Backlog to see your tasks here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--n800)' }}>{activeSprint.name}</div>
              {activeSprint.goal && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{activeSprint.goal}</div>
              )}
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: { defaultSprintId: activeSprint.id } }))}
              className="btn btn-primary"
            >
              <Plus size={15} /> Create issue
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-board">
              {statuses?.map(status => {
                const columnTasks = localTasks.filter(t => t.statusId === status.id);
                return (
                  <KanbanColumn
                    key={status.id}
                    status={status}
                    tasks={columnTasks}
                    onQuickAdd={handleQuickAdd}
                  />
                );
              })}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCardView task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
