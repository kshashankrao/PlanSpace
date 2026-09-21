import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskModal from '../TaskModal';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  AlignLeft: () => <div data-testid="icon-align-left" />,
  Tag: () => <div data-testid="icon-tag" />,
  CheckSquare: () => <div data-testid="icon-check-square" />,
  Clock: () => <div data-testid="icon-clock" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  Trash2: () => <div data-testid="icon-trash" />,
  MessageSquare: () => <div data-testid="icon-message" />,
  MoreHorizontal: () => <div data-testid="icon-more" />
}));

describe('TaskModal', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    statusId: 'todo',
    priority: 'medium' as const,
    order: 0,
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sprintId: 'sprint-1'
  };

  it('renders task modal when open', () => {
    const mockOnClose = vi.fn();
    const { getByDisplayValue } = render(<TaskModal onClose={mockOnClose} taskToEdit={mockTask} />);
    
    // Check if the title is there
    expect(getByDisplayValue('Test Task')).toBeInTheDocument();
  });

  it('renders correctly with no task (creation mode)', () => {
    const mockOnClose = vi.fn();
    const { queryByDisplayValue } = render(<TaskModal onClose={mockOnClose} />);
    
    // Check if it's absent
    expect(queryByDisplayValue('Test Task')).not.toBeInTheDocument();
  });
});
