import { useEffect, useState } from 'react';

export default function SpecialistEntriesPanel({ token, role, userId }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryDate, setEntryDate] = useState('2026-04-21');
  const [entryType, setEntryType] = useState('observation');
  const [developmentArea, setDevelopmentArea] = useState('cognitive');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const isSpecialist = role === 'specialist';

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
          if (list.length > 0) setSelectedChildId(list[0].id);
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
    async function loadEntries() {
      setError('');
      try {
        const res = await fetch(`/api/children/${selectedChildId}/entries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load entries');
          return;
        }
        if (active) setEntries(data.entries || []);
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadEntries();
    return () => {
      active = false;
    };
  }, [selectedChildId, token]);

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');
    try {
      const res = await fetch(`/api/children/${selectedChildId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryDate,
          entryType,
          developmentArea,
          title,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add entry');
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setTitle('');
      setContent('');
      setStatusMsg('Observation entry saved');
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleSaveEdit(entryId) {
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');
    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/entries/${entryId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: editTitle, content: editContent }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update entry');
        return;
      }
      setEntries((prev) =>
        prev.map((item) => (item.id === entryId ? data.entry : item)),
      );
      setEditingId(null);
      setStatusMsg('Entry updated and marked as edited');
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="panel-section">
      <h2>Specialist Entries</h2>
      <p className="subtitle">
        Dated observations visible to parent and linked specialists only.
      </p>

      {error && <p className="error-msg">{error}</p>}
      {statusMsg && <p className="success-msg">{statusMsg}</p>}

      {isSpecialist && selectedChildId && (
        <form
          onSubmit={handleAddEntry}
          className="sub-card"
          style={{ marginTop: '14px' }}
        >
          <h3>Add Observation Entry</h3>
          <div className="field">
            <label htmlFor="entry-title">Title</label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Session progress observation"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="entry-content">Observation Notes</label>
            <input
              id="entry-content"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write factual observation details"
              required
            />
          </div>
          <div className="demo-row" style={{ marginTop: '8px' }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="entry-date">Date</label>
              <input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="entry-type">Type</label>
              <select
                id="entry-type"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
              >
                <option value="observation">Observation</option>
                <option value="progress">Progress</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="entry-area">Area</label>
              <select
                id="entry-area"
                value={developmentArea}
                onChange={(e) => setDevelopmentArea(e.target.value)}
              >
                <option value="cognitive">Cognitive</option>
                <option value="language">Language</option>
                <option value="social">Social</option>
                <option value="emotional">Emotional</option>
                <option value="motor">Motor</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '8px' }}
          >
            Save Entry
          </button>
        </form>
      )}

      <div style={{ marginTop: '16px' }}>
        {entries.length === 0 ? (
          <p className="subtitle">No specialist entries recorded yet.</p>
        ) : (
          <ul className="item-list">
            {entries.map((entry) => (
              <li key={entry.id} className="item-row">
                {editingId === entry.id ? (
                  <div style={{ width: '100%' }}>
                    <input
                      type="text"
                      aria-label="Edit entry title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <input
                      type="text"
                      aria-label="Edit entry content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ marginTop: '6px' }}
                    />
                    <div className="demo-row" style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSaveEdit(entry.id)}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{entry.title}</strong>{' '}
                      <span className="badge">{entry.developmentArea}</span>{' '}
                      {Boolean(entry.isEdited) && (
                        <span className="badge">edited</span>
                      )}
                      <p style={{ margin: '4px 0' }}>{entry.content}</p>
                      <div className="subtitle">
                        {entry.entryDate} · {entry.authorName}
                      </div>
                    </div>
                    {isSpecialist && (!userId || entry.authorId === userId) && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditTitle(entry.title);
                          setEditContent(entry.content);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
