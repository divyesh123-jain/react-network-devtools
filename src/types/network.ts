export interface NetworkEvent {
  id: string;
  method: string;
  url: string;
  type: 'fetch' | 'xhr';
  status?: number;
  statusText?: string;
  state: 'pending' | 'success' | 'error' | 'aborted';
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  contentType?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  responseSize?: number;
  error?: {
    message: string;
  };
}

export interface NetworkStore {
  add(event: NetworkEvent): void;
  update(id: string, data: Partial<NetworkEvent>): void;
  remove(id: string): void;
  clear(): void;
  getAll(): NetworkEvent[];
  subscribe(listener: () => void): () => void;
}

export interface NetworkDevToolsProps {
  position?: 'bottom-left' | 'bottom-right';
  maxRequests?: number;
  maxBodySize?: number;
  slowRequestThreshold?: number;
  captureBodies?: boolean;
  captureHeaders?: boolean;
  maskSensitiveData?: boolean;
  defaultOpen?: boolean;
}

export type FilterType = 'all' | 'fetch' | 'xhr' | 'errors' | 'slow';

export type MethodFilter = 'ALL' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
