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

describe('M2 & M3 UI flows (Specialist Linking & Weekly Schedule)', () => {
  it('allows parent to open Linked Specialists tab and link a specialist', async () => {
    fetch
      .mockResolvedValueOnce(
        response({
          token: 'parent-token',
          user: { name: 'Selin Yıldız', email: 'selin.yildiz@example.com', role: 'parent' },
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          specialists: [
            {
              id: 1,
              specialistId: 2,
              name: 'Murat Kaya',
              email: 'murat.kaya@example.com',
              specialistType: 'psychologist',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          specialist: {
            id: 2,
            specialistId: 3,
            name: 'Elif Arslan',
            email: 'elif.arslan@example.com',
            specialistType: 'teacher',
          },
        }),
      );

    render(<App />);
    signIn('Parent');

    const tabBtn = await screen.findByRole('button', { name: 'Linked Specialists' });
    fireEvent.click(tabBtn);

    expect(await screen.findByText('Murat Kaya')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Specialist Email'), {
      target: { value: 'elif.arslan@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link Specialist' }));

    expect(await screen.findByText('Elif Arslan')).toBeTruthy();
  });

  it('allows parent and child to view Weekly Schedule tab and parent to add an event', async () => {
    fetch
      .mockResolvedValueOnce(
        response({
          token: 'parent-token',
          user: { name: 'Selin Yıldız', email: 'selin.yildiz@example.com', role: 'parent' },
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          events: [
            {
              id: 10,
              childId: 1,
              title: 'Morning School Session',
              eventDate: '2026-04-20',
              eventTime: '09:00',
              category: 'school',
              creatorName: 'Selin Yıldız',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          event: {
            id: 11,
            childId: 1,
            title: 'Speech Therapy Session',
            eventDate: '2026-04-20',
            eventTime: '14:00',
            category: 'therapy',
            creatorName: 'Selin Yıldız',
          },
        }),
      );

    render(<App />);
    signIn('Parent');

    const scheduleTab = await screen.findByRole('button', { name: 'Weekly Schedule' });
    fireEvent.click(scheduleTab);

    expect(await screen.findByText('Morning School Session')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Event Title'), {
      target: { value: 'Speech Therapy Session' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(await screen.findByText('Speech Therapy Session')).toBeTruthy();
  });

  it('allows child to view Tasks tab and mark a pending task as done', async () => {
    fetch
      .mockResolvedValueOnce(
        response({
          token: 'child-token',
          user: { name: 'Deniz Yıldız', email: 'deniz.yildiz@example.com', role: 'child' },
        }),
      )
      .mockResolvedValueOnce(
        response({
          children: [{ id: 1, name: 'Deniz Yıldız', age: 8, grade: '2nd Grade' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          tasks: [
            {
              id: 21,
              childId: 1,
              title: 'Daily Reading Practice',
              description: 'Read 10 pages',
              developmentArea: 'language',
              dueDate: '2026-04-22',
              status: 'pending',
              assignerName: 'Murat Kaya',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          task: {
            id: 21,
            childId: 1,
            title: 'Daily Reading Practice',
            description: 'Read 10 pages',
            developmentArea: 'language',
            dueDate: '2026-04-22',
            status: 'done',
            assignerName: 'Murat Kaya',
          },
        }),
      );

    render(<App />);
    signIn('Child');

    const tasksTab = await screen.findByRole('button', { name: 'Tasks' });
    fireEvent.click(tasksTab);

    expect(await screen.findByText('Daily Reading Practice')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Done' }));

    expect(await screen.findByText('Task marked as done')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as Done' })).toBeNull();
  });
});
