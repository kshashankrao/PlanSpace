import React from 'react';
import { Square, Circle, Database, Diamond } from 'lucide-react';

export default function FlowchartSidebar({ onDoubleClickShape }: { onDoubleClickShape?: (shape: string) => void }) {
  const onDragStart = (event: React.DragEvent, nodeType: string, shape: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/shape', shape);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ 
      width: '60px', 
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'var(--n10)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '16px',
      gap: '16px'
    }}>
      <div 
        title="Rectangle (Process)"
        style={{ cursor: 'grab', padding: '8px', color: 'var(--n500)' }}
        onDragStart={(event) => onDragStart(event, 'custom', 'rectangle')} 
        onDoubleClick={() => onDoubleClickShape && onDoubleClickShape('rectangle')}
        draggable
      >
        <Square size={24} />
      </div>
      
      <div 
        title="Diamond (Decision)"
        style={{ cursor: 'grab', padding: '8px', color: 'var(--n500)' }}
        onDragStart={(event) => onDragStart(event, 'custom', 'diamond')} 
        onDoubleClick={() => onDoubleClickShape && onDoubleClickShape('diamond')}
        draggable
      >
        <Diamond size={24} />
      </div>

      <div 
        title="Oval (Start/End)"
        style={{ cursor: 'grab', padding: '8px', color: 'var(--n500)' }}
        onDragStart={(event) => onDragStart(event, 'custom', 'oval')} 
        onDoubleClick={() => onDoubleClickShape && onDoubleClickShape('oval')}
        draggable
      >
        <Circle size={24} />
      </div>
      
      <div 
        title="Cylinder (Database)"
        style={{ cursor: 'grab', padding: '8px', color: 'var(--n500)' }}
        onDragStart={(event) => onDragStart(event, 'custom', 'cylinder')} 
        onDoubleClick={() => onDoubleClickShape && onDoubleClickShape('cylinder')}
        draggable
      >
        <Database size={24} />
      </div>
    </aside>
  );
}
