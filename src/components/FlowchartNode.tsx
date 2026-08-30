import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { db } from '../db/db';

export default function FlowchartNode({ id, data }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data.label as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const shape = (data.shape as string) || 'rectangle';

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
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveLabel = async () => {
    setIsEditing(false);
    if (label.trim() !== data.label) {
      await db.flowchartNodes.update(id, { label: label.trim() || 'Process' });
      window.dispatchEvent(new CustomEvent('flowchart-node-updated'));
    } else {
      setLabel(data.label as string);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveLabel();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel((data.label as string) || '');
    }
  };

  const getShapeStyle = () => {
    switch (shape) {
      case 'diamond':
        return {
          width: 100,
          height: 100,
          transform: 'rotate(45deg)',
          backgroundColor: 'var(--n0)',
          border: '2px solid var(--b400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        };
      case 'oval':
        return {
          minWidth: 120,
          minHeight: 60,
          backgroundColor: 'var(--n0)',
          border: '2px solid var(--b400)',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px'
        };
      case 'cylinder':
        return {
          minWidth: 100,
          minHeight: 80,
          backgroundColor: 'var(--n0)',
          border: '2px solid var(--b400)',
          borderRadius: '50% / 15%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px'
        };
      case 'rectangle':
      default:
        return {
          minWidth: 120,
          minHeight: 60,
          backgroundColor: 'var(--n0)',
          border: '2px solid var(--b400)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          boxShadow: 'var(--shadow-card)'
        };
    }
  };

  return (
    <div 
      style={{ position: 'relative' }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div style={getShapeStyle()}>
        <div style={{
          transform: shape === 'diamond' ? 'rotate(-45deg)' : 'none',
          textAlign: 'center',
          wordBreak: 'break-word',
          maxWidth: shape === 'diamond' ? 80 : '100%',
          width: '100%'
        }}>
          {isEditing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={onKeyDown}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                color: 'var(--n800)',
                fontSize: '14px',
                fontFamily: 'inherit',
                margin: 0,
                padding: 0
              }}
            />
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--n800)' }}>
              {label || 'Process'}
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}
