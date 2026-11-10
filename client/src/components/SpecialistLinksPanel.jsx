import { useState, useEffect } from 'react';

const SPECIALIST_TYPES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'psychologist', label: 'Psychologist' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'special_education', label: 'Special Education Teacher' },
  { value: 'coach', label: 'Coach' },
];

export default function SpecialistLinksPanel({ token, role }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [email, setEmail] = useState('');
  const [specialistType, setSpecialistType] = useState('psychologist');
  const [confirmUnlinkId, setConfirmUnlinkId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          setChildren(data.children || []);
          if (data.children?.length > 0) {
            setSelectedChildId(data.children[0].id);
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
    if (role !== 'parent' || !selectedChildId) return;
    let active = true;
    async function loadSpecialists() {
      try {
        const res = await fetch(`/api/children/${selectedChildId}/specialists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load specialists');
          return;
        }
        if (active) setSpecialists(data.specialists || []);
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadSpecialists();
    return () => {
      active = false;
    };
  }, [token, role, selectedChildId]);

  async function handleLinkSpecialist(e) {
    e.preventDefault();
    if (!selectedChildId) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/children/${selectedChildId}/specialists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, specialistType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not link specialist');
        return;
      }
      setSpecialists((prev) => [...prev, data.specialist]);
      setEmail('');
    } catch {
      setError('Could not connect to server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmUnlink(specialistId) {
    if (!selectedChildId) return;
    setError('');
    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/specialists/${specialistId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not unlink specialist');
        return;
      }
      setSpecialists((prev) =>
        prev.filter((s) => s.specialistId !== specialistId),
      );
      setConfirmUnlinkId(null);
    } catch {
      setError('Could not connect to server');
    }
  }

  if (role === 'specialist') {
    return (
      <div>
        <h2>Linked Children</h2>
        {error && <p className="error-msg">{error}</p>}
        {children.length === 0 ? (
          <p className="subtitle">You are not currently linked to any child.</p>
        ) : (
          <ul className="list-clean">
            {children.map((child) => (
              <li key={child.id} className="list-item">
                <div>
                  <strong>{child.name}</strong> · Age {child.age}
                  {child.grade ? ` (${child.grade})` : ''}
                </div>
                <span className="badge">{child.specialistType}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const currentChild = children.find((c) => c.id === selectedChildId);

  return (
    <div>
      <h2>
        Linked Specialists{currentChild ? ` – ${currentChild.name}` : ''}
      </h2>
      <p className="subtitle" style={{ marginBottom: '16px' }}>
        Linked specialists can access records for this child. Unlinked
        specialists have no access.
      </p>

      {error && <p className="error-msg">{error}</p>}

      {specialists.length === 0 ? (
        <p className="subtitle">No specialists linked yet.</p>
      ) : (
        <ul className="list-clean">
          {specialists.map((sp) => (
            <li key={sp.specialistId} className="list-item">
              <div>
                <strong>{sp.name}</strong>
                <span className="badge">{sp.specialistType}</span>
                <div className="subtitle">{sp.email}</div>
              </div>

              {confirmUnlinkId === sp.specialistId ? (
                <div className="confirm-box">
                  <span>Remove link for {sp.name}?</span>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleConfirmUnlink(sp.specialistId)}
                  >
                    Confirm Unlink
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmUnlinkId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmUnlinkId(sp.specialistId)}
                >
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleLinkSpecialist}
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #ebefed',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>Link a Specialist</h3>

        <div className="field">
          <label htmlFor="specialist-email">Specialist Email</label>
          <input
            id="specialist-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elif.arslan@example.com"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="specialist-type">Specialist Type</label>
          <select
            id="specialist-type"
            value={specialistType}
            onChange={(e) => setSpecialistType(e.target.value)}
          >
            {SPECIALIST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Linking...' : 'Link Specialist'}
        </button>
      </form>
    </div>
  );
}
