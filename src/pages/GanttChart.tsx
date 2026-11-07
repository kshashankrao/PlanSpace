import React, { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatTaskId } from '../db/db';
import type { Task } from '../db/db';
import { Plus } from 'lucide-react';

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 60;
const DAY_WIDTH = 48;
const LEFT_PANE_WIDTH = 420;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface DragState {
  taskId: string;
  mode: 'move' | 'resize';
  startX: number;
  initialStartDay: number;
  initialDuration: number;
  currentStartDay: number;
  currentDuration: number;
  hasMoved: boolean;
}

export default function GanttChart() {
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const statuses = useLiveQuery(() => db.statuses.toArray());

  const rightHeaderRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const activeSprint = sprints?.find(s => s.status === 'active');
  const sprintStartMs = activeSprint?.startDate || Date.now();
  const durationDays = activeSprint?.durationDays || 14;

  // Handle interactive bar drag & resize across the window
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      const dayDelta = Math.round(dx / DAY_WIDTH);
      const hasMoved = dragState.hasMoved || Math.abs(dx) > 4;

      if (dragState.mode === 'move') {
        const nextStart = Math.max(0, Math.min(durationDays - 1, dragState.initialStartDay + dayDelta));
        setDragState(prev => (prev ? { ...prev, currentStartDay: nextStart, hasMoved } : null));
      } else {
        const nextDur = Math.max(1, Math.min(durationDays - dragState.initialStartDay, dragState.initialDuration + dayDelta));
        setDragState(prev => (prev ? { ...prev, currentDuration: nextDur, hasMoved } : null));
      }
    };

    const handleMouseUp = async () => {
      const current = dragState;
      setDragState(null);
      if (!current) return;

      if (!current.hasMoved) {
        // Treat as a single click -> open TaskModal
        const clickedTask = tasks?.find(t => t.id === current.taskId);
        if (clickedTask) {
          window.dispatchEvent(new CustomEvent('edit-task', { detail: clickedTask }));
        }
        return;
      }

      const newStartDate = sprintStartMs + current.currentStartDay * MS_PER_DAY;
      await db.tasks.update(current.taskId, {
        startDate: newStartDate,
        duration: current.currentDuration,
        updatedAt: Date.now(),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, durationDays, sprintStartMs, tasks]);

  if (!sprints || !tasks || !statuses) return <div style={{ padding: '24px' }}>Loading...</div>;

  if (!activeSprint) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--n800)' }}>No Active Sprint</h2>
        <p>Start a sprint to view the Gantt chart.</p>
      </div>
    );
  }

  const sprintTasks = tasks
    .filter(t => t.sprintId === activeSprint.id)
    .sort((a, b) => {
      const aStart = a.startDate ?? a.createdAt ?? sprintStartMs;
      const bStart = b.startDate ?? b.createdAt ?? sprintStartMs;
      if (aStart !== bStart) return aStart - bStart;
      return a.order - b.order;
    });

  const todayMs = Date.now();
  const todayDayIndex = Math.floor((todayMs - sprintStartMs) / MS_PER_DAY);

  const days = Array.from({ length: durationDays }, (_, i) => {
    const date = new Date(sprintStartMs + i * MS_PER_DAY);
    return {
      index: i,
      date,
      monthStr: date.toLocaleString('default', { month: 'short' }),
      dayNum: date.getDate(),
      isToday: i === todayDayIndex,
    };
  });

  const months: { name: string; colSpan: number }[] = [];
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

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await db.tasks.add({
      id: crypto.randomUUID(),
      title: quickTitle.trim(),
      description: '',
      statusId: 'todo',
      priority: 'medium',
      sprintId: activeSprint.id,
      startDate: Date.now(),
      duration: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: sprintTasks.length,
    });
    setQuickTitle('');
  };

  const getTaskDayBounds = (task: Task) => {
    if (dragState && dragState.taskId === task.id) {
      return {
        startDay: dragState.currentStartDay,
        duration: dragState.currentDuration,
        effectiveStartMs: sprintStartMs + dragState.currentStartDay * MS_PER_DAY,
      };
    }

    const effectiveStart = task.startDate ?? task.createdAt ?? sprintStartMs;
    const effectiveDuration = task.duration || 1;
    const startDiffMs = effectiveStart - sprintStartMs;
    let clampedStart = Math.floor(startDiffMs / MS_PER_DAY);
    let clampedDuration = effectiveDuration;

    if (clampedStart < 0) {
      clampedDuration += clampedStart;
      clampedStart = 0;
    }
    if (clampedStart >= durationDays) {
      clampedStart = Math.max(0, durationDays - 1);
      clampedDuration = 1;
    } else if (clampedDuration <= 0) {
      clampedStart = 0;
      clampedDuration = 1;
    }
    if (clampedStart + clampedDuration > durationDays) {
      clampedDuration = durationDays - clampedStart;
    }

    return {
      startDay: clampedStart,
      duration: clampedDuration,
      effectiveStartMs: effectiveStart,
    };
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-board)',
        padding: '20px 32px',
        overflow: 'hidden',
        userSelect: dragState ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--n800)' }}>{activeSprint.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Drag any bar horizontally to reschedule • Drag its right edge to resize duration • Click to open details
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: { defaultSprintId: activeSprint.id } }))}
          className="btn btn-primary"
        >
          <Plus size={15} /> Create issue
        </button>
      </div>

      {/* Main Gantt Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--n0)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* UNIFIED HEADER ROW */}
        <div style={{ display: 'flex', height: HEADER_HEIGHT, backgroundColor: 'var(--n10)', borderBottom: '1px solid var(--n40)', flexShrink: 0 }}>
          {/* Left Header */}
          <div
            style={{
              width: LEFT_PANE_WIDTH,
              borderRight: '2px solid var(--n40)',
              display: 'flex',
              fontWeight: 600,
              fontSize: '12px',
              color: 'var(--n600)',
              alignItems: 'flex-end',
              paddingBottom: '8px',
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, padding: '0 16px' }}>Task</div>
            <div style={{ width: '76px', padding: '0 8px' }}>Start</div>
            <div style={{ width: '56px', padding: '0 16px 0 8px', textAlign: 'right' }}>Dur</div>
          </div>
          {/* Right Header */}
          <div ref={rightHeaderRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ minWidth: durationDays * DAY_WIDTH, display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Top Tier (Months) */}
              <div style={{ display: 'flex', height: '24px', borderBottom: '1px solid var(--n30)' }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      width: m.colSpan * DAY_WIDTH,
                      borderRight: '1px solid var(--n30)',
                      paddingLeft: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--n600)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
              {/* Bottom Tier (Days) */}
              <div style={{ display: 'flex', height: '36px' }}>
                {days.map(day => (
                  <div
                    key={day.index}
                    style={{
                      width: DAY_WIDTH,
                      borderRight: '1px solid var(--n30)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: day.isToday ? 'var(--b500)' : 'var(--text-secondary)',
                      backgroundColor: day.isToday ? 'var(--b50)' : 'transparent',
                      fontWeight: day.isToday ? 700 : 500,
                    }}
                  >
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
          <div style={{ width: LEFT_PANE_WIDTH, borderRight: '2px solid var(--n40)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {sprintTasks.map((task, i) => {
              const { duration, effectiveStartMs } = getTaskDayBounds(task);
              return (
                <div
                  key={task.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('edit-task', { detail: task }))}
                  style={{
                    height: ROW_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--n30)',
                    fontSize: '13px',
                    backgroundColor: i % 2 === 0 ? 'var(--n0)' : 'var(--n10)',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--b50)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'var(--n0)' : 'var(--n10)')}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: '0 16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--n800)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {formatTaskId(task.id)}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                  </div>
                  <div style={{ width: '76px', padding: '0 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {formatDate(effectiveStartMs)}
                  </div>
                  <div style={{ width: '56px', padding: '0 16px 0 8px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                    {duration}d
                  </div>
                </div>
              );
            })}

            {/* Inline Quick-Add Row at bottom of Gantt */}
            <form
              onSubmit={handleQuickAddTask}
              style={{
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                borderBottom: '1px solid var(--n30)',
                backgroundColor: 'var(--n0)',
              }}
            >
              <Plus size={14} color="var(--n400)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Quick add task to timeline (Enter)..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                  padding: '4px 0',
                  color: 'var(--n800)',
                }}
              />
            </form>
          </div>

          {/* Right Body */}
          <div style={{ flex: 1, overflowX: 'auto' }} onScroll={handleRightBodyScroll}>
            <div style={{ minWidth: durationDays * DAY_WIDTH, position: 'relative', minHeight: '100%' }}>
              {/* Vertical Grid Lines & Today Highlight */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
                {days.map(day => (
                  <div
                    key={day.index}
                    style={{
                      width: DAY_WIDTH,
                      borderRight: '1px dashed var(--n30)',
                      height: '100%',
                      backgroundColor: day.isToday ? 'rgba(0, 101, 255, 0.04)' : 'transparent',
                    }}
                  />
                ))}
              </div>

              {/* Task Rows */}
              {sprintTasks.map((task, i) => {
                const { startDay, duration } = getTaskDayBounds(task);
                const isDraggingThis = dragState?.taskId === task.id;
                const isDone = task.statusId === 'done';
                const isInProgress = task.statusId === 'in_progress';
                const barBg = isDone
                  ? 'var(--success-color, #00875a)'
                  : isInProgress
                  ? 'var(--b400)'
                  : 'var(--n400)';

                return (
                  <div
                    key={task.id}
                    style={{
                      height: ROW_HEIGHT,
                      position: 'relative',
                      borderBottom: '1px solid var(--n30)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                    }}
                  >
                    <div
                      onMouseDown={e => {
                        e.stopPropagation();
                        setDragState({
                          taskId: task.id,
                          mode: 'move',
                          startX: e.clientX,
                          initialStartDay: startDay,
                          initialDuration: duration,
                          currentStartDay: startDay,
                          currentDuration: duration,
                          hasMoved: false,
                        });
                      }}
                      style={{
                        position: 'absolute',
                        left: startDay * DAY_WIDTH + 4,
                        width: Math.max(28, duration * DAY_WIDTH - 8),
                        top: 9,
                        height: 26,
                        backgroundColor: barBg,
                        borderRadius: '13px',
                        boxShadow: isDraggingThis
                          ? '0 4px 12px rgba(0, 82, 204, 0.35)'
                          : '0 2px 4px rgba(9, 30, 66, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px',
                        overflow: 'hidden',
                        opacity: isDone ? 0.85 : 1,
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                        transition: isDraggingThis ? 'none' : 'left 0.12s ease, width 0.12s ease',
                        zIndex: isDraggingThis ? 10 : 1,
                      }}
                      title={`${task.title} (${duration}d) — Drag to reschedule, drag right edge to resize`}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'white',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          pointerEvents: 'none',
                        }}
                      >
                        {isDone ? `✓ Done (${duration}d)` : `${Math.round(duration)}d`}
                      </span>

                      {/* Right Resize Handle */}
                      <div
                        onMouseDown={e => {
                          e.stopPropagation();
                          setDragState({
                            taskId: task.id,
                            mode: 'resize',
                            startX: e.clientX,
                            initialStartDay: startDay,
                            initialDuration: duration,
                            currentStartDay: startDay,
                            currentDuration: duration,
                            hasMoved: false,
                          });
                        }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '10px',
                          cursor: 'ew-resize',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Drag to resize duration"
                      >
                        <div
                          style={{
                            width: '2px',
                            height: '10px',
                            backgroundColor: 'rgba(255,255,255,0.6)',
                            borderRadius: '1px',
                          }}
                        />
                      </div>
                    </div>
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
