import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatTaskId } from '../db/db';
import {
  Search, CheckSquare, FileText, Network, Workflow,
  CalendarDays, Plus, LayoutDashboard, ListTodo, GanttChartSquare, ArrowRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PaletteItem {
  id: string;
  category: 'Quick Actions' | 'Tasks' | 'Docs' | 'Mind Maps' | 'Flowcharts' | 'Daily Notes';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const docs = useLiveQuery(() => db.docs.toArray(), []) || [];
  const mindmaps = useLiveQuery(() => db.mindMaps.toArray(), []) || [];
  const flowcharts = useLiveQuery(() => db.flowcharts.toArray(), []) || [];
  const dailyNotes = useLiveQuery(() => db.dailyNotes.toArray(), []) || [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteItem[] = [];

    // 1. Quick Actions
    const quickActions: PaletteItem[] = [
      {
        id: 'action-new-task',
        category: 'Quick Actions',
        title: 'Create New Task...',
        subtitle: 'Open task modal',
        icon: <Plus size={15} color="var(--b400)" />,
        onSelect: () => {
          window.dispatchEvent(new CustomEvent('edit-task', { detail: {} }));
        },
      },
      {
        id: 'action-board',
        category: 'Quick Actions',
        title: 'Go to Kanban Board',
        subtitle: 'Planning',
        icon: <LayoutDashboard size={15} color="var(--n500)" />,
        onSelect: () => navigate('/planning/board'),
      },
      {
        id: 'action-backlog',
        category: 'Quick Actions',
        title: 'Go to Backlog & Sprints',
        subtitle: 'Planning',
        icon: <ListTodo size={15} color="var(--n500)" />,
        onSelect: () => navigate('/planning/backlog'),
      },
      {
        id: 'action-gantt',
        category: 'Quick Actions',
        title: 'Go to Gantt Timeline',
        subtitle: 'Planning',
        icon: <GanttChartSquare size={15} color="var(--n500)" />,
        onSelect: () => navigate('/planning/gantt'),
      },
      {
        id: 'action-mindmap',
        category: 'Quick Actions',
        title: 'Go to Mind Maps',
        subtitle: 'Brainstorming',
        icon: <Network size={15} color="#0052CC" />,
        onSelect: () => navigate('/mindmap'),
      },
      {
        id: 'action-flowchart',
        category: 'Quick Actions',
        title: 'Go to Flowcharts',
        subtitle: 'Process Diagrams',
        icon: <Workflow size={15} color="#00875A" />,
        onSelect: () => navigate('/flowchart'),
      },
      {
        id: 'action-docs',
        category: 'Quick Actions',
        title: 'Go to Docs',
        subtitle: 'Knowledge Base',
        icon: <FileText size={15} color="#5243AA" />,
        onSelect: () => navigate('/docs'),
      },
      {
        id: 'action-dailynotes',
        category: 'Quick Actions',
        title: "Go to Today's Daily Note",
        subtitle: 'Daily Notes',
        icon: <CalendarDays size={15} color="#FF8B00" />,
        onSelect: () => navigate('/daily-notes'),
      },
    ];

    if (q.length > 0) {
      list.push({
        id: 'action-instant-task',
        category: 'Quick Actions',
        title: `Quick create task "${query.trim()}"`,
        subtitle: 'Add directly to Backlog (To Do)',
        icon: <Plus size={15} color="var(--b400)" />,
        onSelect: async () => {
          const now = Date.now();
          await db.tasks.add({
            id: uuidv4(),
            title: query.trim(),
            description: '',
            statusId: 'todo',
            priority: 'medium',
            order: tasks.length,
            createdAt: now,
            updatedAt: now,
          });
        },
      });
    }

    for (const action of quickActions) {
      if (!q || action.title.toLowerCase().includes(q) || (action.subtitle && action.subtitle.toLowerCase().includes(q))) {
        list.push(action);
      }
    }

    // 2. Tasks
    for (const t of tasks) {
      const formattedId = formatTaskId(t.id);
      if (!q || t.title.toLowerCase().includes(q) || formattedId.toLowerCase().includes(q)) {
        const statusLabel = t.statusId === 'done' ? 'Done' : t.statusId === 'in_progress' ? 'In Progress' : 'To Do';
        list.push({
          id: `task-${t.id}`,
          category: 'Tasks',
          title: t.title,
          subtitle: formattedId,
          badge: statusLabel,
          badgeColor: t.statusId === 'done' ? 'var(--g50)' : t.statusId === 'in_progress' ? 'var(--b50)' : 'var(--n30)',
          icon: <CheckSquare size={15} color="var(--b400)" />,
          onSelect: () => {
            window.dispatchEvent(new CustomEvent('edit-task', { detail: t }));
          },
        });
      }
    }

    // 3. Docs
    for (const d of docs) {
      if (!q || d.title.toLowerCase().includes(q)) {
        list.push({
          id: `doc-${d.id}`,
          category: 'Docs',
          title: d.title || 'Untitled Document',
          subtitle: 'Doc',
          icon: <FileText size={15} color="#5243AA" />,
          onSelect: () => navigate(`/docs?id=${d.id}`),
        });
      }
    }

    // 4. Mind Maps
    for (const m of mindmaps) {
      if (!q || m.title.toLowerCase().includes(q)) {
        list.push({
          id: `mm-${m.id}`,
          category: 'Mind Maps',
          title: m.title,
          subtitle: 'Mind Map',
          icon: <Network size={15} color="#0052CC" />,
          onSelect: () => navigate(`/mindmap?id=${m.id}`),
        });
      }
    }

    // 5. Flowcharts
    for (const f of flowcharts) {
      if (!q || f.title.toLowerCase().includes(q)) {
        list.push({
          id: `fc-${f.id}`,
          category: 'Flowcharts',
          title: f.title,
          subtitle: 'Flowchart',
          icon: <Workflow size={15} color="#00875A" />,
          onSelect: () => navigate(`/flowchart?id=${f.id}`),
        });
      }
    }

    // 6. Daily Notes
    for (const dn of dailyNotes) {
      if (!q || dn.date.toLowerCase().includes(q)) {
        list.push({
          id: `dn-${dn.date}`,
          category: 'Daily Notes',
          title: `Daily Note: ${dn.date}`,
          subtitle: dn.date,
          icon: <CalendarDays size={15} color="#FF8B00" />,
          onSelect: () => navigate(`/daily-notes?date=${dn.date}`),
        });
      }
    }

    return list.slice(0, 35);
  }, [query, tasks, docs, mindmaps, flowcharts, dailyNotes, navigate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (items.length ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (items.length ? (prev - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      e.preventDefault();
      items[selectedIndex].onSelect();
      setIsOpen(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: '92vw',
          backgroundColor: 'var(--n0)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--n40)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--n30)',
          }}
        >
          <Search size={18} color="var(--n400)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Jump to any task, doc, mind map, flowchart, or type to create..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              color: 'var(--n800)',
              outline: 'none',
              padding: '2px 0',
            }}
          />
          <kbd
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: 'var(--n20)',
              border: '1px solid var(--n40)',
              borderRadius: '4px',
              color: 'var(--n500)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '6px',
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No matching items found.
            </div>
          ) : (
            items.map((item, idx) => {
              const prevCategory = idx > 0 ? items[idx - 1].category : null;
              const showHeader = item.category !== prevCategory;
              const isSelected = idx === selectedIndex;

              return (
                <div key={item.id}>
                  {showHeader && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--n400)',
                        padding: '8px 10px 4px 10px',
                      }}
                    >
                      {item.category}
                    </div>
                  )}
                  <div
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      item.onSelect();
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--b50)' : 'transparent',
                      color: isSelected ? 'var(--b500)' : 'var(--n800)',
                      transition: 'background-color 0.08s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</div>
                      <span
                        style={{
                          fontSize: '13.5px',
                          fontWeight: isSelected ? 600 : 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span style={{ fontSize: '11.5px', color: 'var(--n400)', flexShrink: 0 }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.badgeColor || 'var(--n30)',
                            color: 'var(--n700)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <ArrowRight size={14} color="var(--b400)" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--n10)',
            borderTop: '1px solid var(--n30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--n500)',
          }}
        >
          <span>
            <strong>↑↓</strong> to navigate &nbsp;·&nbsp; <strong>Enter</strong> to open &nbsp;·&nbsp; <strong>Esc</strong> to close
          </span>
          <span>Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
