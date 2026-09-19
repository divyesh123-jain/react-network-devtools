import React, { useState } from 'react';
import { NetworkDevTools } from './components/NetworkDevTools';

// Mock API endpoints using fetch
const MOCK_BASE = 'https://jsonplaceholder.typicode.com';

function App() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const makeRequest = async (name: string, fn: () => Promise<string>) => {
    setLoading(name);
    try {
      const result = await fn();
      setResults((prev) => ({ ...prev, [name]: result }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [name]: `Error: ${err instanceof Error ? err.message : 'Unknown'}` }));
    } finally {
      setLoading(null);
    }
  };

  const handleGetUsers = () =>
    makeRequest('getUsers', async () => {
      const res = await fetch(`${MOCK_BASE}/users?_limit=5`);
      const data = await res.json();
      return `Fetched ${data.length} users`;
    });

  const handlePostUser = () =>
    makeRequest('postUser', async () => {
      const res = await fetch(`${MOCK_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.demo-token',
        },
        body: JSON.stringify({
          name: 'Divyesh',
          email: 'divyesh@example.com',
          username: 'divyesh_dev',
        }),
      });
      const data = await res.json();
      return `Created user: ${data.name}`;
    });

  const handleSlowRequest = () =>
    makeRequest('slowRequest', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(`${MOCK_BASE}/photos?_limit=50&_delay=3000`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        return `Slow response: ${data.length} photos`;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    });

  const handleErrorRequest = () =>
    makeRequest('errorRequest', async () => {
      const res = await fetch(`${MOCK_BASE}/posts/999999/comments`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return 'Success';
    });

  const handleNetworkError = () =>
    makeRequest('networkError', async () => {
      const res = await fetch('https://this-domain-does-not-exist-xyz123.com/api/data');
      return await res.text();
    });

  const handleLargeResponse = () =>
    makeRequest('largeResponse', async () => {
      const res = await fetch(`${MOCK_BASE}/photos?_limit=100`);
      const data = await res.json();
      return `Large response: ${data.length} items (${JSON.stringify(data).length} bytes)`;
    });

  const handleAbortRequest = () =>
    makeRequest('abortRequest', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100);
      const res = await fetch(`${MOCK_BASE}/albums?_limit=100`, {
        signal: controller.signal,
      });
      return await res.json();
    });

  const handlePutRequest = () =>
    makeRequest('putRequest', async () => {
      const res = await fetch(`${MOCK_BASE}/users/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          name: 'Updated User',
          email: 'updated@example.com',
          phone: '1-770-736-8031',
        }),
      });
      const data = await res.json();
      return `Updated: ${data.name}`;
    });

  const handleDeleteRequest = () =>
    makeRequest('deleteRequest', async () => {
      const res = await fetch(`${MOCK_BASE}/posts/1`, {
        method: 'DELETE',
      });
      return `Deleted (status: ${res.status})`;
    });

  const handlePatchRequest = () =>
    makeRequest('patchRequest', async () => {
      const res = await fetch(`${MOCK_BASE}/users/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'devtools-test',
        },
        body: JSON.stringify({ name: 'Patched User' }),
      });
      const data = await res.json();
      return `Patched: ${data.name}`;
    });

  const handleMultipleRequests = async () => {
    setLoading('multiple');
    try {
      await Promise.all([
        fetch(`${MOCK_BASE}/users?_limit=3`),
        fetch(`${MOCK_BASE}/posts?_limit=3`),
        fetch(`${MOCK_BASE}/comments?_limit=3`),
        fetch(`${MOCK_BASE}/albums?_limit=3`),
      ]);
      setResults((prev) => ({ ...prev, multiple: '4 parallel requests completed' }));
    } catch (err) {
      setResults((prev) => ({ ...prev, multiple: `Error: ${err}` }));
    } finally {
      setLoading(null);
    }
  };

  const handleXHRRequest = () =>
    makeRequest('xhrRequest', async () => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${MOCK_BASE}/todos?_limit=5`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(`XHR: Fetched ${data.length} todos`);
          } else {
            reject(new Error(`XHR Error: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('XHR Network Error'));
        xhr.send();
      });
    });

  const buttons = [
    { name: 'getUsers', label: 'GET Users', handler: handleGetUsers, color: '#22c55e' },
    { name: 'postUser', label: 'POST User', handler: handlePostUser, color: '#3b82f6' },
    { name: 'putRequest', label: 'PUT User', handler: handlePutRequest, color: '#f59e0b' },
    { name: 'patchRequest', label: 'PATCH User', handler: handlePatchRequest, color: '#a855f7' },
    { name: 'deleteRequest', label: 'DELETE Post', handler: handleDeleteRequest, color: '#ef4444' },
    { name: 'slowRequest', label: '⏱ Slow Request', handler: handleSlowRequest, color: '#f59e0b' },
    { name: 'errorRequest', label: '❌ Error Request', handler: handleErrorRequest, color: '#ef4444' },
    { name: 'networkError', label: '🔌 Network Error', handler: handleNetworkError, color: '#ef4444' },
    { name: 'largeResponse', label: '📦 Large Response', handler: handleLargeResponse, color: '#3b82f6' },
    { name: 'abortRequest', label: '⛔ Abort Request', handler: handleAbortRequest, color: '#94a3b8' },
    { name: 'xhrRequest', label: '🔄 XHR Request', handler: handleXHRRequest, color: '#06b6d4' },
    { name: 'multiple', label: '⚡ Parallel Requests', handler: handleMultipleRequests, color: '#8b5cf6' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
        }}>
          React Network DevTools
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          maxWidth: '600px',
          margin: '0 auto 8px',
          lineHeight: 1.6,
        }}>
          A lightweight Network tab for your React development environment.
        </p>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          Click the ⚡ button in the bottom-right corner to open the DevTools panel,
          then trigger requests below to see them captured in real-time.
        </p>
      </div>

      {/* Playground */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 20px 120px',
      }}>
        <div style={{
          background: 'rgba(30, 31, 53, 0.8)',
          borderRadius: '16px',
          border: '1px solid #2d2f45',
          padding: '32px',
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#a78bfa',
          }}>
            🎮 Network Playground
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            Click any button to make a network request. Watch the DevTools panel capture it automatically.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {buttons.map((btn) => (
              <button
                key={btn.name}
                onClick={btn.handler}
                disabled={loading !== null}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${btn.color}33`,
                  background: loading === btn.name
                    ? `${btn.color}22`
                    : 'rgba(30, 31, 53, 0.6)',
                  color: btn.color,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading !== null ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  opacity: loading !== null && loading !== btn.name ? 0.5 : 1,
                }}
              >
                {loading === btn.name ? '⏳ Loading...' : btn.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {Object.keys(results).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Results
              </h3>
              <div style={{
                display: 'grid',
                gap: '8px',
              }}>
                {Object.entries(results).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: value.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      border: `1px solid ${value.startsWith('Error') ? '#ef444433' : '#22c55e33'}`,
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: value.startsWith('Error') ? '#fca5a5' : '#86efac',
                    }}
                  >
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Usage Section */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(30, 31, 53, 0.8)',
          borderRadius: '16px',
          border: '1px solid #2d2f45',
          padding: '32px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#a78bfa',
          }}>
            📦 Quick Start
          </h2>
          <div style={{
            background: '#0f0c29',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: '"SF Mono", Monaco, "Cascadia Code", monospace',
            fontSize: '13px',
            lineHeight: 1.8,
            color: '#e2e8f0',
            border: '1px solid #2d2f45',
          }}>
            <div><span style={{ color: '#64748b' }}>// Install the package</span></div>
            <div><span style={{ color: '#22c55e' }}>npm install react-network-devtools</span></div>
            <br />
            <div><span style={{ color: '#64748b' }}>// Add to your app</span></div>
            <div><span style={{ color: '#a78bfa' }}>import</span> {'{ NetworkDevTools }'} <span style={{ color: '#a78bfa' }}>from</span> <span style={{ color: '#22c55e' }}>'react-network-devtools'</span>;</div>
            <br />
            <div><span style={{ color: '#a78bfa' }}>function</span> <span style={{ color: '#3b82f6' }}>App</span>() {'{'}</div>
            <div>  <span style={{ color: '#a78bfa' }}>return</span> (</div>
            <div>    &lt;&gt;</div>
            <div>      &lt;YourApp /&gt;</div>
            <div>      {'{'}<span style={{ color: '#f59e0b' }}>import</span>.meta.env.DEV && &lt;<span style={{ color: '#3b82f6' }}>NetworkDevTools</span> /&gt;{'}'}</div>
            <div>    &lt;/&gt;</div>
            <div>  );</div>
            <div>{'}'}</div>
          </div>
        </div>

        {/* Features */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          {[
            { icon: '🔍', title: 'Auto Capture', desc: 'Automatically intercepts fetch & XHR requests' },
            { icon: '📋', title: 'Inspect Everything', desc: 'View request/response bodies, headers, timing' },
            { icon: '🔒', title: 'Security', desc: 'Sensitive data like tokens are masked automatically' },
            { icon: '⚡', title: 'Zero Config', desc: 'Works out of the box with no modifications needed' },
            { icon: '🎯', title: 'Filter & Search', desc: 'Filter by method, status, errors, or slow requests' },
            { icon: '📦', title: 'Lightweight', desc: 'Minimal dependencies, scoped CSS, no conflicts' },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: 'rgba(30, 31, 53, 0.6)',
                borderRadius: '12px',
                border: '1px solid #2d2f45',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{feature.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#e2e8f0' }}>
                {feature.title}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Network DevTools Component */}
      <NetworkDevTools
        position="bottom-right"
        maxRequests={500}
        maxBodySize={1_000_000}
        slowRequestThreshold={1000}
        captureBodies={true}
        captureHeaders={true}
        maskSensitiveData={true}
        defaultOpen={false}
      />
    </div>
  );
}

export default App;
