import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Task, Status } from '../db/db';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

const SortableTaskItem = React.memo(function SortableTaskItem({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: task });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    scale: isDragging ? 1.02 : 1,
    boxShadow: isDragging ? 'var(--shadow-dropdown)' : undefined,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="task-card"
      onDoubleClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
    >
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-footer">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`priority-icon ${task.priority === 'urgent' ? 'highest' : task.priority}`}></span>
          <span className="task-id">TSK-{task.id.substring(0, 4)}</span>
        </div>
        {task.duration && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task.duration}d</span>}
      </div>
    </div>
  );
});

const KanbanColumn = React.memo(function KanbanColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({
    id: status.id,
    data: { type: 'Column', status }
  });

  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="kanban-column-header">
        <h3>{status.title}</h3>
        <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '99px', fontSize: '0.875rem' }}>
          {tasks.length}
        </span>
      </div>
      <div className="kanban-column-content">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.status.id !== nextProps.status.id) return false;
  if (prevProps.tasks.length !== nextProps.tasks.length) return false;
  for (let i = 0; i < prevProps.tasks.length; i++) {
    if (prevProps.tasks[i].id !== nextProps.tasks[i].id) return false;
    if (prevProps.tasks[i].updatedAt !== nextProps.tasks[i].updatedAt) return false;
    if (prevProps.tasks[i].statusId !== nextProps.tasks[i].statusId) return false;
  }
  return true;
});

export default function KanbanBoard() {
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());
  
  // Only fetch tasks if we know what the active sprint is
  const activeSprint = sprints?.find(s => s.status === 'active');
  const tasks = useLiveQuery(
    () => activeSprint 
      ? db.tasks.filter(t => t.sprintId === activeSprint.id).toArray()
      : Promise.resolve([] as Task[])
    , [activeSprint]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (!statuses || !sprints || (activeSprint && !tasks)) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isOverColumn = over.data.current?.type === 'Column';

    let newStatusId;

    if (isOverColumn) {
      newStatusId = overId;
    } else {
      const overTask = (tasks || []).find(t => t.id === overId);
      if (overTask) newStatusId = overTask.statusId;
    }

    if (newStatusId) {
      const task = (tasks || []).find(t => t.id === activeId);
      const updateData: any = { statusId: newStatusId };
      
      // Automatically set start date when moved to in progress
      if (newStatusId === 'in_progress' && task?.statusId !== 'in_progress') {
        if (!task?.startDate) updateData.startDate = Date.now();
      }
      
      await db.tasks.update(activeId, updateData);
    }
  };

  return (
    <div style={{ padding: '32px 40px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)', overflowX: 'auto' }}>
      
      {!activeSprint ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>No active sprint</h2>
          <p style={{ marginBottom: '16px' }}>Start a sprint in the Backlog to see your tasks here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: undefined }))}
              className="btn btn-primary"
            >
              Create issue
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {statuses?.map((status) => {
                const columnTasks = (tasks || []).filter((t) => t.statusId === status.id);
                return (
                  <KanbanColumn
                    key={status.id}
                    status={status}
                    tasks={columnTasks}
                  />
                );
              })}
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
}
