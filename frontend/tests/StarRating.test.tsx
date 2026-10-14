import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../src/components/reviews/StarRating';

describe('StarRating Component', () => {
  it('renders read-only rating with accessible aria-label', () => {
    render(<StarRating rating={4.5} />);

    const container = screen.getByRole('img');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-label', 'Rated 4.5 out of 5 stars');
  });

  it('renders interactive rating radiogroup with 5 star radio buttons', () => {
    const handleRatingChange = vi.fn();
    render(<StarRating rating={3} interactive={true} onRatingChange={handleRatingChange} />);

    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toBeInTheDocument();

    const starButtons = screen.getAllByRole('radio');
    expect(starButtons).toHaveLength(5);
    expect(starButtons[2]).toHaveAttribute('aria-checked', 'true');
    expect(starButtons[3]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onRatingChange when an interactive star is clicked', () => {
    const handleRatingChange = vi.fn();
    render(<StarRating rating={2} interactive={true} onRatingChange={handleRatingChange} />);

    const starButtons = screen.getAllByRole('radio');
    fireEvent.click(starButtons[4]); // 5th star

    expect(handleRatingChange).toHaveBeenCalledWith(5);
  });

  it('handles keyboard navigation with arrow keys in interactive mode', () => {
    const handleRatingChange = vi.fn();
    render(<StarRating rating={3} interactive={true} onRatingChange={handleRatingChange} />);

    const starButtons = screen.getAllByRole('radio');
    // Press ArrowRight on 3rd star -> should change to 4
    fireEvent.keyDown(starButtons[2], { key: 'ArrowRight' });
    expect(handleRatingChange).toHaveBeenCalledWith(4);

    // Press ArrowLeft on 3rd star -> should change to 2
    fireEvent.keyDown(starButtons[2], { key: 'ArrowLeft' });
    expect(handleRatingChange).toHaveBeenCalledWith(2);
  });
});
