import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');
  
  // Dragging state for the launcher
  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number }>(() => {
    if (position === 'bottom-left') return { x: 20, y: window.innerHeight - 68 };
    return { x: window.innerWidth - 68, y: window.innerHeight - 68 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const launcherRef = useRef<HTMLButtonElement>(null);

  // Panel position follows the launcher
  const panelPos = useMemo(() => {
    const padding = 60;
    const panelWidth = 900;
    const panelHeight = 600;
    
    // Position panel above and to the left of the launcher
    let x = launcherPos.x - panelWidth + 48;
    let y = launcherPos.y - panelHeight - padding;
    
    // Keep within viewport bounds
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    if (x + panelWidth > window.innerWidth - 10) x = window.innerWidth - panelWidth - 10;
    if (y + panelHeight > window.innerHeight - 10) y = window.innerHeight - panelHeight - 10;
    
    return { x, y };
  }, [launcherPos]);

  const events = useNetworkEvents();
  const { clearEvents } = useNetworkInterceptors({
    maxRequests,
    maxBodySize,
    slowRequestThreshold,
    captureBodies,
    captureHeaders,
    maskSensitiveData,
  });

  // Look up the currently selected event from the store (always fresh data)
  const selectedEvent: NetworkEvent | null = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e: NetworkEvent) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

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

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 48;
      const maxY = window.innerHeight - 48;
      
      setLauncherPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!launcherRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = launcherRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
  };

  const handleClear = () => {
    clearEvents();
    setSelectedEventId(null);
  };

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
  };

  const launcherStyle: React.CSSProperties = {
    position: 'fixed',
    left: launcherPos.x,
    top: launcherPos.y,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDragging ? '0 8px 20px rgba(102, 126, 234, 0.6)' : '0 4px 14px rgba(102, 126, 234, 0.4)',
    transform: isDragging ? 'scale(1.05)' : 'scale(1)',
    color: 'white',
    fontSize: '20px',
    zIndex: 99999,
    outline: 'none',
    padding: 0,
    WebkitUserSelect: 'none',
    userSelect: 'none',
    transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: panelPos.x,
    top: panelPos.y,
    width: 'min(900px, calc(100vw - 40px))',
    height: 'min(600px, calc(100vh - 100px))',
    background: '#1a1b2e',
    border: '1px solid #2d2f45',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0',
    zIndex: 99998,
  };

  if (!isOpen) {
    return (
      <button
        ref={launcherRef}
        style={launcherStyle}
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsOpen(true)}
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
      {/* Draggable Launcher */}
      <button
        ref={launcherRef}
        style={launcherStyle}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          if (!isDragging) setIsOpen(false);
        }}
        title="Network DevTools"
      >
        ⚡
        {(errorCount > 0 || pendingCount > 0) && (
          <span className="rndt-launcher__badge">
            {errorCount > 0 ? errorCount : pendingCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <div style={panelStyle}>
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
            onBack={() => setSelectedEventId(null)}
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
                    onClick={() => handleSelectEvent(evt.id)}
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
