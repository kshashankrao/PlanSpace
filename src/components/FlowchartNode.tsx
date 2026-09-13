import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { db } from '../db/db';

export default function FlowchartNode({ id, data }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data.label as string) || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const shape = (data.shape as string) || 'rectangle';

  useEffect(() => {
    if (data.label !== undefined && !isEditing) {
      setLabel(data.label as string);
    }
  }, [data.label, isEditing]);

  useEffect(() => {
    if (data.isNew) setIsEditing(true);
  }, [data.isNew]);

  useEffect(() => {
    const handleEditStart = (e: any) => {
      if (e.detail.id === id) {
        setIsEditing(true);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
          }
        }, 10);
      }
    };
    window.addEventListener('start-flowchart-node-edit', handleEditStart);
    return () => window.removeEventListener('start-flowchart-node-edit', handleEditStart);
  }, [id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
      }, 50);
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

  // Shared text styles
  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--n800)',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    width: '100%',
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
    lineHeight: 1.4,
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveLabel(); }
    else if (e.key === 'Escape') { setIsEditing(false); setLabel((data.label as string) || ''); }
  };

  // ── Diamond ─────────────────────────────────────────────────────────────────
  // A fixed 100×100 square rotated 45° gives a proper diamond shape.
  // Text is counter-rotated inside so it reads normally.
  if (shape === 'diamond') {
    const SIZE = 100;
    return (
      <div
        style={{ position: 'relative', width: 160, height: SIZE * 1.42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {/* The rotated square */}
        <div style={{
          width: SIZE,
          height: SIZE,
          transform: 'rotate(45deg)',
          backgroundColor: 'var(--n0)',
          border: '2px solid var(--b400)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {/* Counter-rotate so text is upright */}
          <div style={{ transform: 'rotate(-45deg)', width: SIZE * 0.72, textAlign: 'center' }}>
            {isEditing ? (
              <textarea
                ref={inputRef}
                value={label}
                rows={1}
                onChange={handleTextareaChange}
                onBlur={saveLabel}
                onKeyDown={handleKeyDown}
                style={{ ...textareaStyle, width: '100%' }}
              />
            ) : (
              <div style={{ ...textStyle, width: '100%' }}>{label || 'Decision'}</div>
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

  // ── Other shapes (rectangle, oval, cylinder) ─────────────────────────────────
  // All use a fixed 160px wide container so auto-layout centers them on the same X.
  const shapeStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      width: '100%',
      backgroundColor: 'var(--n0)',
      border: '2px solid var(--b400)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    switch (shape) {
      case 'oval':
        return { ...base, minHeight: 52, borderRadius: '999px', padding: '10px 24px' };
      case 'cylinder':
        return { ...base, minHeight: 72, borderRadius: '50% / 18%', padding: '20px 16px' };
      case 'rectangle':
      default:
        return { ...base, minHeight: 52, borderRadius: 'var(--radius)', padding: '10px 24px', boxShadow: 'var(--shadow-card)' };
    }
  })();

  return (
    <div
      style={{ position: 'relative', width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div style={shapeStyle}>
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="nodrag nopan"
            value={label}
            rows={1}
            onChange={handleTextareaChange}
            onBlur={saveLabel}
            onKeyDown={handleKeyDown}
            style={textareaStyle}
          />
        ) : (
          <div style={textStyle}>{label || 'Process'}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}
