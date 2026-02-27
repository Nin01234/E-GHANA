import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { CreateIncidentData } from '@/contexts/EmergencyContext';

const STORAGE_KEY = 'offline_incidents_v1';

export type OfflineIncidentStatus = 'queued' | 'sending' | 'failed';

export type OfflineIncidentReason = 'network_error' | 'manual';

export interface OfflineIncidentItem {
  localId: string;
  createdAt: string;
  updatedAt: string;
  status: OfflineIncidentStatus;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string;
  reason: OfflineIncidentReason;
  data: CreateIncidentData;
}

function nowIso() {
  return new Date().toISOString();
}

function computeNextAttempt(attempts: number): string {
  const baseMs = 30_000; // 30s
  const maxMs = 5 * 60_000; // 5m
  const delay = Math.min(baseMs * Math.pow(2, Math.max(0, attempts)), maxMs);
  return new Date(Date.now() + delay).toISOString();
}

async function generateUuidV4(): Promise<string> {
  // Avoid `uuid` package here because it depends on `crypto.getRandomValues`,
  // which is not always available in React Native runtime without polyfills.
  const bytes = await Crypto.getRandomBytesAsync(16);

  // RFC 4122 v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export async function loadOfflineIncidents(): Promise<OfflineIncidentItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OfflineIncidentItem[];
  } catch {
    return [];
  }
}

export async function saveOfflineIncidents(items: OfflineIncidentItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function enqueueOfflineIncident(
  data: CreateIncidentData,
  reason: OfflineIncidentReason,
  lastError?: string,
): Promise<OfflineIncidentItem> {
  const existing = await loadOfflineIncidents();
  const item: OfflineIncidentItem = {
    localId: await generateUuidV4(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'queued',
    attempts: 0,
    nextAttemptAt: nowIso(),
    lastError,
    reason,
    data,
  };
  const updated = [item, ...existing];
  await saveOfflineIncidents(updated);
  return item;
}

export async function patchOfflineIncident(
  localId: string,
  patch: Partial<Omit<OfflineIncidentItem, 'localId' | 'createdAt' | 'data'>> & { data?: CreateIncidentData },
): Promise<OfflineIncidentItem | null> {
  const items = await loadOfflineIncidents();
  const idx = items.findIndex((x) => x.localId === localId);
  if (idx === -1) return null;
  const next: OfflineIncidentItem = {
    ...items[idx],
    ...patch,
    data: patch.data ?? items[idx].data,
    updatedAt: nowIso(),
  };
  const updated = [...items];
  updated[idx] = next;
  await saveOfflineIncidents(updated);
  return next;
}

export async function removeOfflineIncident(localId: string): Promise<void> {
  const items = await loadOfflineIncidents();
  const updated = items.filter((x) => x.localId !== localId);
  await saveOfflineIncidents(updated);
}

export function shouldAttemptNow(item: OfflineIncidentItem): boolean {
  return new Date(item.nextAttemptAt).getTime() <= Date.now();
}

export function markFailedPatch(attempts: number, lastError?: string) {
  return {
    status: 'failed' as const,
    attempts,
    lastError,
    nextAttemptAt: computeNextAttempt(attempts),
  };
}

