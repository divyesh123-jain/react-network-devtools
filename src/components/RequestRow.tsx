import React from 'react';
import { NetworkEvent } from '../types/network';

interface RequestRowProps {
  event: NetworkEvent;
  isSelected: boolean;
  slowThreshold: number;
  onClick: () => void;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  event,
  isSelected,
  slowThreshold,
  onClick,
}) => {
  const methodClass = `rndt-request-row__method--${event.method.toLowerCase()}`;
  const isSlow = event.duration && event.duration > slowThreshold;
  const isError = event.state === 'error';
  const isPending = event.state === 'pending';

  const urlDisplay = getDisplayUrl(event.url);

  const statusClass = isPending
    ? 'rndt-request-row__status--pending'
    : isError
    ? 'rndt-request-row__status--error'
    : 'rndt-request-row__status--success';

  const durationClass = isSlow ? 'rndt-request-row__duration--slow' : '';

  const rowClass = [
    'rndt-request-row',
    isSelected ? 'rndt-request-row--selected' : '',
    isError ? 'rndt-request-row--error' : '',
    isPending ? 'rndt-request-row--pending' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass} onClick={onClick}>
      <span className={`rndt-request-row__method ${methodClass}`}>
        {event.method}
      </span>
      <span className="rndt-request-row__url" title={event.url}>
        {urlDisplay}
      </span>
      <span className={`rndt-request-row__status ${statusClass}`}>
        {isPending ? '...' : event.status || 'ERR'}
      </span>
      <span className={`rndt-request-row__duration ${durationClass}`}>
        {isPending ? '—' : formatDuration(event.duration)}
      </span>
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
  return `${(ms / 1000).toFixed(1)}s`;
}

export default RequestRow;
