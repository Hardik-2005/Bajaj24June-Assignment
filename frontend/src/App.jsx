import React, { useState } from 'react';
import './index.css';
import TreeCard from './components/TreeCard';
import SummaryStats from './components/SummaryStats';
import BadgeList from './components/BadgeList';

// Change this to your deployed backend URL before deploying the frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EXAMPLE_INPUT = `A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->`;

export default function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const parseInput = (raw) => {
    // Accept comma-separated or newline-separated entries
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    const data = parseInput(input);

    try {
      const res = await fetch(`${API_URL}/bfhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded with ${res.status}: ${text}`);
      }
      const json = await res.json();
      setResponse(json);
    } catch (err) {
      setError(err.message || 'Failed to reach the API. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExample = () => {
    setInput(EXAMPLE_INPUT);
    setResponse(null);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setResponse(null);
    setError(null);
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-badge">
            <span className="dot" />
            REST API Challenge
          </div>
          <h1>BFHL Tree Visualizer</h1>
          <p>
            Analyze parent-child relationships, detect cycles, and explore tree
            hierarchies in real time.
          </p>
        </header>

        {/* Input Panel */}
        <div className="input-panel">
          <div className="panel-label">
            <span className="icon">⌨</span>
            Input Data
          </div>
          <div className="textarea-wrapper">
            <textarea
              id="data-input"
              placeholder={`Enter edges like: A->B, A->C, B->D\nor one per line:\nA->B\nA->C`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
              }}
              spellCheck={false}
            />
          </div>
          <p className="input-hint">
            Separate entries with commas or newlines · Ctrl+Enter to submit
          </p>
          <div className="input-actions">
            <button
              id="submit-btn"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  <span>▶</span>
                  Analyze Edges
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={handleClear}>
              ✕ Clear
            </button>
            <button className="btn-example" onClick={handleLoadExample}>
              ✦ Load example
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="results-container">
            {/* Identity */}
            <div className="section-title">Identity</div>
            <div className="identity-card">
              {[
                ['user_id', response.user_id],
                ['email_id', response.email_id],
                ['roll', response.college_roll_number],
              ].map(([k, v]) => (
                <div className="identity-chip" key={k}>
                  <span className="key">{k}:</span>
                  <span className="val">{v}</span>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="section-title">Summary</div>
            <SummaryStats summary={response.summary} />

            {/* Hierarchies */}
            <div className="section-title">Tree Hierarchies</div>
            <div className="hierarchies-grid">
              {response.hierarchies.map((h, i) => (
                <TreeCard key={`${h.root}-${i}`} hierarchy={h} />
              ))}
            </div>

            {/* Invalid & Duplicates */}
            <div className="section-title">Edge Analysis</div>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
              <div className="info-panel">
                <div className="panel-label" style={{ marginBottom: '14px' }}>
                  <span>✕</span>
                  Invalid Entries ({response.invalid_entries.length})
                </div>
                <BadgeList items={response.invalid_entries} variant="invalid" />
              </div>
              <div className="info-panel">
                <div className="panel-label" style={{ marginBottom: '14px' }}>
                  <span>⎘</span>
                  Duplicate Edges ({response.duplicate_edges.length})
                </div>
                <BadgeList items={response.duplicate_edges} variant="duplicate" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
