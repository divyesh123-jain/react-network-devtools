import { useCallback, useEffect } from 'react';
import { NetworkDevToolsProps } from '../types/network';
import { installFetchInterceptor, uninstallFetchInterceptor } from '../core/interceptors/fetch';
import { installXHRInterceptor, uninstallXHRInterceptor } from '../core/interceptors/xhr';
import { getNetworkStore } from '../core/store/network-store';

export function useNetworkInterceptors(props: NetworkDevToolsProps) {
  const {
    maxRequests = 500,
    maxBodySize = 1_000_000,
    captureBodies = true,
    captureHeaders = true,
  } = props;

  useEffect(() => {
    // Initialize store with max requests limit
    getNetworkStore(maxRequests);

    // Install interceptors (they have their own singleton guard)
    installFetchInterceptor(maxBodySize, captureBodies, captureHeaders);
    installXHRInterceptor(maxBodySize, captureBodies, captureHeaders);

    return () => {
      uninstallFetchInterceptor();
      uninstallXHRInterceptor();
    };
  }, [maxRequests, maxBodySize, captureBodies, captureHeaders]);

  const clearEvents = useCallback(() => {
    getNetworkStore().clear();
  }, []);

  return { clearEvents };
}
