import React from 'react';

interface Props {
  onAddShape?: (shape: string) => void;
}

const SHAPES: { key: string; label: string; preview: React.ReactNode }[] = [
  {
    key: 'rectangle',
    label: 'Process',
    preview: (
      <svg width="36" height="28" viewBox="0 0 36 28">
        <rect x="2" y="2" width="32" height="24" rx="6" ry="6"
          fill="var(--n0)" stroke="var(--b400)" strokeWidth="2" />
      </svg>
    )
  },
  {
    key: 'diamond',
    label: 'Decision',
    preview: (
      <svg width="36" height="36" viewBox="0 0 36 36">
        <polygon points="18,2 34,18 18,34 2,18"
          fill="#FFFDF5" stroke="var(--prio-high)" strokeWidth="2" />
      </svg>
    )
  },
  {
    key: 'oval',
    label: 'Start/End',
    preview: (
      <svg width="40" height="24" viewBox="0 0 40 24">
        <ellipse cx="20" cy="12" rx="18" ry="10"
          fill="#F3FBF7" stroke="var(--g400)" strokeWidth="2" />
      </svg>
    )
  },
  {
    key: 'cylinder',
    label: 'Database',
    preview: (
      <svg width="32" height="38" viewBox="0 0 32 38">
        <rect x="2" y="6" width="28" height="26" fill="var(--n0)" stroke="var(--b400)" strokeWidth="2" />
        <ellipse cx="16" cy="6" rx="14" ry="5" fill="var(--n10)" stroke="var(--b400)" strokeWidth="2" />
        <ellipse cx="16" cy="32" rx="14" ry="5" fill="var(--n10)" stroke="var(--b400)" strokeWidth="2" />
      </svg>
    )
  }
];

export default function FlowchartSidebar({ onAddShape }: Props) {
  const onDragStart = (event: React.DragEvent, shape: string) => {
    event.dataTransfer.setData('application/reactflow', 'custom');
    event.dataTransfer.setData('application/reactflow/shape', shape);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{
      width: '76px',
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'var(--n10)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '14px',
      gap: '6px',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
        Shapes
      </div>
      {SHAPES.map(({ key, label, preview }) => (
        <div
          key={key}
          title={`Click or drag to add ${label}`}
          style={{
            cursor: 'pointer',
            padding: '8px 6px 6px',
            color: 'var(--n600)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            borderRadius: 'var(--radius)',
            width: '62px',
            userSelect: 'none',
            transition: 'background-color 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--n30)')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onDragStart={(event) => onDragStart(event, key)}
          onClick={() => onAddShape?.(key)}
          draggable
        >
          {preview}
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
            {label}
          </span>
        </div>
      ))}
    </aside>
  );
}
