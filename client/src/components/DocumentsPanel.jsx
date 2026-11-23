import { useEffect, useState } from 'react';

export default function DocumentsPanel({ token }) {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('report');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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
    async function loadDocs() {
      setError('');
      try {
        const res = await fetch(`/api/children/${selectedChildId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          if (active) setError(data.error || 'Could not load documents');
          return;
        }
        if (active) setDocuments(data.documents || []);
      } catch {
        if (active) setError('Could not connect to server');
      }
    }
    loadDocs();
    return () => {
      active = false;
    };
  }, [selectedChildId, token]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedChildId || !file) {
      setError('Please select a PDF or image file');
      return;
    }
    setError('');
    setStatusMsg('');

    const formData = new FormData();
    formData.append('file', file);
    if (docName.trim()) formData.append('name', docName.trim());
    formData.append('docType', docType);

    try {
      const res = await fetch(`/api/children/${selectedChildId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setDocuments((prev) => [data.document, ...prev]);
      setDocName('');
      setFile(null);
      setStatusMsg('Document uploaded');
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleDownload(doc) {
    if (!selectedChildId) return;
    setError('');
    try {
      const res = await fetch(
        `/api/children/${selectedChildId}/documents/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        setError('Could not download document');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="panel-section">
      <h2>Documents</h2>
      <p className="subtitle">
        Upload and download PDF or image reports (parent &amp; linked
        specialists only).
      </p>

      {error && <p className="error-msg">{error}</p>}
      {statusMsg && <p className="success-msg">{statusMsg}</p>}

      {selectedChildId && (
        <form
          onSubmit={handleUpload}
          className="sub-card"
          style={{ marginTop: '14px' }}
        >
          <h3>Upload Document</h3>
          <div className="field">
            <label htmlFor="doc-name">Document Name</label>
            <input
              id="doc-name"
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Speech Evaluation Report.pdf"
            />
          </div>
          <div className="demo-row" style={{ marginTop: '8px' }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="doc-type">Document Type</label>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="report">Report</option>
                <option value="assessment">Assessment</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="doc-file">File (PDF / Image)</label>
              <input
                id="doc-file"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '8px' }}
          >
            Upload Document
          </button>
        </form>
      )}

      <div style={{ marginTop: '16px' }}>
        {documents.length === 0 ? (
          <p className="subtitle">No documents uploaded for this child.</p>
        ) : (
          <ul className="item-list">
            {documents.map((doc) => (
              <li key={doc.id} className="item-row">
                <div>
                  <strong>{doc.name}</strong>{' '}
                  <span className="badge">{doc.docType}</span>
                  <div className="subtitle">
                    Uploaded by {doc.uploaderName} · {doc.createdAt}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDownload(doc)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
