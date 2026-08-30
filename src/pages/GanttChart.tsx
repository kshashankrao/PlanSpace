import React, { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const DAY_WIDTH = 40;
const LEFT_PANE_WIDTH = 400;

export default function GanttChart() {
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const statuses = useLiveQuery(() => db.statuses.toArray());

  const rightHeaderRef = useRef<HTMLDivElement>(null);

  if (!sprints || !tasks || !statuses) return <div style={{ padding: '24px' }}>Loading...</div>;

  const activeSprint = sprints.find(s => s.status === 'active');

  if (!activeSprint) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--n800)' }}>No Active Sprint</h2>
        <p>Start a sprint to view the Gantt chart.</p>
      </div>
    );
  }

  const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id).sort((a, b) => {
    if (a.startDate && b.startDate) return a.startDate - b.startDate;
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return a.order - b.order;
  });

  const sprintStartMs = activeSprint.startDate || Date.now();
  const durationDays = activeSprint.durationDays || 14;
  const msPerDay = 1000 * 60 * 60 * 24;

  const days = Array.from({ length: durationDays }, (_, i) => {
    const date = new Date(sprintStartMs + i * msPerDay);
    return {
      index: i,
      date,
      monthStr: date.toLocaleString('default', { month: 'short' }),
      dayNum: date.getDate()
    };
  });

  const months: { name: string, colSpan: number }[] = [];
  days.forEach(day => {
    const lastMonth = months[months.length - 1];
    if (lastMonth && lastMonth.name === day.monthStr) {
      lastMonth.colSpan += 1;
    } else {
      months.push({ name: day.monthStr, colSpan: 1 });
    }
  });

  const formatDate = (ms?: number) => {
    if (!ms) return '-';
    const d = new Date(ms);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleRightBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (rightHeaderRef.current) {
      rightHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-board)', padding: '24px 32px', overflow: 'hidden' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: 'var(--n800)', flexShrink: 0 }}>
        Gantt Chart
      </h2>

      {/* Main Gantt Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--n0)', 
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-dropdown)'
      }}>
        
        {/* UNIFIED HEADER ROW */}
        <div style={{ display: 'flex', height: HEADER_HEIGHT, backgroundColor: 'var(--n10)', borderBottom: '1px solid var(--n40)', flexShrink: 0 }}>
          {/* Left Header */}
          <div style={{ width: LEFT_PANE_WIDTH, borderRight: '2px solid var(--n40)', display: 'flex', fontWeight: 600, fontSize: '12px', color: 'var(--n600)', alignItems: 'flex-end', paddingBottom: '8px', flexShrink: 0 }}>
            <div style={{ flex: 1, padding: '0 16px' }}>Task Name</div>
            <div style={{ width: '80px', padding: '0 8px' }}>Start</div>
            <div style={{ width: '60px', padding: '0 16px 0 8px', textAlign: 'right' }}>Dur</div>
          </div>
          {/* Right Header */}
          <div ref={rightHeaderRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
             <div style={{ minWidth: durationDays * DAY_WIDTH, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Top Tier (Months) */}
                <div style={{ display: 'flex', height: '24px', borderBottom: '1px solid var(--n30)' }}>
                  {months.map((m, i) => (
                    <div key={i} style={{ width: m.colSpan * DAY_WIDTH, borderRight: '1px solid var(--n30)', paddingLeft: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--n600)', display: 'flex', alignItems: 'center' }}>
                      {m.name}
                    </div>
                  ))}
                </div>
                {/* Bottom Tier (Days) */}
                <div style={{ display: 'flex', height: '36px' }}>
                  {days.map(day => (
                    <div key={day.index} style={{ width: DAY_WIDTH, borderRight: '1px solid var(--n30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {day.dayNum}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* UNIFIED BODY ROW */}
        <div style={{ flex: 1, display: 'flex', overflowY: 'auto' }}>
          {/* Left Body */}
          <div style={{ width: LEFT_PANE_WIDTH, borderRight: '2px solid var(--n40)', flexShrink: 0 }}>
            {sprintTasks.map((task, i) => (
              <div 
                key={task.id}
                onDoubleClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
                style={{
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--n30)',
                  fontSize: '13px',
                  backgroundColor: i % 2 === 0 ? 'var(--n0)' : 'var(--n10)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ flex: 1, padding: '0 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--n800)', fontWeight: 500 }}>
                  {task.title}
                </div>
                <div style={{ width: '80px', padding: '0 8px', color: 'var(--text-secondary)' }}>
                  {formatDate(task.startDate)}
                </div>
                <div style={{ width: '60px', padding: '0 16px 0 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {task.duration ? `${task.duration}d` : '-'}
                </div>
              </div>
            ))}
          </div>

          {/* Right Body */}
          <div style={{ flex: 1, overflowX: 'auto' }} onScroll={handleRightBodyScroll}>
            <div style={{ minWidth: durationDays * DAY_WIDTH, position: 'relative' }}>
              {/* Vertical Grid Lines Background */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
                {days.map(day => (
                  <div key={day.index} style={{ width: DAY_WIDTH, borderRight: '1px dashed var(--n30)', height: '100%' }} />
                ))}
              </div>

              {/* Task Rows */}
              {sprintTasks.map((task, i) => {
                let bar = null;
                if (task.startDate && task.duration) {
                  const startDiffMs = task.startDate - sprintStartMs;
                  let startDay = Math.floor(startDiffMs / msPerDay);
                  
                  let clampedStart = startDay;
                  let clampedDuration = task.duration;
                  
                  if (clampedStart < 0) {
                    clampedDuration += clampedStart;
                    clampedStart = 0;
                  }
                  
                  if (clampedStart < durationDays && clampedDuration > 0) {
                    if (clampedStart + clampedDuration > durationDays) {
                      clampedDuration = durationDays - clampedStart;
                    }

                    const isDone = task.statusId === 'done';
                    
                    bar = (
                      <div style={{ 
                        position: 'absolute',
                        left: clampedStart * DAY_WIDTH + 4,
                        width: (clampedDuration * DAY_WIDTH) - 8,
                        top: 8,
                        height: 24,
                        backgroundColor: isDone ? 'var(--success-color, #00875a)' : 'var(--b400)',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        overflow: 'hidden',
                        opacity: isDone ? 0.6 : 1,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}>
                        <span style={{ fontSize: '11px', color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {isDone ? 'Done' : `${Math.round(task.duration)}d`}
                        </span>
                      </div>
                    );
                  }
                }

                return (
                  <div key={task.id} style={{ height: ROW_HEIGHT, position: 'relative', borderBottom: '1px solid var(--n30)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                    {bar}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
