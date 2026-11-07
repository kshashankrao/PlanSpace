import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Plus, SquareCheckBig, PencilLine, CheckSquare } from 'lucide-react';
import { db } from '../db/db';

export default function MindMapNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(Boolean(data.isNew || data.label === ''));
  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState((data.label as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

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
    window.addEventListener('start-node-edit', handleEditStart);
    return () => window.removeEventListener('start-node-edit', handleEditStart);
  }, [id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const saveLabel = async () => {
    setIsEditing(false);
    const finalLabel = label.trim() || 'New Idea';
    setLabel(finalLabel);
    if (finalLabel !== data.label) {
      await db.mindMapNodes.update(id, { label: finalLabel });
      if (data.taskId) {
        await db.tasks.update(data.taskId as string, { title: finalLabel, updatedAt: Date.now() });
      }
      window.dispatchEvent(new CustomEvent('node-updated'));
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      await saveLabel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      await saveLabel();
      window.dispatchEvent(new CustomEvent('mindmap-add-child', { detail: { parentId: id } }));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      const fallback = (data.label as string)?.trim() || 'New Idea';
      setLabel(fallback);
      if (!data.label) {
        await db.mindMapNodes.update(id, { label: fallback });
      }
    }
  };

  const convertToTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) return;

    const activeSprint = await db.sprints.where('status').equals('active').first();
    const taskTitle = label.trim() || 'New Idea';
    const newTask = {
      id: crypto.randomUUID(),
      title: taskTitle,
      description: 'Created from Mind Map node.',
      statusId: 'todo',
      priority: 'medium' as const,
      sprintId: activeSprint?.id,
      startDate: Date.now(),
      duration: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
      mindmapNodeId: id
    };

    await db.tasks.add(newTask);
    await db.mindMapNodes.update(id, { taskId: newTask.id, label: taskTitle });
    window.dispatchEvent(new CustomEvent('node-updated'));
  };

  const openTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) {
      db.tasks.get(data.taskId as string).then(task => {
        if (task) window.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
      });
    }
  };

  const handleQuickAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('mindmap-add-child', { detail: { parentId: id } }));
  };

  const isRoot = id.startsWith('root') || id === 'node-root';
  const showActions = selected || isHovered;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: isRoot ? '12px 22px' : '9px 16px',
        background: selected ? 'var(--b50)' : isRoot ? '#F0F6FF' : 'var(--n0)',
        border: selected
          ? '2px solid var(--b400)'
          : isRoot
            ? '2px solid var(--b300)'
            : '1.5px solid var(--n200)',
        borderRadius: isRoot ? '14px' : '24px',
        boxShadow: selected ? '0 0 0 4px rgba(0, 82, 204, 0.14)' : 'var(--shadow-card)',
        minWidth: isRoot ? '140px' : '100px',
        maxWidth: '300px',
        textAlign: 'center',
        position: 'relative',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="mindmap-node"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: showActions ? 'var(--b400)' : 'var(--n200)',
          width: '7px',
          height: '7px',
          border: '1.5px solid var(--n0)',
          opacity: isRoot && !showActions ? 0 : 1,
        }}
      />

      {/* Task Link Indicator or Quick Actions */}
      {data.taskId ? (
        <button
          type="button"
          onClick={openTask}
          title="Open Linked Task"
          className="nodrag"
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--b500)',
            backgroundColor: 'var(--b100)',
            border: 'none',
            borderRadius: '6px',
            padding: '2px 5px',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          <SquareCheckBig size={12} /> Task
        </button>
      ) : (
        showActions && !isEditing && (
          <div className="nodrag" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              title="Rename (F2)"
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--n500)', background: 'transparent', border: 'none',
                borderRadius: '4px', width: '20px', height: '20px', padding: 0
              }}
            >
              <PencilLine size={12} />
            </button>
            <button
              type="button"
              onClick={convertToTask}
              title="Convert to Task"
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--b400)', background: 'transparent', border: 'none',
                borderRadius: '4px', width: '20px', height: '20px', padding: 0
              }}
            >
              <CheckSquare size={12} />
            </button>
          </div>
        )
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          className="nodrag nopan"
          value={label}
          placeholder="Type idea..."
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            width: `${Math.max(8, label.length + 2)}ch`,
            minWidth: '80px',
            maxWidth: '240px',
            fontFamily: 'inherit',
            fontSize: isRoot ? '15px' : '13.5px',
            fontWeight: isRoot ? 600 : 500,
            color: 'var(--n800)',
            padding: 0
          }}
        />
      ) : (
        <div style={{
          color: 'var(--n800)',
          fontSize: isRoot ? '15px' : '13.5px',
          fontWeight: isRoot ? 600 : 500,
          userSelect: 'none',
          wordBreak: 'break-word',
          flex: 1,
          lineHeight: 1.35
        }}>
          {label || 'New Idea'}
        </div>
      )}

      {/* Quick-add Child (+) button on right side */}
      {showActions && !isEditing && (
        <button
          type="button"
          onClick={handleQuickAddChild}
          title="Add Child Idea (Tab)"
          className="nodrag"
          style={{
            position: 'absolute',
            right: '-13px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: 'var(--b400)',
            color: 'white',
            border: '2px solid var(--n0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            zIndex: 5,
            padding: 0
          }}
        >
          <Plus size={12} />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: showActions ? 'var(--b400)' : 'var(--n200)',
          width: '7px',
          height: '7px',
          border: '1.5px solid var(--n0)',
        }}
      />
    </div>
  );
}
