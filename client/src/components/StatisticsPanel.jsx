import { useEffect, useState } from 'react';

export default function StatisticsPanel({ token }) {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [weekStart, setWeekStart] = useState('');
  const [stats, setStats] = useState(null);
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
    async function loadStats() {
      setError('');
      const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
      try {
        const res = await fetch(
          `/api/children/${selectedChildId}/statistics${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load statistics');
          return;
        }
        if (active) setStats(data);
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [selectedChildId, weekStart, token]);

  return (
    <div className="panel-section">
      <h2>Weekly Statistics</h2>
      <p className="subtitle">
        Task completion rate in total and broken down by development area.
      </p>

      <div className="field" style={{ marginTop: '12px', maxWidth: '240px' }}>
        <label htmlFor="stats-week">Filter by Week Start (optional)</label>
        <input
          id="stats-week"
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
      </div>

      {error && <p className="error-msg">{error}</p>}

      {stats && (
        <div className="sub-card" style={{ marginTop: '14px' }}>
          <h3>Overall Completion: {stats.completionRate}%</h3>
          <p className="subtitle">
            {stats.hasTasks
              ? `${stats.completedTasks} of ${stats.totalTasks} task(s) completed`
              : 'No tasks recorded for this period.'}
          </p>

          {stats.byArea && stats.byArea.length > 0 && (
            <ul className="item-list" style={{ marginTop: '12px' }}>
              {stats.byArea.map((area) => (
                <li key={area.developmentArea} className="item-row">
                  <div>
                    <strong>{area.developmentArea}</strong>
                    <div className="subtitle">
                      {area.completed} / {area.total} done
                    </div>
                  </div>
                  <span className="badge">{area.completionRate}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
