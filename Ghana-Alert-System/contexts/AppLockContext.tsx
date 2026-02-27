import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState } from 'react-native';

type AppLockContextValue = {
  isLocked: boolean;
  lockEnabled: boolean;
  requireUnlock: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  configurePin: (pin: string | null) => Promise<void>;
};

const STORAGE_KEY_ENABLED = 'app_lock_enabled_v1';
const STORAGE_KEY_PIN = 'app_lock_pin_v1';

const AppLockContext = createContext<AppLockContextValue | null>(null);

async function loadFlag(key: string, fallback = false): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (raw == null) return fallback;
    return raw === '1';
  } catch {
    return fallback;
  }
}

async function saveFlag(key: string, value: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value ? '1' : '0');
  } catch {
    // ignore
  }
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const enabled = await loadFlag(STORAGE_KEY_ENABLED, false);
      const pin = await SecureStore.getItemAsync(STORAGE_KEY_PIN);
      if (!mounted) return;
      setLockEnabled(enabled && !!pin);
      setHasPin(!!pin);
      if (enabled && pin) setIsLocked(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && lockEnabled && hasPin) {
        setIsLocked(true);
      }
    });
    return () => {
      sub.remove();
    };
  }, [lockEnabled, hasPin]);

  const requireUnlock = useCallback(() => {
    if (lockEnabled && hasPin) {
      setIsLocked(true);
    }
  }, [lockEnabled, hasPin]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY_PIN);
        if (!stored || stored !== pin) return false;
        setIsLocked(false);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const configurePin = useCallback(async (pin: string | null) => {
    if (!pin) {
      await SecureStore.deleteItemAsync(STORAGE_KEY_PIN);
      await saveFlag(STORAGE_KEY_ENABLED, false);
      setHasPin(false);
      setLockEnabled(false);
      setIsLocked(false);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY_PIN, pin);
    await saveFlag(STORAGE_KEY_ENABLED, true);
    setHasPin(true);
    setLockEnabled(true);
    setIsLocked(true);
  }, []);

  const value: AppLockContextValue = {
    isLocked,
    lockEnabled,
    requireUnlock,
    unlockWithPin,
    configurePin,
  };

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}

