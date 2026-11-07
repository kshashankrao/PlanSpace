import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatTaskId } from '../db/db';
import type { Task } from '../db/db';
import CreateSprintModal from '../components/CreateSprintModal';
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
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';

function BacklogRowView({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const order = ['todo', 'in_progress', 'done'];
    const nextStatus = order[(order.indexOf(task.statusId) + 1) % order.length];
    const update: Partial<Task> = { statusId: nextStatus, updatedAt: Date.now() };
    if (nextStatus === 'in_progress' && !task.startDate) {
      update.startDate = Date.now();
    }
    await db.tasks.update(task.id, update);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--n0)',
        border: isOverlay ? '1.5px solid var(--b300)' : '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '9px 14px',
        marginBottom: isOverlay ? 0 : '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: isOverlay ? 'grabbing' : 'pointer',
        boxShadow: isOverlay ? 'var(--shadow-dropdown)' : 'none',
        transition: 'background-color 0.1s, border-color 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '56px' }}>
          {formatTaskId(task.id)}
        </span>
        <span
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontWeight: 500,
            textDecoration: task.statusId === 'done' ? 'line-through' : 'none',
            opacity: task.statusId === 'done' ? 0.75 : 1,
          }}
        >
          {task.title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={cycleStatus}
          title="Click to cycle status (To Do → In Progress → Done)"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor:
              task.statusId === 'done'
                ? 'var(--g50)'
                : task.statusId === 'in_progress'
                ? 'var(--b50)'
                : 'var(--n20)',
            color:
              task.statusId === 'done'
                ? 'var(--g500)'
                : task.statusId === 'in_progress'
                ? 'var(--b400)'
                : 'var(--n600)',
          }}
        >
          {task.statusId.replace('_', ' ')}
        </button>
        <span className={`priority-icon ${task.priority === 'urgent' ? 'highest' : task.priority}`}></span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '28px', textAlign: 'right' }}>
          {task.duration ? `${task.duration}d` : ''}
        </span>
      </div>
    </div>
  );
}

function BacklogTaskRow({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

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
      <BacklogRowView task={task} />
    </div>
  );
}

function TaskList({
  id,
  title,
  goal,
  tasks,
  headerActions,
  onQuickAdd,
}: {
  id: string;
  title: string;
  goal?: string;
  tasks: Task[];
  headerActions?: React.ReactNode;
  onQuickAdd: (sprintId: string | undefined, title: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'List', id },
  });

  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const t = quickTitle.trim();
    setQuickTitle('');
    await onQuickAdd(id === 'backlog' ? undefined : id, t);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        marginBottom: '20px',
        backgroundColor: 'var(--n10)',
        padding: '16px 20px',
        borderRadius: '8px',
        border: isOver ? '2px solid var(--b200)' : '1px solid var(--border-color)',
        transition: 'border-color 0.12s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: goal ? '4px' : '12px',
        }}
      >
        <h3 style={{ margin: 0, textTransform: 'none', color: 'var(--n800)', fontSize: '15px', fontWeight: 600 }}>
          {title}{' '}
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400, marginLeft: '6px' }}>
            ({tasks.length} {tasks.length === 1 ? 'issue' : 'issues'})
          </span>
        </h3>
        {headerActions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{headerActions}</div>}
      </div>
      {goal && (
        <div style={{ fontSize: '12.5px', color: 'var(--n600)', marginBottom: '12px' }}>
          Goal: {goal}
        </div>
      )}
      <div style={{ minHeight: '36px' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <BacklogTaskRow key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '6px',
              }}
            >
              Drag issues here or type below to add
            </div>
          )}
        </SortableContext>

        <form
          onSubmit={handleQuickSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            marginTop: '4px',
            borderRadius: '6px',
            backgroundColor: 'var(--n0)',
            border: '1px dashed var(--n40)',
          }}
        >
          <Plus size={14} color="var(--n400)" />
          <input
            type="text"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder={`Quick add issue to ${id === 'backlog' ? 'Backlog' : title.replace(' (Active)', '')} (Enter)...`}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              outline: 'none',
              color: 'var(--n800)',
              padding: '2px 0',
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default function Backlog() {
  const dbTasks = useLiveQuery(() => db.tasks.orderBy('order').toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());

  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  useEffect(() => {
    if (dbTasks && !activeTask) {
      setLocalTasks(dbTasks);
    }
  }, [dbTasks, activeTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (!dbTasks || !sprints) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleQuickAdd = async (sprintId: string | undefined, title: string) => {
    await db.tasks.add({
      id: crypto.randomUUID(),
      title,
      description: '',
      statusId: 'todo',
      sprintId,
      priority: 'medium',
      startDate: sprintId ? Date.now() : undefined,
      duration: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: localTasks.length,
    });
  };

  const handleStartSprint = async (sprintId: string) => {
    const activeSprint = sprints.find(s => s.status === 'active');
    if (activeSprint) {
      alert('You already have an active sprint. Please complete it first.');
      return;
    }
    await db.sprints.update(sprintId, { status: 'active', startDate: Date.now() });
  };

  const handleCompleteSprint = async (sprintId: string) => {
    const activeTasks = localTasks.filter(t => t.sprintId === sprintId);
    const unfinished = activeTasks.filter(t => t.statusId !== 'done');
    for (const t of unfinished) {
      await db.tasks.update(t.id, { sprintId: undefined });
    }
    await db.sprints.update(sprintId, { status: 'completed', endDate: Date.now() });
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

    const overData = over.data.current;
    const activeItem = localTasks.find(t => t.id === activeId);
    if (!activeItem) return;

    let targetSprintId: string | undefined = activeItem.sprintId;
    if (overData?.type === 'List') {
      targetSprintId = overId === 'backlog' ? undefined : overId;
    } else if (overData?.type === 'Task') {
      const overTask = localTasks.find(t => t.id === overId);
      if (overTask) targetSprintId = overTask.sprintId;
    }

    if (activeItem.sprintId !== targetSprintId) {
      setLocalTasks(prev => {
        const updated = prev.map(t => (t.id === activeId ? { ...t, sprintId: targetSprintId } : t));
        if (overData?.type === 'Task') {
          const oldIdx = updated.findIndex(t => t.id === activeId);
          const newIdx = updated.findIndex(t => t.id === overId);
          if (oldIdx !== -1 && newIdx !== -1) return arrayMove(updated, oldIdx, newIdx);
        }
        return updated;
      });
    } else if (overData?.type === 'Task') {
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

    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < localTasks.length; i++) {
        const item = localTasks[i];
        if (item.id === activeId) {
          await db.tasks.update(item.id, {
            sprintId: currentItem.sprintId,
            order: i,
            updatedAt: Date.now(),
          });
        } else if (item.order !== i) {
          await db.tasks.update(item.id, { order: i });
        }
      }
    });
  };

  const activeSprint = sprints.find(s => s.status === 'active');
  const plannedSprints = sprints.filter(s => s.status === 'planned');
  const backlogTasks = localTasks.filter(t => !t.sprintId);

  return (
    <div style={{ padding: '20px 32px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-board)' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Active Sprint */}
        {activeSprint && (
          <TaskList
            id={activeSprint.id}
            title={`${activeSprint.name} (Active)`}
            goal={activeSprint.goal}
            tasks={localTasks.filter(t => t.sprintId === activeSprint.id)}
            onQuickAdd={handleQuickAdd}
            headerActions={
              <>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: { defaultSprintId: activeSprint.id } }))}
                  className="btn btn-ghost"
                  style={{ fontSize: '13px' }}
                >
                  + Add issue
                </button>
                <button
                  onClick={() => handleCompleteSprint(activeSprint.id)}
                  className="btn btn-secondary"
                  style={{ backgroundColor: 'var(--n20)' }}
                >
                  Complete sprint
                </button>
              </>
            }
          />
        )}

        {/* Planned Sprints */}
        {plannedSprints.map(sprint => {
          const spTasks = localTasks.filter(t => t.sprintId === sprint.id);
          return (
            <TaskList
              key={sprint.id}
              id={sprint.id}
              title={sprint.name}
              goal={sprint.goal}
              tasks={spTasks}
              onQuickAdd={handleQuickAdd}
              headerActions={
                spTasks.length > 0 ? (
                  <button onClick={() => handleStartSprint(sprint.id)} className="btn btn-secondary">
                    Start sprint
                  </button>
                ) : undefined
              }
            />
          );
        })}

        {/* Backlog */}
        <TaskList
          id="backlog"
          title="Backlog"
          tasks={backlogTasks}
          onQuickAdd={handleQuickAdd}
          headerActions={
            <>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: undefined }))}
                className="btn btn-primary"
              >
                <Plus size={15} /> Create issue
              </button>
              <button onClick={() => setIsCreatingSprint(true)} className="btn btn-secondary">
                Create sprint
              </button>
            </>
          }
        />

        <DragOverlay>
          {activeTask ? <BacklogRowView task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {isCreatingSprint && (
        <CreateSprintModal
          defaultName={`Sprint ${sprints.length + 1}`}
          onClose={() => setIsCreatingSprint(false)}
        />
      )}
    </div>
  );
}
