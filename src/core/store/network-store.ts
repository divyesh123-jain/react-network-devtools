import { NetworkEvent, NetworkStore } from '../../types/network';

export function createNetworkStore(maxRequests: number = 500): NetworkStore {
  let events: NetworkEvent[] = [];
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function add(event: NetworkEvent): void {
    events = [...events, event];
    if (events.length > maxRequests) {
      events = events.slice(events.length - maxRequests);
    }
    notify();
  }

  function update(id: string, data: Partial<NetworkEvent>): void {
    events = events.map((event) =>
      event.id === id ? { ...event, ...data } : event
    );
    notify();
  }

  function remove(id: string): void {
    events = events.filter((event) => event.id !== id);
    notify();
  }

  function clear(): void {
    events = [];
    notify();
  }

  function getAll(): NetworkEvent[] {
    return events;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { add, update, remove, clear, getAll, subscribe };
}

// Singleton store
let globalStore: NetworkStore | null = null;

export function getNetworkStore(maxRequests?: number): NetworkStore {
  if (!globalStore) {
    globalStore = createNetworkStore(maxRequests);
  }
  return globalStore;
}

export function resetNetworkStore(): void {
  globalStore = null;
}
