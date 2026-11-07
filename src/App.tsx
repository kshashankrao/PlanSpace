import { HashRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, BookOpen, PanelLeftClose, PanelLeftOpen, Workflow, CalendarDays, ArrowLeft, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import KanbanBoard from './pages/KanbanBoard';
import MindMap from './pages/MindMap';
import Backlog from './pages/Backlog';
import Docs from './pages/Docs';
import TaskModal from './components/TaskModal';
import CommandPalette from './components/CommandPalette';
import PlanningLayout from './pages/PlanningLayout';
import SprintDetails from './pages/SprintDetails';
import GanttChart from './pages/GanttChart';
import Flowchart from './pages/Flowchart';
import DailyNotes from './pages/DailyNotes';
import DataManagementModal from './components/DataManagementModal';
import type { Task } from './db/db';
import packageJson from '../package.json';

function Sidebar({ collapsed, onToggle, onOpenSettings }: { collapsed: boolean; onToggle: () => void; onOpenSettings: () => void }) {
  const navigate = useNavigate();
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
      <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <nav style={{ flex: 1, marginTop: '4px' }}>
        <NavLink to="/planning/board" className={() => `nav-link ${window.location.hash.includes('#/planning') ? 'active' : ''}`} title="Planning">
          <LayoutDashboard size={18} />
          <span className="sidebar-text">Planning</span>
        </NavLink>

        <NavLink to="/mindmap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title="Mind Map">
          <Network size={18} />
          <span className="sidebar-text">Mind Map</span>
        </NavLink>
        <NavLink to="/docs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title="Docs">
          <BookOpen size={18} />
          <span className="sidebar-text">Docs</span>
        </NavLink>
        <NavLink to="/flowchart" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title="Flowchart">
          <Workflow size={18} />
          <span className="sidebar-text">Flowchart</span>
        </NavLink>
        <NavLink to="/daily-notes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title="Daily Notes">
          <CalendarDays size={18} />
          <span className="sidebar-text">Daily Notes</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost nav-link" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }} title="Go Back">
          <ArrowLeft size={18} />
          <span className="sidebar-text">Go Back</span>
        </button>
        <button onClick={onOpenSettings} className="btn btn-ghost nav-link" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }} title="Settings">
          <Settings size={18} />
          <span className="sidebar-text">Settings</span>
        </button>
        <div className="sidebar-text" style={{ padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', userSelect: 'none' }}>
          v{packageJson.version}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultSprintId, setDefaultSprintId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    const handleEditTask = (e: any) => {
      const detail = e.detail;
      if (detail && detail.id) {
        setEditingTask(detail as Task);
        setDefaultSprintId(undefined);
      } else {
        setEditingTask(undefined);
        setDefaultSprintId(detail?.defaultSprintId);
      }
      setIsModalOpen(true);
    };
    window.addEventListener('edit-task', handleEditTask);
    return () => window.removeEventListener('edit-task', handleEditTask);
  }, []);

  return (
    <Router>
      <div className="app-shell">
        {/* Dedicated 32px Window Titlebar separated from page headers */}
        <div className="window-titlebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: 'var(--prio-medium)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              PS
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--n700)' }}>PlanSpace</span>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="titlebar-search-btn"
            title="Quick Jump & Search (Ctrl+K)"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={13} color="var(--n400)" />
              <span>Search or jump to...</span>
            </span>
            <kbd
              style={{
                fontSize: '10px',
                padding: '0px 5px',
                backgroundColor: 'var(--n0)',
                border: '1px solid var(--n40)',
                borderRadius: '3px',
                color: 'var(--n500)',
                lineHeight: '16px',
              }}
            >
              Ctrl+K
            </kbd>
          </button>

          {/* Spacer for native Windows minimize/maximize/close overlay controls */}
          <div style={{ width: '138px', flexShrink: 0 }} />
        </div>

        <div className="app-container">
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <div className="main-content">
            <div className="content-area">
              <Routes>
                <Route path="/" element={<Navigate to="/planning/board" replace />} />
                <Route path="/planning" element={<PlanningLayout />}>
                  <Route index element={<Navigate to="/planning/board" replace />} />
                  <Route path="board" element={<KanbanBoard />} />
                  <Route path="backlog" element={<Backlog />} />
                  <Route path="details" element={<SprintDetails />} />
                  <Route path="gantt" element={<GanttChart />} />
                </Route>
                <Route path="/mindmap" element={<MindMap />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/flowchart" element={<Flowchart />} />
                <Route path="/daily-notes" element={<DailyNotes />} />
                <Route path="/calendar" element={<div>Calendar View (Coming Soon)</div>} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <TaskModal taskToEdit={editingTask} defaultSprintId={defaultSprintId} onClose={() => setIsModalOpen(false)} />}
      {isSettingsOpen && <DataManagementModal onClose={() => setIsSettingsOpen(false)} />}
      <CommandPalette />
    </Router>
  );
}

export default App;
