import { useEffect, useState } from 'react';

export default function WeeklySchedulePanel({ token, role }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-04-20');
  const [eventTime, setEventTime] = useState('14:00');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const canEdit = role === 'parent' || role === 'specialist';

  useEffect(() => {
    let active = true;
    async function loadChildren() {
      setError('');
      try {
        const res = await fetch('/api/children', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load children');
          return;
        }
        if (active) {
          const list = data.children || [];
          setChildren(list);
          if (list.length > 0) {
            setSelectedChildId(list[0].id);
          }
        }
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadChildren();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedChildId) return;
    let active = true;
    async function loadEvents() {
      setError('');
      try {
        const res = await fetch(`/api/children/${selectedChildId}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load schedule');
          return;
        }
        if (active) {
          setEvents(data.events || []);
        }
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadEvents();
    return () => {
      active = false;
    };
  }, [selectedChildId, token]);

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/children/${selectedChildId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, eventDate, eventTime, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add schedule event');
        return;
      }
      setEvents((prev) => [...prev, data.event]);
      setTitle('');
      setStatusMsg('Schedule event added');
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');

    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete schedule event');
        return;
      }
      setEvents((prev) => prev.filter((item) => item.id !== eventId));
      setStatusMsg('Schedule event removed');
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="panel-section">
      <h2>Weekly Schedule</h2>
      <p className="subtitle">
        Shared weekly calendar for school, therapy, medical, and home routines.
      </p>

      {children.length > 1 && (
        <div className="field" style={{ marginTop: '12px' }}>
          <label htmlFor="schedule-child-select">Select Child</label>
          <select
            id="schedule-child-select"
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(Number(e.target.value))}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}
      {statusMsg && <p className="success-msg">{statusMsg}</p>}

      {canEdit && selectedChildId && (
        <form
          onSubmit={handleAddEvent}
          className="sub-card"
          style={{ marginTop: '14px' }}
        >
          <h3>Add Schedule Event</h3>
          <div className="field">
            <label htmlFor="event-title">Event Title</label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Speech Therapy Session"
              required
            />
          </div>
          <div className="demo-row" style={{ marginTop: '8px' }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="event-date">Date</label>
              <input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="event-time">Time</label>
              <input
                id="event-time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="event-category">Category</label>
              <select
                id="event-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="school">School</option>
                <option value="therapy">Therapy</option>
                <option value="medical">Medical</option>
                <option value="sport">Sport</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            Add Event
          </button>
        </form>
      )}

      <div style={{ marginTop: '16px' }}>
        {events.length === 0 ? (
          <p className="subtitle">No schedule events recorded for this child.</p>
        ) : (
          <ul className="item-list">
            {events.map((ev) => (
              <li key={ev.id} className="item-row">
                <div>
                  <strong>{ev.title}</strong>{' '}
                  <span className="badge">{ev.category}</span>
                  <div className="subtitle">
                    {ev.eventDate} at {ev.eventTime}
                    {ev.creatorName ? ` · Added by ${ev.creatorName}` : ''}
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleDeleteEvent(ev.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
