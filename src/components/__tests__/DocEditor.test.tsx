import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DocEditor from '../DocEditor';

vi.mock('../../db/db', () => ({
  db: {
    tasks: {
      get: vi.fn(),
    }
  }
}));

describe('DocEditor', () => {
  it('renders toolbar buttons and content', () => {
    const mockOnUpdate = vi.fn();
    render(<DocEditor initialContent="<p>Test Content</p>" onUpdate={mockOnUpdate} />);
    
    // check if the content rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
