import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Task } from '../db/db';
import CreateSprintModal from '../components/CreateSprintModal';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// A single task row in the backlog
function BacklogTaskRow({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: 'var(--n0)',
    border: '1px solid var(--border-color)',
    padding: '8px 12px',
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onDoubleClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TSK-{task.id.substring(0, 4)}</span>
        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{task.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`priority-icon ${task.priority === 'urgent' ? 'highest' : task.priority}`}></span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '24px', textAlign: 'right' }}>
          {task.duration ? `${task.duration}d` : ''}
        </span>
      </div>
    </div>
  );
}

// A generic drop zone list for a Sprint or Backlog
function TaskList({ id, title, goal, tasks, onStartSprint }: { id: string, title: string, goal?: string, tasks: Task[], onStartSprint?: () => void }) {
  const { setNodeRef } = useDroppable({
    id: id,
    data: { type: 'List', id }
  });

  return (
    <div ref={setNodeRef} style={{ marginBottom: '24px', backgroundColor: 'var(--n10)', padding: '16px', borderRadius: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: goal ? '8px' : '16px' }}>
        <h3 style={{ margin: 0, textTransform: 'none', color: 'var(--n800)', fontSize: '16px' }}>
          {title} <span style={{ color: 'var(--n100)', fontSize: '14px', marginLeft: '8px' }}>({tasks.length} issues)</span>
        </h3>
        {onStartSprint && tasks.length > 0 && (
          <button onClick={onStartSprint} className="btn btn-secondary">Start sprint</button>
        )}
      </div>
      {goal && (
        <div style={{ fontSize: '13px', color: 'var(--n500)', marginBottom: '16px', fontStyle: 'italic' }}>
          🎯 Goal: {goal}
        </div>
      )}
      <div style={{ minHeight: '40px' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <BacklogTaskRow key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
              Plan your sprint by dragging issues here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Backlog() {
  const tasks = useLiveQuery(() => db.tasks.orderBy('order').toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());

  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (!tasks || !sprints) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleCreateSprint = () => {
    setIsCreatingSprint(true);
  };

  const handleStartSprint = async (sprintId: string) => {
    // Only one active sprint at a time in simplified Jira
    const activeSprint = sprints.find(s => s.status === 'active');
    if (activeSprint) {
      alert("You already have an active sprint. Please complete it first.");
      return;
    }
    await db.sprints.update(sprintId, { status: 'active', startDate: Date.now() });
  };

  const handleCompleteSprint = async (sprintId: string) => {
    const activeTasks = tasks.filter(t => t.sprintId === sprintId);
    
    // Move unfinished tasks back to backlog
    const unfinished = activeTasks.filter(t => t.statusId !== 'done');
    for (const t of unfinished) {
      await db.tasks.update(t.id, { sprintId: undefined });
    }

    await db.sprints.update(sprintId, { status: 'completed', endDate: Date.now() });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const overData = over.data.current;
    
    // Determine the target sprint ID
    let newSprintId: string | undefined = undefined;
    
    if (overData?.type === 'List') {
      newSprintId = overId === 'backlog' ? undefined : (overId as string);
    } else if (overData?.type === 'Task') {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newSprintId = overTask.sprintId;
      }
    }

    // Update the task in DB
    const activeTask = tasks.find(t => t.id === activeId);
    if (activeTask && activeTask.sprintId !== newSprintId) {
      // we store sprintId as string | undefined, but dexie uses undefined for missing props
      // to remove sprintId we can just update it to undefined or delete it.
      await db.tasks.update(activeId as string, { sprintId: newSprintId });
    }
  };

  const activeSprint = sprints.find(s => s.status === 'active');
  const plannedSprints = sprints.filter(s => s.status === 'planned');
  const backlogTasks = tasks.filter(t => !t.sprintId);

  return (
    <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-board)' }}>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        {/* Active Sprint */}
        {activeSprint && (
          <div style={{ position: 'relative' }}>
            <TaskList 
              id={activeSprint.id} 
              title={`${activeSprint.name} (Active)`} 
              goal={activeSprint.goal}
              tasks={tasks.filter(t => t.sprintId === activeSprint.id)} 
            />
            <div style={{ position: 'absolute', top: '12px', right: '16px' }}>
              <button onClick={() => handleCompleteSprint(activeSprint.id)} className="btn btn-secondary" style={{ backgroundColor: 'var(--n20)' }}>Complete sprint</button>
            </div>
          </div>
        )}

        {/* Planned Sprints */}
        {plannedSprints.map(sprint => (
          <TaskList 
            key={sprint.id}
            id={sprint.id} 
            title={sprint.name} 
            goal={sprint.goal}
            tasks={tasks.filter(t => t.sprintId === sprint.id)} 
            onStartSprint={() => handleStartSprint(sprint.id)}
          />
        ))}

        {/* Backlog */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, textTransform: 'none', color: 'var(--n800)', fontSize: '16px' }}>
              Backlog <span style={{ color: 'var(--n100)', fontSize: '14px', marginLeft: '8px' }}>({backlogTasks.length} issues)</span>
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: undefined }))}
                className="btn btn-primary"
              >
                Create issue
              </button>
              <button onClick={handleCreateSprint} className="btn btn-secondary">Create sprint</button>
            </div>
          </div>
          <TaskList 
            id="backlog" 
            title="Backlog" 
            tasks={backlogTasks} 
          />
        </div>
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
