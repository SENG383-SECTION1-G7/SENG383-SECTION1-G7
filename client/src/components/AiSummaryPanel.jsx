import { useEffect, useState } from 'react';

export default function AiSummaryPanel({ token }) {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [weekStart, setWeekStart] = useState('2026-04-20');
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (active && data.children && data.children.length > 0) {
          setSelectedChildId(data.children[0].id);
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
    async function loadSummaries() {
      setError('');
      try {
        const res = await fetch(`/api/children/${selectedChildId}/summaries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load summaries');
          return;
        }
        if (active) setSummaries(data.summaries || []);
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadSummaries();
    return () => {
      active = false;
    };
  }, [selectedChildId, token]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!selectedChildId) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${selectedChildId}/summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not generate AI summary');
        return;
      }
      setSummaries((prev) => [data.summary, ...prev]);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(summaryId, feedback) {
    if (!selectedChildId) return;
    setError('');
    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/summaries/${summaryId}/feedback`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ feedback }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit feedback');
        return;
      }
      setSummaries((prev) =>
        prev.map((item) => (item.id === summaryId ? data.summary : item)),
      );
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="panel-section">
      <h2>Role-Based AI Summary</h2>
      <p className="subtitle">
        Generates a weekly informational summary linked to authorized source
        records.
      </p>

      {error && <p className="error-msg">{error}</p>}

      {selectedChildId && (
        <form
          onSubmit={handleGenerate}
          className="sub-card"
          style={{ marginTop: '14px' }}
        >
          <div className="field" style={{ maxWidth: '240px' }}>
            <label htmlFor="ai-week-start">Week Start</label>
            <input
              id="ai-week-start"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Generating...' : 'Generate Weekly AI Summary'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '16px' }}>
        {summaries.length === 0 ? (
          <p className="subtitle">No summaries generated yet.</p>
        ) : (
          summaries.map((item) => (
            <div key={item.id} className="ai-box" style={{ marginBottom: '12px' }}>
              <span className="ai-label">{item.label}</span>{' '}
              <span className="badge">{item.readerRole}</span>{' '}
              <span className="subtitle">Week of {item.weekStart}</span>
              <p style={{ margin: '8px 0' }}>{item.summaryText}</p>
              {item.sourceRecords && item.sourceRecords.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong className="subtitle">Source records:</strong>
                  <ul style={{ margin: '4px 0 8px 18px', padding: 0 }}>
                    {item.sourceRecords.map((src) => (
                      <li key={`${src.type}-${src.id}`} className="subtitle">
                        [{src.type}] {src.title} ({src.date})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="demo-row" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className={`btn-secondary ${item.feedback === 'helpful' ? 'tab-active' : ''}`}
                  onClick={() => handleFeedback(item.id, 'helpful')}
                >
                  Helpful
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${item.feedback === 'incorrect' ? 'tab-active' : ''}`}
                  onClick={() => handleFeedback(item.id, 'incorrect')}
                >
                  Incorrect
                </button>
                {item.feedback && (
                  <span className="subtitle">
                    Feedback recorded: <strong>{item.feedback}</strong>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
