import { useCallback, useEffect, useRef } from 'react';
import { NetworkDevToolsProps } from '../types/network';
import { installFetchInterceptor, uninstallFetchInterceptor } from '../core/interceptors/fetch';
import { installXHRInterceptor, uninstallXHRInterceptor } from '../core/interceptors/xhr';
import { getNetworkStore } from '../core/store/network-store';

export function useNetworkInterceptors(props: NetworkDevToolsProps) {
  const initialized = useRef(false);

  const {
    maxRequests = 500,
    maxBodySize = 1_000_000,
    captureBodies = true,
    captureHeaders = true,
  } = props;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize store
    getNetworkStore(maxRequests);

    // Install interceptors
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
