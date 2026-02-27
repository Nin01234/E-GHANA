import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export type ConnectivityStatus = 'online' | 'offline' | 'limited';

async function checkStatus(): Promise<ConnectivityStatus> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected || !state.isInternetReachable) return 'offline';
    if (state.type === Network.NetworkStateType.CELLULAR && state.details?.cellularGeneration === '2g') {
      return 'limited';
    }
    return 'online';
  } catch {
    return 'offline';
  }
}

export function useConnectivity(pollMs = 15000): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>('online');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const s = await checkStatus();
      if (!cancelled) {
        setStatus(s);
        timer = setTimeout(tick, pollMs);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pollMs]);

  return status;
}

