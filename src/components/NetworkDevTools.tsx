import React, { useState, useMemo } from 'react';
import { NetworkDevToolsProps, NetworkEvent, FilterType, MethodFilter } from '../types/network';
import { useNetworkEvents } from '../hooks/useNetworkEvents';
import { useNetworkInterceptors } from '../hooks/useNetworkInterceptors';
import { getNetworkStore } from '../core/store/network-store';
import { RequestRow } from './RequestRow';
import { RequestDetails } from './RequestDetails';
import '../styles/devtools.css';

export const NetworkDevTools: React.FC<NetworkDevToolsProps> = (props) => {
  const {
    position = 'bottom-right',
    maxRequests = 500,
    maxBodySize = 1_000_000,
    slowRequestThreshold = 1000,
    captureBodies = true,
    captureHeaders = true,
    maskSensitiveData = true,
    defaultOpen = false,
  } = props;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');

  const events = useNetworkEvents();
  const { clearEvents } = useNetworkInterceptors({
    maxRequests,
    maxBodySize,
    slowRequestThreshold,
    captureBodies,
    captureHeaders,
    maskSensitiveData,
  });

  // Filter events
  const filteredEvents = useMemo((): NetworkEvent[] => {
    let result: NetworkEvent[] = events.slice();

    // Apply type filter
    if (filter === 'fetch') {
      result = result.filter((e: NetworkEvent) => e.type === 'fetch');
    } else if (filter === 'xhr') {
      result = result.filter((e: NetworkEvent) => e.type === 'xhr');
    } else if (filter === 'errors') {
      result = result.filter((e: NetworkEvent) => e.state === 'error');
    } else if (filter === 'slow') {
      result = result.filter((e: NetworkEvent) => e.duration !== undefined && e.duration > slowRequestThreshold);
    }

    // Apply method filter
    if (methodFilter !== 'ALL') {
      result = result.filter((e: NetworkEvent) => e.method === methodFilter);
    }

    // Apply search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((e: NetworkEvent) => {
        const urlMatch = e.url.toLowerCase().includes(s);
        const methodMatch = e.method.toLowerCase().includes(s);
        const statusMatch = e.status !== undefined && e.status.toString().includes(s);
        return urlMatch || methodMatch || statusMatch;
      });
    }

    return result;
  }, [events, filter, methodFilter, search, slowRequestThreshold]);

  const errorCount = events.filter((e) => e.state === 'error').length;
  const pendingCount = events.filter((e) => e.state === 'pending').length;
  const selectedEventId = selectedEvent ? selectedEvent.id : null;

  const handleClear = () => {
    clearEvents();
    setSelectedEvent(null);
  };

  if (!isOpen) {
    return (
      <button
        className={`rndt-launcher rndt-launcher--${position}`}
        onClick={() => setIsOpen(true)}
        title="Network DevTools"
      >
        ⚡
        {(errorCount > 0 || pendingCount > 0) && (
          <span className="rndt-launcher__badge">
            {errorCount > 0 ? errorCount : pendingCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className={`rndt-panel rndt-panel--${position}`}>
        {/* Header */}
        <div className="rndt-header">
          <div className="rndt-header__title">
            <span>⚡</span>
            <span>Network DevTools</span>
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 400 }}>
              ({filteredEvents.length} requests)
            </span>
          </div>
          <div className="rndt-header__actions">
            <button className="rndt-header__btn" onClick={handleClear}>
              Clear
            </button>
            <button
              className="rndt-header__btn rndt-header__btn--close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="rndt-toolbar">
          <input
            className="rndt-search"
            placeholder="Search URL, method, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="rndt-filters">
            {(['all', 'fetch', 'xhr', 'errors', 'slow'] as FilterType[]).map((f) => (
              <button
                key={f}
                className={`rndt-filter-btn ${
                  filter === f ? 'rndt-filter-btn--active' : ''
                } ${f === 'errors' ? 'rndt-filter-btn--errors' : ''} ${
                  f === 'slow' ? 'rndt-filter-btn--slow' : ''
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'fetch' ? 'Fetch' : f === 'xhr' ? 'XHR' : f === 'errors' ? 'Errors' : 'Slow'}
              </button>
            ))}
          </div>
        </div>

        {/* Method filters */}
        <div className="rndt-method-filters">
          {(['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as MethodFilter[]).map((m) => (
            <button
              key={m}
              className={`rndt-method-btn ${
                methodFilter === m ? 'rndt-method-btn--active' : ''
              }`}
              onClick={() => setMethodFilter(m)}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Content */}
        {selectedEvent ? (
          <RequestDetails
            event={selectedEvent}
            onBack={() => setSelectedEvent(null)}
            maskSensitive={maskSensitiveData}
          />
        ) : (
          <>
            {/* Request List Header */}
            <div className="rndt-request-list__header">
              <span>Method</span>
              <span>URL</span>
              <span>Status</span>
              <span>Duration</span>
            </div>

            {/* Request List */}
            <div className="rndt-request-list">
              {filteredEvents.length === 0 ? (
                <div className="rndt-empty">
                  <div className="rndt-empty__icon">📡</div>
                  <div className="rndt-empty__text">
                    {events.length === 0
                      ? 'No network requests captured yet'
                      : 'No requests match your filters'}
                  </div>
                </div>
              ) : (
                filteredEvents.map((evt: NetworkEvent) => (
                  <RequestRow
                    key={evt.id}
                    event={evt}
                    isSelected={selectedEventId === evt.id}
                    slowThreshold={slowRequestThreshold}
                    onClick={() => {
                      const allEvents = getNetworkStore().getAll();
                      const freshEvent = allEvents.find((e: NetworkEvent) => e.id === evt.id);
                      setSelectedEvent(freshEvent || evt);
                    }}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NetworkDevTools;
