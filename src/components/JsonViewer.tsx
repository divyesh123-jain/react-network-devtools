import React, { useState } from 'react';

interface JsonViewerProps {
  data: unknown;
  level?: number;
  search?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, level = 0, search = '' }) => {
  if (data === null) {
    return <span className="rndt-json-viewer__null">null</span>;
  }

  if (data === undefined) {
    return <span className="rndt-json-viewer__null">undefined</span>;
  }

  if (typeof data === 'string') {
    const highlighted = search
      ? data.replace(new RegExp(`(${escapeRegex(search)})`, 'gi'), '<mark style="background:#f59e0b;color:#000">$1</mark>')
      : data;
    return (
      <span
        className="rndt-json-viewer__string"
        dangerouslySetInnerHTML={{ __html: `"${highlighted}"` }}
      />
    );
  }

  if (typeof data === 'number') {
    return <span className="rndt-json-viewer__number">{data}</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="rndt-json-viewer__boolean">{data.toString()}</span>;
  }

  if (Array.isArray(data)) {
    return <JsonArray data={data} level={level} search={search} />;
  }

  if (typeof data === 'object') {
    return <JsonObject data={data as Record<string, unknown>} level={level} search={search} />;
  }

  return <span>{String(data)}</span>;
};

const JsonObject: React.FC<{ data: Record<string, unknown>; level: number; search: string }> = ({
  data,
  level,
  search,
}) => {
  const [collapsed, setCollapsed] = useState(level > 2);
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <span className="rndt-json-viewer__bracket">{'{}'}</span>;
  }

  if (collapsed) {
    return (
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(false)}>
        <span className="rndt-json-viewer__bracket">{'{'}</span>
        <span style={{ color: '#64748b' }}> ...{entries.length} items </span>
        <span className="rndt-json-viewer__bracket">{'}'}</span>
      </span>
    );
  }

  return (
    <div>
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(true)}>
        <span className="rndt-json-viewer__bracket">{'{'}</span>
      </span>
      <div className="rndt-json-viewer__indent">
        {entries.map(([key, value], i) => (
          <div key={key}>
            <span className="rndt-json-viewer__key">"{key}"</span>
            <span className="rndt-json-viewer__bracket">: </span>
            <JsonViewer data={value} level={level + 1} search={search} />
            {i < entries.length - 1 && <span className="rndt-json-viewer__bracket">,</span>}
          </div>
        ))}
      </div>
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(true)}>
        <span className="rndt-json-viewer__bracket">{'}'}</span>
      </span>
    </div>
  );
};

const JsonArray: React.FC<{ data: unknown[]; level: number; search: string }> = ({
  data,
  level,
  search,
}) => {
  const [collapsed, setCollapsed] = useState(level > 2);

  if (data.length === 0) {
    return <span className="rndt-json-viewer__bracket">{'[]'}</span>;
  }

  if (collapsed) {
    return (
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(false)}>
        <span className="rndt-json-viewer__bracket">{'['}</span>
        <span style={{ color: '#64748b' }}> ...{data.length} items </span>
        <span className="rndt-json-viewer__bracket">{']'}</span>
      </span>
    );
  }

  return (
    <div>
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(true)}>
        <span className="rndt-json-viewer__bracket">{'['}</span>
      </span>
      <div className="rndt-json-viewer__indent">
        {data.map((item, i) => (
          <div key={i}>
            <JsonViewer data={item} level={level + 1} search={search} />
            {i < data.length - 1 && <span className="rndt-json-viewer__bracket">,</span>}
          </div>
        ))}
      </div>
      <span className="rndt-json-viewer__toggle" onClick={() => setCollapsed(true)}>
        <span className="rndt-json-viewer__bracket">{']'}</span>
      </span>
    </div>
  );
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default JsonViewer;
