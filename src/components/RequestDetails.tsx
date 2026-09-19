import React, { useState } from 'react';
import { NetworkEvent } from '../types/network';
import { JsonViewer } from './JsonViewer';
import { maskSensitiveHeaders, maskSensitiveBody } from '../core/security/masking';

interface RequestDetailsProps {
  event: NetworkEvent;
  onBack: () => void;
  maskSensitive: boolean;
}

type TabType = 'request' | 'response' | 'headers' | 'query' | 'timing';

export const RequestDetails: React.FC<RequestDetailsProps> = ({
  event,
  onBack,
  maskSensitive,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('request');
  const [jsonSearch, setJsonSearch] = useState('');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'request', label: 'Request' },
    { key: 'response', label: 'Response' },
    { key: 'headers', label: 'Headers' },
    { key: 'query', label: 'Query' },
    { key: 'timing', label: 'Timing' },
  ];

  const statusBadgeClass = event.state === 'pending'
    ? 'rndt-status-badge--pending'
    : event.state === 'error'
    ? 'rndt-status-badge--error'
    : event.state === 'aborted'
    ? 'rndt-status-badge--aborted'
    : 'rndt-status-badge--success';

  const methodColor = {
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#a855f7',
    DELETE: '#ef4444',
  }[event.method] || '#94a3b8';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="rndt-details">
      <div className="rndt-details__header">
        <div className="rndt-details__title">
          <button className="rndt-details__back" onClick={onBack}>
            ← Back
          </button>
          <span style={{ color: methodColor, fontFamily: 'monospace', fontWeight: 700 }}>
            {event.method}
          </span>
          <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '12px' }}>
            {getDisplayUrl(event.url)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="rndt-copy-btn"
            onClick={() => copyToClipboard(event.url)}
            title="Copy URL"
          >
            📋 URL
          </button>
          <button
            className="rndt-copy-btn"
            onClick={() => copyToClipboard(JSON.stringify(event.responseBody, null, 2))}
            title="Copy Response"
          >
            📋 Response
          </button>
        </div>
      </div>

      <div className="rndt-details__meta">
        <span className="rndt-details__meta-key">Status</span>
        <span className="rndt-details__meta-value">
          <span className={`rndt-status-badge ${statusBadgeClass}`}>
            {event.state === 'pending' ? 'Pending...' : `${event.status || 'ERR'} ${event.statusText || ''}`}
          </span>
        </span>
        <span className="rndt-details__meta-key">Duration</span>
        <span className="rndt-details__meta-value">
          {event.duration ? formatDuration(event.duration) : '—'}
        </span>
        <span className="rndt-details__meta-key">Type</span>
        <span className="rndt-details__meta-value">{event.type}</span>
        {event.responseSize && (
          <>
            <span className="rndt-details__meta-key">Size</span>
            <span className="rndt-details__meta-value">{formatSize(event.responseSize)}</span>
          </>
        )}
        {event.error && (
          <>
            <span className="rndt-details__meta-key">Error</span>
            <span className="rndt-details__meta-value" style={{ color: '#ef4444' }}>
              {event.error.message}
            </span>
          </>
        )}
      </div>

      <div className="rndt-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rndt-tab ${activeTab === tab.key ? 'rndt-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rndt-tab-content">
        {activeTab === 'request' && (
          <RequestTab event={event} maskSensitive={maskSensitive} />
        )}
        {activeTab === 'response' && (
          <ResponseTab
            event={event}
            jsonSearch={jsonSearch}
            onSearchChange={setJsonSearch}
            onCopy={() => copyToClipboard(JSON.stringify(event.responseBody, null, 2))}
          />
        )}
        {activeTab === 'headers' && (
          <HeadersTab event={event} maskSensitive={maskSensitive} />
        )}
        {activeTab === 'query' && <QueryTab event={event} />}
        {activeTab === 'timing' && <TimingTab event={event} />}
      </div>
    </div>
  );
};

const RequestTab: React.FC<{ event: NetworkEvent; maskSensitive: boolean }> = ({
  event,
  maskSensitive,
}) => {
  const body = maskSensitive ? maskSensitiveBody(event.requestBody, maskSensitive) : event.requestBody;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div className="rndt-headers-table__title">Method</div>
        <code style={{ color: '#22c55e', fontSize: '14px', fontWeight: 700 }}>{event.method}</code>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div className="rndt-headers-table__title">URL</div>
        <code style={{ color: '#e2e8f0', fontSize: '12px', wordBreak: 'break-all' }}>{event.url}</code>
      </div>
      {body != null && (
        <div>
          <div className="rndt-headers-table__title">Request Body</div>
          <div className="rndt-json-viewer">
            <JsonViewer data={body} />
          </div>
        </div>
      )}
    </div>
  );
};

const ResponseTab: React.FC<{
  event: NetworkEvent;
  jsonSearch: string;
  onSearchChange: (v: string) => void;
  onCopy: () => void;
}> = ({ event, jsonSearch, onSearchChange, onCopy }) => {
  if (event.state === 'pending') {
    return <div style={{ color: '#64748b' }}>Waiting for response...</div>;
  }

  if (event.error) {
    return (
      <div style={{ color: '#ef4444' }}>
        <strong>Error:</strong> {String(event.error.message)}
      </div>
    );
  }

  if (!event.responseBody) {
    return <div style={{ color: '#64748b' }}>No response body</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <input
          className="rndt-search"
          placeholder="Search JSON..."
          value={jsonSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="rndt-copy-btn" onClick={onCopy}>
          📋 Copy
        </button>
      </div>
      <div className="rndt-json-viewer">
        <JsonViewer data={event.responseBody} search={jsonSearch} />
      </div>
    </div>
  );
};

const HeadersTab: React.FC<{ event: NetworkEvent; maskSensitive: boolean }> = ({
  event,
  maskSensitive,
}) => {
  const requestHeaders = maskSensitive
    ? maskSensitiveHeaders(event.requestHeaders || {}, maskSensitive)
    : event.requestHeaders || {};

  const responseHeaders = maskSensitive
    ? maskSensitiveHeaders(event.responseHeaders || {}, maskSensitive)
    : event.responseHeaders || {};

  return (
    <div className="rndt-headers-table">
      {Object.keys(requestHeaders).length > 0 && (
        <div className="rndt-headers-table__section">
          <div className="rndt-headers-table__title">Request Headers</div>
          {Object.entries(requestHeaders).map(([key, value]) => (
            <div key={key} className="rndt-headers-table__row">
              <span className="rndt-headers-table__key">{key}</span>
              <span className="rndt-headers-table__value">{value}</span>
            </div>
          ))}
        </div>
      )}
      {Object.keys(responseHeaders).length > 0 && (
        <div className="rndt-headers-table__section">
          <div className="rndt-headers-table__title">Response Headers</div>
          {Object.entries(responseHeaders).map(([key, value]) => (
            <div key={key} className="rndt-headers-table__row">
              <span className="rndt-headers-table__key">{key}</span>
              <span className="rndt-headers-table__value">{value}</span>
            </div>
          ))}
        </div>
      )}
      {Object.keys(requestHeaders).length === 0 && Object.keys(responseHeaders).length === 0 && (
        <div style={{ color: '#64748b' }}>No headers captured</div>
      )}
    </div>
  );
};

const QueryTab: React.FC<{ event: NetworkEvent }> = ({ event }) => {
  const params = event.queryParams || {};
  const entries = Object.entries(params);

  if (entries.length === 0) {
    return <div style={{ color: '#64748b' }}>No query parameters</div>;
  }

  return (
    <div className="rndt-query-table">
      {entries.map(([key, value]) => (
        <div key={key} className="rndt-query-table__row">
          <span className="rndt-query-table__key">{key}</span>
          <span className="rndt-query-table__value">{value}</span>
        </div>
      ))}
    </div>
  );
};

const TimingTab: React.FC<{ event: NetworkEvent }> = ({ event }) => {
  const startDate = new Date(event.startTime + performance.timeOrigin);
  const endDate = event.endTime
    ? new Date(event.endTime + performance.timeOrigin)
    : null;

  return (
    <div className="rndt-timing">
      <div className="rndt-timing__row">
        <span className="rndt-timing__label">Started</span>
        <span className="rndt-timing__value">
          {startDate.toLocaleTimeString()}.{String(startDate.getMilliseconds()).padStart(3, '0')}
        </span>
      </div>
      <div className="rndt-timing__row">
        <span className="rndt-timing__label">Completed</span>
        <span className="rndt-timing__value">
          {endDate
            ? `${endDate.toLocaleTimeString()}.${String(endDate.getMilliseconds()).padStart(3, '0')}`
            : '—'}
        </span>
      </div>
      <div className="rndt-timing__row">
        <span className="rndt-timing__label">Duration</span>
        <span className="rndt-timing__value">
          {event.duration ? formatDuration(event.duration) : '—'}
        </span>
      </div>
      {event.responseSize && (
        <div className="rndt-timing__row">
          <span className="rndt-timing__label">Response Size</span>
          <span className="rndt-timing__value">{formatSize(event.responseSize)}</span>
        </div>
      )}
    </div>
  );
};

function getDisplayUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default RequestDetails;
