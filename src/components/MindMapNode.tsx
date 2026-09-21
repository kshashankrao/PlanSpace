import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { PlusCircle, SquareCheckBig, PencilLine } from 'lucide-react';
import { db } from '../db/db';

export default function MindMapNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data.label as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.label !== undefined && !isEditing) {
      setLabel(data.label as string);
    }
  }, [data.label, isEditing]);

  useEffect(() => {
    if (data.isNew) {
      setIsEditing(true);
    }
  }, [data.isNew]);

  useEffect(() => {
    // Listen for custom edit event from the parent
    const handleEditStart = (e: any) => {
      if (e.detail.id === id) {
        setIsEditing(true);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 10);
      }
    };
    window.addEventListener('start-node-edit', handleEditStart);
    return () => window.removeEventListener('start-node-edit', handleEditStart);
  }, [id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing]);

  const saveLabel = async () => {
    setIsEditing(false);
    if (label.trim() !== data.label) {
      // Update local db
      await db.mindMapNodes.update(id, { label: label.trim() || 'New Node' });
      // Trigger a refresh event for the parent to re-sync
      window.dispatchEvent(new CustomEvent('node-updated'));
    } else {
      setLabel(data.label as string);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveLabel();
      e.stopPropagation(); // prevent adding a sibling while editing
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label as string);
      e.stopPropagation();
    }
  };

  const convertToTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) return; // already a task

    const newTask = {
      id: crypto.randomUUID(),
      title: label,
      description: '',
      statusId: 'todo',
      priority: 'medium' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: 0,
      mindmapNodeId: id
    };

    await db.tasks.add(newTask);
    await db.mindMapNodes.update(id, { taskId: newTask.id });
    window.dispatchEvent(new CustomEvent('node-updated'));
  };

  const openTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.taskId) {
      db.tasks.get(data.taskId).then(task => {
        if (task) window.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
      });
    }
  };

  const isRoot = id.startsWith('root');

  return (
    <div 
      style={{ 
        padding: isRoot ? '12px 24px' : '8px 16px', 
        background: selected ? 'var(--b50)' : 'var(--n0)', 
        border: selected ? '2px solid var(--b400)' : '1px solid var(--n400)',
        borderRadius: '50%',
        boxShadow: selected ? '0 0 0 4px rgba(0, 82, 204, 0.1)' : 'var(--shadow-card)',
        minWidth: isRoot ? '120px' : '80px',
        maxWidth: '300px',
        textAlign: 'center',
        position: 'relative',
        transition: 'all 0.1s ease',
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
      {!isRoot && (
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            background: 'transparent', 
            width: '1px', 
            height: '1px', 
            border: 'none', 
            left: 0
          }} 
        />
      )}

      {/* Task Link Indicator */}
      {data.taskId ? (
        <div 
          onClick={openTask}
          title="Open Linked Task"
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--b400)',
            backgroundColor: 'var(--b50)',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            flexShrink: 0
          }}
        >
          <SquareCheckBig size={12} />
        </div>
      ) : (
        <div style={{ display: selected && !isEditing ? 'flex' : 'none', gap: '4px' }}>
          <div 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Edit Node"
            className="convert-btn"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n100)', width: '18px', height: '18px' }}
          >
            <PencilLine size={12} />
          </div>
          <div 
            onClick={convertToTask}
            title="Convert to Task"
            className="convert-btn"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n100)', width: '18px', height: '18px' }}
          >
            <PlusCircle size={12} />
          </div>
        </div>
      )}
      
      {isEditing ? (
        <input
          ref={inputRef}
          className="nodrag nopan"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()} // Prevent React Flow from stealing focus back
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            width: `${Math.max(4, label.length)}ch`,
            minWidth: '10px',
            maxWidth: '100%',
            fontFamily: 'inherit',
            fontSize: isRoot ? '16px' : '14px',
            fontWeight: isRoot ? 600 : 500,
            color: 'var(--n800)',
            padding: 0
          }}
        />
      ) : (
        <div style={{ color: 'var(--n800)', fontSize: isRoot ? '16px' : '14px', fontWeight: isRoot ? 600 : 500, userSelect: 'none', wordWrap: 'break-word', flex: 1, minHeight: isRoot ? '24px' : '20px' }}>
          {label || (isEditing ? '' : 'New Node')}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{
          background: 'transparent', 
          width: '1px', 
          height: '1px', 
          border: 'none', 
          right: 0
        }} 
      />
    </div>
  );
}
