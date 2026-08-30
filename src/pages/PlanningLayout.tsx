import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function PlanningLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-board)' }}>
      {/* Header Section */}
      <div style={{ padding: '32px 40px 0 40px', backgroundColor: 'var(--n0)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="breadcrumb">Projects / Task Manager</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--prio-medium)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>TM</div>
            <h1 style={{ fontSize: '24px', margin: 0, padding: 0 }}>Software project</h1>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <NavLink 
            to="/planning/board" 
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={{ paddingBottom: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            Board
          </NavLink>
          <NavLink 
            to="/planning/backlog" 
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={{ paddingBottom: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            Backlog
          </NavLink>
          <NavLink 
            to="/planning/details" 
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={{ paddingBottom: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            Sprint
          </NavLink>
          <NavLink 
            to="/planning/gantt" 
            className={({ isActive }) => `planning-tab ${isActive ? 'active' : ''}`}
            style={{ paddingBottom: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            Timeline
          </NavLink>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
