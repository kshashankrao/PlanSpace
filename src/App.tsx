import { HashRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, BookOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import KanbanBoard from './pages/KanbanBoard';
import MindMap from './pages/MindMap';
import Backlog from './pages/Backlog';
import Docs from './pages/Docs';
import TaskModal from './components/TaskModal';
import PlanningLayout from './pages/PlanningLayout';
import SprintDetails from './pages/SprintDetails';
import GanttChart from './pages/GanttChart';
import type { Task } from './db/db';

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
      <button className="sidebar-toggle-btn" onClick={onToggle}>
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <div style={{ padding: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', minWidth: '32px', backgroundColor: 'var(--prio-medium)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>TM</div>
          <div className="sidebar-text">
            <h2 style={{ fontSize: '14px', margin: 0, color: 'var(--text-primary)', padding: 0 }}>Task Manager</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Software project</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
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
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-ghost nav-link" style={{ width: '100%', justifyContent: 'flex-start' }} title="Settings">
          <Settings size={18} />
          <span className="sidebar-text">Settings</span>
        </button>
      </div>
    </div>
  );
}



function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    const handleEditTask = (e: any) => {
      setEditingTask(e.detail);
      setIsModalOpen(true);
    };
    window.addEventListener('edit-task', handleEditTask);
    return () => window.removeEventListener('edit-task', handleEditTask);
  }, []);



  return (
    <Router>
      <div className="app-container" style={{ position: 'relative' }}>
        {/* Invisible drag region across the top to allow window dragging */}
        <div className="titlebar-drag-region" />
        <Sidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
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
              <Route path="/calendar" element={<div>Calendar View (Coming Soon)</div>} />
            </Routes>
          </div>
        </div>
      </div>
      {isModalOpen && <TaskModal taskToEdit={editingTask} onClose={() => setIsModalOpen(false)} />}
    </Router>
  );
}

export default App;
