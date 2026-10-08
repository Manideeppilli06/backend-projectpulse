import { useState } from 'react';
import { api } from '../api/client';

const swatches = [
  ['Navy', '#003B5C'],
  ['Teal', '#0B7F7E'],
  ['Aqua', '#00B2A9'],
  ['Sage', '#D9E8E4'],
  ['Paper', '#F2F4F1'],
];

export default function SetupCheck() {
  const [result, setResult] = useState('');

  async function testBackend() {
    setResult('Checking...');
    try {
      const data = await api('/api/health');
      setResult(`Connected: ${data.app} is ${data.status}`);
    } catch (error) {
      setResult(`Failed: ${error.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px' }} className="stack">
      <h1>ProjectPulse setup check</h1>
      <p className="muted">If this looks right, the foundation is ready.</p>

      <div className="card stack">
        <h3>Colors</h3>
        <div className="row">
          {swatches.map(([name, hex]) => (
            <div key={hex} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: hex,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              />
              <small className="muted">{name}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="card stack">
        <h3>Poppins and buttons</h3>
        <p style={{ fontWeight: 400 }}>Regular 400: Plan work, track progress.</p>
        <p style={{ fontWeight: 500 }}>Medium 500: Plan work, track progress.</p>
        <p style={{ fontWeight: 600 }}>SemiBold 600: Plan work, track progress.</p>
        <div className="row">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Danger</button>
          <span className="badge">Badge</span>
        </div>
        <input className="input" placeholder="Click here to see the focus ring" />
      </div>

      <div className="card stack">
        <h3>Backend connection</h3>
        <div className="row">
          <button className="btn btn-primary" onClick={testBackend}>
            Test backend connection
          </button>
          <span>{result}</span>
        </div>
      </div>
    </div>
  );
}