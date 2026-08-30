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



  const getShapeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      backgroundColor: 'var(--n0)',
      border: '2px solid var(--b400)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    switch (shape) {
      case 'diamond':
        return {
          // diamond is handled differently via SVG overlay — use rectangle base
          ...base,
          minHeight: 52,
          padding: '10px 24px',
          transform: 'rotate(45deg)',
          borderRadius: '4px',
          // must clip inner overflow for rotated box
        };
      case 'oval':
        return { ...base, minHeight: 52, borderRadius: '999px', padding: '10px 24px' };
      case 'cylinder':
        return { ...base, minHeight: 72, borderRadius: '50% / 18%', padding: '20px 16px' };
      case 'rectangle':
      default:
        return { ...base, minHeight: 52, borderRadius: 'var(--radius)', padding: '10px 24px', boxShadow: 'var(--shadow-card)' };
    }
  };

  const textContent = (
    <div style={{
      fontSize: '14px',
      color: 'var(--n800)',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      width: '100%',
      textAlign: 'center',
      transform: shape === 'diamond' ? 'rotate(-45deg)' : 'none',
    }}>
      {label || 'Process'}
    </div>
  );

  const editContent = (
    <textarea
      ref={inputRef as any}
      value={label}
      rows={1}
      onChange={(e) => {
        setLabel(e.target.value);
        // auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }}
      onBlur={saveLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveLabel(); }
        else if (e.key === 'Escape') { setIsEditing(false); setLabel((data.label as string) || ''); }
      }}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        textAlign: 'center',
        color: 'var(--n800)',
        fontSize: '14px',
        fontFamily: 'inherit',
        margin: 0,
        padding: 0,
        lineHeight: 1.4,
        transform: shape === 'diamond' ? 'rotate(-45deg)' : 'none',
        wordBreak: 'break-word',
      }}
    />
  );

  return (
    // Fixed-width outer container — all shapes share the same reference X for auto-layout
    <div
      style={{ position: 'relative', width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div style={getShapeStyle()}>
        {isEditing ? editContent : textContent}
      </div>

      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}
