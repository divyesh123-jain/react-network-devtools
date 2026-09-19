import { useSyncExternalStore } from 'react';
import { NetworkEvent } from '../types/network';
import { getNetworkStore } from '../core/store/network-store';

export function useNetworkEvents(): NetworkEvent[] {
  const store = getNetworkStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getAll,
    store.getAll
  );
}
