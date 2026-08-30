import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import CreateSprintModal from '../components/CreateSprintModal';
import { ArrowLeft } from 'lucide-react';

export default function SprintDetails() {
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const statuses = useLiveQuery(() => db.statuses.toArray());
  const navigate = useNavigate();

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  if (!sprints || !tasks || !statuses) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleSprintCreated = () => {
    setIsCreatingSprint(false);
    navigate('/planning/backlog'); // Redirect to backlog to add tasks
  };

  const renderSprintList = () => {
    // Sort sprints: active first, then planned, then completed (newest first)
    const sortedSprints = [...sprints].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.status === 'planned' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status === 'planned') return 1;
      return b.createdAt - a.createdAt;
    });

    return (
      <div style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--n800)' }}>All Sprints</h2>
          <button onClick={() => setIsCreatingSprint(true)} className="btn btn-primary">
            Create Sprint
          </button>
        </div>

        {sortedSprints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No sprints found. Create one to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedSprints.map(sprint => (
              <div 
                key={sprint.id}
                onClick={() => setSelectedSprintId(sprint.id)}
                style={{ 
                  backgroundColor: 'var(--n0)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--n10)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--n0)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, color: 'var(--n800)', fontSize: '16px' }}>{sprint.name}</h3>
                    {sprint.status === 'active' && (
                      <span style={{ backgroundColor: 'var(--b50)', color: 'var(--b400)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Active
                      </span>
                    )}
                    {sprint.status === 'completed' && (
                      <span style={{ backgroundColor: 'var(--n20)', color: 'var(--n500)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Completed
                      </span>
                    )}
                    {sprint.status === 'planned' && (
                      <span style={{ backgroundColor: 'var(--n20)', color: 'var(--n500)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Planned
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {sprint.durationDays ? `${sprint.durationDays} days` : 'Custom duration'} • {tasks.filter(t => t.sprintId === sprint.id).length} issues
                  </div>
                </div>
                <div style={{ color: 'var(--b400)', fontWeight: 500, fontSize: '14px' }}>
                  View details →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSprintDetail = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      setSelectedSprintId(null);
      return null;
    }

    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id).sort((a, b) => a.order - b.order);
    const totalTasks = sprintTasks.length;
    const todoTasks = sprintTasks.filter(t => t.statusId === 'todo').length;
    const inProgressTasks = sprintTasks.filter(t => t.statusId === 'in_progress').length;
    const doneTasks = sprintTasks.filter(t => t.statusId === 'done').length;

    const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    let daysInfo = 'Custom Duration';
    if (sprint.durationDays && sprint.startDate) {
      const elapsedMs = Date.now() - sprint.startDate;
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      
      if (sprint.status === 'completed') {
        daysInfo = `Completed in ${elapsedDays} days`;
      } else {
        const remainingDays = Math.max(0, sprint.durationDays - elapsedDays);
        daysInfo = `${remainingDays} days remaining of ${sprint.durationDays}`;
      }
    }

    return (
      <div style={{ maxWidth: '1000px' }}>
        <button 
          onClick={() => setSelectedSprintId(null)} 
          className="btn btn-ghost"
          style={{ marginBottom: '24px', padding: '4px 8px', marginLeft: '-8px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Sprints
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--n800)' }}>{sprint.name}</h2>
          {sprint.status === 'active' && (
            <span style={{ backgroundColor: 'var(--b50)', color: 'var(--b400)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Active
            </span>
          )}
          {sprint.status === 'completed' && (
            <span style={{ backgroundColor: 'var(--success-color, #00875a)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Completed
            </span>
          )}
        </div>

        {/* Analytics Section */}
        <div style={{ backgroundColor: 'var(--n0)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--n800)' }}>Sprint Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--n800)' }}>{progressPercent}% Complete</span>
          </div>
          <div style={{ width: '100%', height: '16px', backgroundColor: 'var(--n20)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              backgroundColor: 'var(--success-color, #00875a)', 
              transition: 'width 0.5s ease-in-out' 
            }} />
          </div>
          <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'right' }}>
            {daysInfo}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'var(--n0)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{todoTasks}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>To Do</div>
          </div>
          <div style={{ backgroundColor: 'var(--n0)', padding: '24px', borderRadius: '8px', border: '1px solid var(--b300)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--b400)' }}>{inProgressTasks}</div>
            <div style={{ color: 'var(--b400)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>In Progress</div>
          </div>
          <div style={{ backgroundColor: 'var(--n0)', padding: '24px', borderRadius: '8px', border: '1px solid var(--success-color, #00875a)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success-color, #00875a)' }}>{doneTasks}</div>
            <div style={{ color: 'var(--success-color, #00875a)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Done</div>
          </div>
        </div>

        {/* Task List Section */}
        <h3 style={{ fontSize: '18px', color: 'var(--n800)', marginBottom: '16px' }}>Sprint Tasks</h3>
        {sprintTasks.length === 0 ? (
          <div style={{ padding: '24px', backgroundColor: 'var(--n0)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>
            No tasks in this sprint.
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--n0)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {sprintTasks.map((task, index) => {
              const status = statuses.find(s => s.id === task.statusId);
              return (
                <div 
                  key={task.id} 
                  onDoubleClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
                  style={{ 
                    padding: '16px', 
                    borderBottom: index < sprintTasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>TSK</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--n800)', fontWeight: 500, fontSize: '14px', textDecoration: task.statusId === 'done' ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                  </div>
                  <div style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--n20)', fontSize: '12px', color: 'var(--n600)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {status?.title || 'Unknown'}
                  </div>
                  <div style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: task.priority === 'urgent' ? '#FFEBE6' : 'var(--n20)', color: task.priority === 'urgent' ? '#BF2600' : 'var(--n600)', fontSize: '12px', textTransform: 'capitalize' }}>
                    {task.priority}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto' }}>
      {selectedSprintId ? renderSprintDetail(selectedSprintId) : renderSprintList()}

      {isCreatingSprint && (
        <CreateSprintModal 
          defaultName={`Sprint ${sprints.length + 1}`} 
          onClose={() => setIsCreatingSprint(false)}
          onSuccess={handleSprintCreated}
        />
      )}
    </div>
  );
}
