import { useEffect, useState } from 'react';

export default function TasksPanel({ token, role }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [developmentArea, setDevelopmentArea] = useState('cognitive');
  const [dueDate, setDueDate] = useState('2026-04-22');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const canAssign = role === 'parent' || role === 'specialist';
  const canComplete = role === 'child';

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
    async function loadTasks() {
      setError('');
      try {
        const res = await fetch(`/api/children/${selectedChildId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load tasks');
          return;
        }
        if (active) {
          setTasks(data.tasks || []);
        }
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadTasks();
    return () => {
      active = false;
    };
  }, [selectedChildId, token]);

  async function handleAssignTask(e) {
    e.preventDefault();
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/children/${selectedChildId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          developmentArea,
          dueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to assign task');
        return;
      }
      setTasks((prev) => [...prev, data.task]);
      setTitle('');
      setDescription('');
      setStatusMsg('Task assigned');
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleMarkDone(taskId) {
    if (!selectedChildId) return;
    setError('');
    setStatusMsg('');

    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'done' }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to mark task as done');
        return;
      }
      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? data.task : item)),
      );
      setStatusMsg('Task marked as done');
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="panel-section">
      <h2>Tasks</h2>
      <p className="subtitle">
        {canComplete
          ? 'Your assigned tasks. Mark tasks as done when you finish them.'
          : 'Assign development tasks and track completion status.'}
      </p>

      {children.length > 1 && (
        <div className="field" style={{ marginTop: '12px' }}>
          <label htmlFor="tasks-child-select">Select Child</label>
          <select
            id="tasks-child-select"
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

      {canAssign && selectedChildId && (
        <form
          onSubmit={handleAssignTask}
          className="sub-card"
          style={{ marginTop: '14px' }}
        >
          <h3>Assign Task</h3>
          <div className="field">
            <label htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily reading practice (15 min)"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="task-desc">Description</label>
            <input
              id="task-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional instructions or notes"
            />
          </div>
          <div className="demo-row" style={{ marginTop: '8px' }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="task-area">Development Area</label>
              <select
                id="task-area"
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
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '8px' }}
          >
            Assign Task
          </button>
        </form>
      )}

      <div style={{ marginTop: '16px' }}>
        {tasks.length === 0 ? (
          <p className="subtitle">No tasks assigned for this child.</p>
        ) : (
          <ul className="item-list">
            {tasks.map((t) => (
              <li key={t.id} className="item-row">
                <div>
                  <strong>{t.title}</strong>{' '}
                  <span className="badge">{t.developmentArea}</span>{' '}
                  <span className="badge">{t.status}</span>
                  {t.description && (
                    <div className="subtitle">{t.description}</div>
                  )}
                  <div className="subtitle">
                    Due: {t.dueDate}
                    {t.assignerName ? ` · Assigned by ${t.assignerName}` : ''}
                  </div>
                </div>
                {canComplete && t.status !== 'done' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleMarkDone(t.id)}
                  >
                    Mark as Done
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
