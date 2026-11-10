import { useState } from 'react';
import './App.css';
import SpecialistLinksPanel from './components/SpecialistLinksPanel.jsx';
import WeeklySchedulePanel from './components/WeeklySchedulePanel.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Parent', email: 'selin.yildiz@example.com' },
  { label: 'Specialist (Linked)', email: 'murat.kaya@example.com' },
  { label: 'Child', email: 'deniz.yildiz@example.com' },
];

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiPreview, setAiPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setAiPreview(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setToken(data.token);
      setUser(data.user);
      setActiveTab('overview');
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSummary() {
    setError('');
    try {
      const res = await fetch('/api/ai/preview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load AI summary');
        return;
      }
      setAiPreview(data);
    } catch {
      setError('Could not connect to server');
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setActiveTab('overview');
    setAiPreview(null);
    setError('');
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Child Development Platform</h1>
        <p className="subtitle">
          SENG 383 – Group 7 · Synthetic Demo Environment
        </p>
      </header>

      {!user ? (
        <section className="card">
          <h2>Sign in</h2>
          <p className="subtitle" style={{ marginBottom: '16px' }}>
            Your role is determined automatically from your account.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="demo-row">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="btn-secondary"
                onClick={() => fillDemo(acc.email)}
              >
                Demo: {acc.label}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="user-bar">
            <div>
              <strong>{user.name}</strong>
              <span className="badge">{user.role}</span>
              <div className="subtitle">{user.email}</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

          <hr style={{ margin: '18px 0', borderColor: '#ebefed' }} />

          {user.role === 'parent' && (
            <nav className="nav-tabs" aria-label="Parent navigation">
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'specialists' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('specialists')}
              >
                Linked Specialists
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'schedule' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Weekly Schedule
              </button>
            </nav>
          )}

          {user.role === 'specialist' && (
            <nav className="nav-tabs" aria-label="Specialist navigation">
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'children' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('children')}
              >
                Linked Children
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'schedule' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Weekly Schedule
              </button>
            </nav>
          )}

          {user.role === 'child' && (
            <nav className="nav-tabs" aria-label="Child navigation">
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'schedule' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Weekly Schedule
              </button>
            </nav>
          )}

          {activeTab === 'overview' && (
            <>
              {user.role === 'parent' && (
                <div>
                  <h2>Parent Dashboard (Walking Skeleton)</h2>
                  <p>
                    Access to weekly schedule, tasks, specialist links, entries,
                    documents, statistics, and role-based AI summary.
                  </p>
                </div>
              )}

              {user.role === 'specialist' && (
                <div>
                  <h2>Specialist Workspace (Walking Skeleton)</h2>
                  <p>
                    Access restricted to linked children (
                    {user.specialistType || 'specialist'}).
                  </p>
                </div>
              )}

              {user.role === 'child' && (
                <div>
                  <h2>My Tasks &amp; Schedule (Walking Skeleton)</h2>
                  <p>
                    Child view only: see your own tasks and schedule, and mark
                    tasks as done.
                  </p>
                </div>
              )}

              {(user.role === 'parent' || user.role === 'specialist') && (
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleLoadSummary}
                  >
                    Load Weekly AI Summary Preview
                  </button>

                  {aiPreview && (
                    <div className="ai-box">
                      <span className="ai-label">{aiPreview.label}</span>
                      <p style={{ margin: '6px 0' }}>{aiPreview.summary}</p>
                      <small className="subtitle">
                        Mode: {aiPreview.mode} · Based on{' '}
                        {aiPreview.sourceRecords.length} record(s)
                      </small>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="error-msg">{error}</p>}
            </>
          )}

          {activeTab === 'specialists' && user.role === 'parent' && (
            <SpecialistLinksPanel token={token} role="parent" />
          )}

          {activeTab === 'children' && user.role === 'specialist' && (
            <SpecialistLinksPanel token={token} role="specialist" />
          )}

          {activeTab === 'schedule' && (
            <WeeklySchedulePanel token={token} role={user.role} />
          )}
        </section>
      )}
    </main>
  );
}
