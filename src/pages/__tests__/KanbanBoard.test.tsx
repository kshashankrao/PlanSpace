import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KanbanBoard from '../KanbanBoard';

vi.mock('../../db/db', () => ({
  formatTaskId: (id: string) => `TSK-${id}`,
  db: {
    tasks: {
      update: vi.fn(),
      add: vi.fn(),
    }
  }
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (cb: any) => {
    // If it's querying sprints
    if (cb.toString().includes('sprints')) {
      return [{ id: 'sprint-1', name: 'Sprint 1', status: 'active' }];
    }
    // If it's querying statuses
    if (cb.toString().includes('statuses')) {
      return [
        { id: 'todo', title: 'To Do', order: 0 },
        { id: 'in-progress', title: 'In Progress', order: 1 }
      ];
    }
    // If it's querying tasks
    return [
      { id: '1', title: 'Task 1', statusId: 'todo', sprintId: 'sprint-1' },
      { id: '2', title: 'Task 2', statusId: 'in-progress', sprintId: 'sprint-1' }
    ];
  }
}));

describe('KanbanBoard', () => {
  it('renders columns and tasks', () => {
    const { getByText } = render(<KanbanBoard />);
    
    // Columns should be rendered
    expect(getByText('To Do')).toBeInTheDocument();
    expect(getByText('In Progress')).toBeInTheDocument();
    
    // Tasks should be rendered
    expect(getByText('Task 1')).toBeInTheDocument();
    expect(getByText('Task 2')).toBeInTheDocument();
  });
});
