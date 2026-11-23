import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App.jsx';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const response = (body, ok = true) => ({ ok, json: async () => body });

function signIn(role = 'Parent') {
  fireEvent.click(screen.getByRole('button', { name: `Demo: ${role}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
}

describe('M5–M8 UI flows (Entries, Statistics, Role-Based AI Summary)', () => {
  it('shows specialist entries and allows editing with edited badge', async () => {
    fetch
      .mockResolvedValueOnce(
        response({
          token: 'spec-token',
          user: {
            id: 2,
            name: 'Murat Kaya',
            email: 'murat.kaya@example.com',
            role: 'specialist',
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          entries: [
            {
              id: 5,
              authorId: 2,
              authorName: 'Murat Kaya',
              entryDate: '2026-04-21',
              entryType: 'observation',
              developmentArea: 'cognitive',
              title: 'Focus Note',
              content: 'Good focus in session.',
              isEdited: 0,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          entry: {
            id: 5,
            authorId: 2,
            authorName: 'Murat Kaya',
            entryDate: '2026-04-21',
            entryType: 'observation',
            developmentArea: 'cognitive',
            title: 'Focus Note',
            content: 'Updated focus observation.',
            isEdited: 1,
          },
        }),
      );

    render(<App />);
    signIn('Specialist (Linked)');

    fireEvent.click(await screen.findByRole('button', { name: 'Entries' }));
    expect(await screen.findByText('Focus Note')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit entry content'), {
      target: { value: 'Updated focus observation.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('edited')).toBeTruthy();
  });

  it('displays weekly completion statistics and generates AI summary with feedback', async () => {
    fetch
      .mockResolvedValueOnce(
        response({
          token: 'parent-token',
          user: {
            id: 1,
            name: 'Selin Yıldız',
            email: 'selin.yildiz@example.com',
            role: 'parent',
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          hasTasks: true,
          totalTasks: 4,
          completedTasks: 3,
          completionRate: 75,
          byArea: [
            {
              developmentArea: 'cognitive',
              total: 4,
              completed: 3,
              completionRate: 75,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(response({ summaries: [] }))
      .mockResolvedValueOnce(
        response({
          summary: {
            id: 9,
            readerRole: 'parent',
            weekStart: '2026-04-20',
            label: 'AI-generated',
            summaryText: '[Mock Summary for Parent] 2 records.',
            sourceRecords: [
              { id: 1, type: 'task', title: 'Reading', date: '2026-04-20' },
            ],
            feedback: null,
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          summary: {
            id: 9,
            readerRole: 'parent',
            weekStart: '2026-04-20',
            label: 'AI-generated',
            summaryText: '[Mock Summary for Parent] 2 records.',
            sourceRecords: [
              { id: 1, type: 'task', title: 'Reading', date: '2026-04-20' },
            ],
            feedback: 'helpful',
          },
        }),
      );

    render(<App />);
    signIn('Parent');

    fireEvent.click(await screen.findByRole('button', { name: 'Statistics' }));
    expect(
      await screen.findByRole('heading', { name: 'Overall Completion: 75%' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'AI Summary' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Generate Weekly AI Summary' }),
    );
    expect(await screen.findByText('AI-generated')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    expect(await screen.findByText(/Feedback recorded:/)).toBeTruthy();
  });
});
