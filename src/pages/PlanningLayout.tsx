import { NavLink, Outlet } from 'react-router-dom';

export default function PlanningLayout() {
  const tabStyle = {
    padding: '16px 4px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '14px',
     borderBottom: '2px solid transparent',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-board)' }}>
      {/* Unified Single-Row Header */}
      <div
        style={{
          padding: '0 32px',
          height: '54px',
          backgroundColor: 'var(--n0)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, padding: 0, color: 'var(--n800)' }}>
          Planning
        </h1>

        <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)' }} />

        {/* Horizontal Navigation Tabs */}
        <div style={{ display: 'flex', gap: '24px', height: '100%', alignItems: 'center' }}>
          <NavLink
            to="/planning/board"
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={tabStyle}
          >
            Board
          </NavLink>
          <NavLink
            to="/planning/backlog"
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={tabStyle}
          >
            Backlog
          </NavLink>
          <NavLink
            to="/planning/details"
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={tabStyle}
          >
            Sprints
          </NavLink>
          <NavLink
            to="/planning/gantt"
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={tabStyle}
          >
            Timeline
          </NavLink>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
