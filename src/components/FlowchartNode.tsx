import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Plus, SquareCheckBig, CheckSquare, PencilLine } from 'lucide-react';
import { db } from '../db/db';

function getDefaultLabel(shape: string): string {
  switch (shape) {
    case 'diamond': return 'Decision?';
    case 'oval': return 'Start / End';
    case 'cylinder': return 'Database';
    default: return 'Process';
  }
}

function BidirectionalHandles() {
  const handleStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    background: 'var(--b400)',
    border: '1.5px solid var(--n0)',
  };
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyle} />
    </>
  );
}

export default function FlowchartNode({ id, data, selected }: NodeProps) {
  const shape = (data.shape as string) || 'rectangle';
  const [isEditing, setIsEditing] = useState(Boolean(data.isNew || data.label === ''));
  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState((data.label as string) || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (data.label !== undefined && !isEditing) {
      setLabel(data.label as string);
    }
  }, [data.label, isEditing]);

  useEffect(() => {
    if (data.isNew || data.label === '') {
      setIsEditing(true);
    }
  }, [data.isNew, data.label]);

  useEffect(() => {
    const handleEditStart = (e: any) => {
      if (e.detail.id === id) {
        setIsEditing(true);
      }
    };
    window.addEventListener('start-flowchart-node-edit', handleEditStart);
    return () => window.removeEventListener('start-flowchart-node-edit', handleEditStart);
  }, [id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const saveLabel = async () => {
    setIsEditing(false);
    const finalLabel = label.trim() || getDefaultLabel(shape);
    setLabel(finalLabel);
    if (finalLabel !== data.label) {
      await db.flowchartNodes.update(id, { label: finalLabel });
      if (data.taskId) {
        await db.tasks.update(data.taskId as string, { title: finalLabel, updatedAt: Date.now() });
      }
      window.dispatchEvent(new CustomEvent('flowchart-node-updated'));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await saveLabel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      await saveLabel();
      window.dispatchEvent(new CustomEvent('flowchart-add-next', { detail: { sourceId: id } }));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      const fallback = (data.label as string)?.trim() || getDefaultLabel(shape);
      setLabel(fallback);
      if (!data.label) {
        await db.flowchartNodes.update(id, { label: fallback });
      }
    }
  };

  const convertToTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) return;

    const activeSprint = await db.sprints.where('status').equals('active').first();
    const taskTitle = label.trim() || getDefaultLabel(shape);
    const newTask = {
      id: crypto.randomUUID(),
      title: taskTitle,
      description: 'Created from Flowchart step.',
      statusId: 'todo',
      priority: 'medium' as const,
      sprintId: activeSprint?.id,
      startDate: Date.now(),
      duration: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
      flowchartNodeId: id,
    };

    await db.tasks.add(newTask);
    await db.flowchartNodes.update(id, { taskId: newTask.id, label: taskTitle });
    window.dispatchEvent(new CustomEvent('flowchart-node-updated'));
  };

  const openTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) {
      db.tasks.get(data.taskId as string).then(task => {
        if (task) window.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
      });
    }
  };

  const handleAddNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('flowchart-add-next', { detail: { sourceId: id } }));
  };

  const showActions = selected || isHovered;

  const textStyle: React.CSSProperties = {
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--n800)',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    width: '100%',
    lineHeight: 1.35,
  };

  const textareaStyle: React.CSSProperties = {
    ...textStyle,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: 'inherit',
    margin: 0,
    padding: 0,
  };

  // Floating quick action bar above node when hovered/selected
  const actionToolbar = showActions && !isEditing && (
    <div
      className="nodrag"
      style={{
        position: 'absolute',
        top: '-28px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        backgroundColor: 'var(--n0)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '2px 4px',
        boxShadow: 'var(--shadow-card)',
        zIndex: 10,
        whiteSpace: 'nowrap',
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        title="Edit text (Double-Click)"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n600)', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
      >
        <PencilLine size={12} />
      </button>
      {data.taskId ? (
        <button
          type="button"
          onClick={openTask}
          title="Open Linked Task"
          style={{ background: 'var(--b50)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--b500)', padding: '2px 5px', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          <SquareCheckBig size={11} /> Task
        </button>
      ) : (
        <button
          type="button"
          onClick={convertToTask}
          title="Convert step to Task"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--b400)', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
        >
          <CheckSquare size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={handleAddNext}
        title="Add connected step (Tab)"
        style={{ background: 'var(--b400)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', padding: '2px 5px', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
      >
        <Plus size={11} /> Step
      </button>
    </div>
  );

  // Task badge in corner when not hovered
  const taskCornerBadge = Boolean(data.taskId) && !showActions && (
    <div
      onClick={openTask}
      title="Open Linked Task"
      className="nodrag"
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        backgroundColor: 'var(--b400)',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
        zIndex: 5,
      }}
    >
      <SquareCheckBig size={11} />
    </div>
  );

  if (shape === 'diamond') {
    const SIZE = 104;
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          width: 160,
          height: Math.round(SIZE * 1.42),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      >
        {actionToolbar}
        {taskCornerBadge}
        <div style={{
          width: SIZE,
          height: SIZE,
          transform: 'rotate(45deg)',
          backgroundColor: selected ? 'var(--b50)' : '#FFFDF5',
          border: selected ? '2.5px solid var(--b400)' : '2px solid var(--prio-high)',
          borderRadius: '6px',
          boxShadow: selected ? '0 0 0 4px rgba(0, 82, 204, 0.14)' : 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ transform: 'rotate(-45deg)', width: SIZE * 0.78, textAlign: 'center' }}>
            {isEditing ? (
              <textarea
                ref={inputRef}
                className="nodrag nopan"
                value={label}
                rows={1}
                placeholder="Decision?"
                onChange={handleTextareaChange}
                onBlur={saveLabel}
                onKeyDown={handleKeyDown}
                style={{ ...textareaStyle, width: '100%' }}
              />
            ) : (
              <div style={{ ...textStyle, width: '100%' }}>{label || 'Decision?'}</div>
            )}
          </div>
        </div>
        <BidirectionalHandles />
      </div>
    );
  }

  const shapeStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      width: '100%',
      backgroundColor: selected ? 'var(--b50)' : shape === 'oval' ? '#F3FBF7' : 'var(--n0)',
      border: selected
        ? '2.5px solid var(--b400)'
        : shape === 'oval'
          ? '2px solid var(--g400)'
          : '2px solid var(--b400)',
      boxShadow: selected ? '0 0 0 4px rgba(0, 82, 204, 0.14)' : 'var(--shadow-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    };
    switch (shape) {
      case 'oval':
        return { ...base, minHeight: 52, borderRadius: '999px', padding: '10px 20px' };
      case 'cylinder':
        return { ...base, minHeight: 72, borderRadius: '50% / 18%', padding: '18px 16px' };
      case 'rectangle':
      default:
        return { ...base, minHeight: 52, borderRadius: 'var(--radius)', padding: '10px 18px' };
    }
  })();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
      {actionToolbar}
      {taskCornerBadge}
      <div style={shapeStyle}>
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="nodrag nopan"
            value={label}
            rows={1}
            placeholder={getDefaultLabel(shape)}
            onChange={handleTextareaChange}
            onBlur={saveLabel}
            onKeyDown={handleKeyDown}
            style={textareaStyle}
          />
        ) : (
          <div style={textStyle}>{label || getDefaultLabel(shape)}</div>
        )}
      </div>
      <BidirectionalHandles />
    </div>
  );
}
