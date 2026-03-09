import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadIncidentMediaBatch } from '@/lib/mediaUpload';
import {
  OfflineIncidentItem,
  enqueueOfflineIncident,
  loadOfflineIncidents,
  patchOfflineIncident,
  removeOfflineIncident as removeOfflineIncidentFromStorage,
  shouldAttemptNow,
  markFailedPatch,
} from '@/lib/offlineIncidents';

export type IncidentType = 'police' | 'fire' | 'medical' | 'other';
export type PanicMode = 'silent' | 'loud';
export type IncidentStatus =
  | 'submitted'
  | 'received'
  | 'verified'
  | 'dispatched'
  | 'enroute'
  | 'onscene'
  | 'resolved'
  | 'critical_alert';
export type Language = 'en' | 'tw' | 'ga' | 'ewe';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  provider: string;
  timestamp: string;
  timestampUTC: string;
  humanReadable: string;
}

export interface Incident {
  id: string;
  userId: string;
  type: IncidentType;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  accuracyMeters: number | null;
  gpsProvider: string | null;
  address: string | null;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  panicMode: PanicMode | null;
  mediaUrls: string[] | null;
  isAnonymous: boolean;
  priorityScore: number;
  timeline: { status: IncidentStatus; timestamp: string; note?: string }[];
}

export interface CommunityAlert {
  id: string;
  type: IncidentType;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  reportCount: number;
  radiusMeters: number;
  firstReportedAt: string;
  lastReportedAt: string;
}

export interface EmergencyContextValue {
  incidents: Incident[];
  activeIncident: Incident | null;
  isPanicActive: boolean;
  panicMode: PanicMode;
  language: Language;
  isLoading: boolean;
  offlineIncidents: OfflineIncidentItem[];
  communityAlerts: CommunityAlert[];
  setLanguage: (lang: Language) => void;
  triggerPanic: (mode: PanicMode, location: LocationData | null) => Promise<{ mode: 'sent'; incident: Incident } | { mode: 'queued'; localId: string }>;
  cancelPanic: () => void;
  createIncident: (data: CreateIncidentData) => Promise<Incident>;
  submitIncident: (data: CreateIncidentData) => Promise<{ mode: 'sent'; incident: Incident } | { mode: 'queued'; localId: string }>;
  retryOfflineIncident: (localId: string) => Promise<void>;
  removeOfflineIncident: (localId: string) => Promise<void>;
  loadIncidents: () => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  deleteAllIncidents: () => Promise<void>;
  loadCommunityAlertsAround: (opts: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    minReports?: number;
    minutes?: number;
  }) => Promise<void>;
}

export interface CreateIncidentData {
  type: IncidentType;
  description?: string;
  location?: LocationData | null;
  panicMode?: PanicMode;
  mediaUris?: string[];
  isAnonymous?: boolean;
  priorityScore?: number;
  clientFlagSpam?: boolean;
}

function classifyPriorityAndStatus(
  type: IncidentType,
  descriptionRaw?: string,
  explicitPriority?: number,
): { priorityScore: number; status: IncidentStatus; note?: string } {
  const basePriority =
    explicitPriority ??
    (type === 'fire' || type === 'medical' ? 4 : 3);

  const desc = (descriptionRaw || '').toLowerCase();
  const isKidnapping =
    desc.includes('kidnap') ||
    desc.includes('abduct') ||
    desc.includes('abduction');
  const isArmedRobbery =
    desc.includes('armed robbery') ||
    (desc.includes('robbery') && (desc.includes('gun') || desc.includes('weapon')));
  const isFireOutbreak =
    type === 'fire' ||
    desc.includes('fire outbreak') ||
    (desc.includes('fire') && (desc.includes('building') || desc.includes('house') || desc.includes('market')));

  const isCritical = isKidnapping || isArmedRobbery || isFireOutbreak;

  if (isCritical) {
    return {
      priorityScore: 5,
      status: 'critical_alert',
      note: 'system_flag: critical_escalation',
    };
  }

  return {
    priorityScore: basePriority,
    status: 'submitted',
  };
}

const EmergencyContext = createContext<EmergencyContextValue | null>(null);

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [panicMode, setPanicMode] = useState<PanicMode>('loud');
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [offlineIncidents, setOfflineIncidents] = useState<OfflineIncidentItem[]>([]);
  const [communityAlerts, setCommunityAlerts] = useState<CommunityAlert[]>([]);
  const isProcessingOffline = useRef(false);
  const recentWindowRef = useRef<{ windowStart: number; count: number }>({ windowStart: 0, count: 0 });
  const { user } = useAuth();

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const loadIncidents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Failed to load incidents:', error);
        return;
      }

      setIncidents((data as any as Incident[]) || []);
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshOfflineIncidents = useCallback(async () => {
    const items = await loadOfflineIncidents();
    setOfflineIncidents(items);
  }, []);

  useEffect(() => {
    refreshOfflineIncidents();
  }, [refreshOfflineIncidents]);

  const isLikelyNetworkError = (message: string) => {
    const m = message.toLowerCase();
    return (
      m.includes('network request failed') ||
      m.includes('failed to fetch') ||
      m.includes('fetch failed') ||
      m.includes('timeout') ||
      m.includes('econn') ||
      m.includes('enotfound')
    );
  };

  // Real-time updates for incidents (new / updated / deleted)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`incidents-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `userId=eq.${user.id}`,
        },
        () => {
          // Refresh incidents list whenever something changes for this user
          loadIncidents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadIncidents]);

  const loadCommunityAlertsAround = useCallback(async (opts: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    minReports?: number;
    minutes?: number;
  }) => {
    const {
      latitude,
      longitude,
      radiusMeters = 1000,
      minReports = 2,
      minutes = 60,
    } = opts;

    try {
      const since = new Date(Date.now() - minutes * 60_000).toISOString();

      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .gte('createdAt', since);

      if (error) {
        console.error('Failed to load community incidents:', error);
        return;
      }

      const raw = (data as any as Incident[]) || [];
      const located = raw.filter((i) => i.latitude && i.longitude);

      const groups: CommunityAlert[] = [];

      for (const inc of located) {
        const lat = parseFloat(String(inc.latitude));
        const lon = parseFloat(String(inc.longitude));
        if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

        let group = groups.find(
          (g) =>
            g.type === inc.type &&
            distanceMeters(g.latitude, g.longitude, lat, lon) <= radiusMeters / 2,
        );

        if (!group) {
          groups.push({
            id: inc.id,
            type: inc.type,
            description: inc.description,
            latitude: lat,
            longitude: lon,
            address: inc.address,
            reportCount: 1,
            radiusMeters,
            firstReportedAt: inc.createdAt,
            lastReportedAt: inc.createdAt,
          });
        } else {
          group.reportCount += 1;
          group.lastReportedAt =
            inc.createdAt > group.lastReportedAt ? inc.createdAt : group.lastReportedAt;
        }
      }

      const filtered = groups.filter((g) => g.reportCount >= minReports);
      setCommunityAlerts(filtered);
    } catch (e) {
      console.error('Failed to compute community alerts:', e);
    }
  }, []);

  const createIncident = useCallback(async (data: CreateIncidentData): Promise<Incident> => {
    if (!user) {
      throw new Error('Please log in before submitting a report.');
    }

    const classification = classifyPriorityAndStatus(
      data.type,
      data.description,
      data.priorityScore,
    );

    const body: any = {
      type: data.type,
      description: data.description || '',
      isAnonymous: data.isAnonymous ?? true,
      priorityScore: classification.priorityScore,
      status: classification.status,
      timeline: [{
        status: classification.status,
        timestamp: new Date().toISOString(),
        ...(data.clientFlagSpam ? { note: 'client_flag: frequent_reports' } : {}),
        ...(classification.note ? { note: classification.note } : {}),
      }],
      userId: user.id,
      mediaUrls: [],
    };

    if (data.location) {
      body.latitude = String(data.location.latitude);
      body.longitude = String(data.location.longitude);
      body.accuracyMeters = data.location.accuracy;
      body.gpsProvider = data.location.provider;
      body.address = data.location.humanReadable;
    }

    if (data.panicMode) body.panicMode = data.panicMode;

    const { data: inserted, error } = await supabase
      .from('incidents')
      .insert(body)
      .select('*')
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || 'Failed to create incident');
    }

    const incident = inserted as any as Incident;

    // Upload photos, videos, and audio to Supabase Storage
    if (data.mediaUris && data.mediaUris.length > 0) {
      try {
        const mediaUrls = await uploadIncidentMediaBatch(data.mediaUris, incident.id);
        const { error: updateError } = await supabase
          .from('incidents')
          .update({ mediaUrls, updatedAt: new Date().toISOString() })
          .eq('id', incident.id)
          .eq('userId', user.id);

        if (!updateError) {
          incident.mediaUrls = mediaUrls;
        }
      } catch (mediaErr) {
        console.warn('Media upload failed, incident created without media:', mediaErr);
      }
    }

    setIncidents(prev => [incident, ...prev]);
    return incident;
  }, [user]);

  const submitIncident = useCallback(async (
    data: CreateIncidentData
  ): Promise<{ mode: 'sent'; incident: Incident } | { mode: 'queued'; localId: string }> => {
    // Simple client-side fraud/spam guard: count submissions in a rolling 5-minute window.
    const now = Date.now();
    const windowMs = 5 * 60_000;
    const maxInWindow = 5;
    const current = recentWindowRef.current;
    if (now - current.windowStart > windowMs) {
      recentWindowRef.current = { windowStart: now, count: 1 };
    } else {
      recentWindowRef.current = { windowStart: current.windowStart, count: current.count + 1 };
    }
    const clientFlagSpam = recentWindowRef.current.count > maxInWindow;

    try {
      const incident = await createIncident({ ...data, clientFlagSpam });
      return { mode: 'sent', incident };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isLikelyNetworkError(msg)) {
        const queued = await enqueueOfflineIncident(data, 'network_error', msg);
        await refreshOfflineIncidents();
        return { mode: 'queued', localId: queued.localId };
      }
      throw e;
    }
  }, [createIncident, refreshOfflineIncidents]);

  const processOfflineQueue = useCallback(async () => {
    if (!user) return;
    if (isProcessingOffline.current) return;
    isProcessingOffline.current = true;
    try {
      const items = await loadOfflineIncidents();
      const sendable = items
        .filter((x) => (x.status === 'queued' || x.status === 'failed') && shouldAttemptNow(x))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (sendable.length === 0) return;

      const item = sendable[0];
      await patchOfflineIncident(item.localId, { status: 'sending', lastError: undefined });
      await refreshOfflineIncidents();

      try {
        await createIncident(item.data);
        await removeOfflineIncidentFromStorage(item.localId);
        await refreshOfflineIncidents();
        await loadIncidents();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const nextAttempts = (item.attempts ?? 0) + 1;
        await patchOfflineIncident(item.localId, markFailedPatch(nextAttempts, msg));
        await refreshOfflineIncidents();
      }
    } finally {
      isProcessingOffline.current = false;
    }
  }, [user, createIncident, refreshOfflineIncidents, loadIncidents]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      processOfflineQueue();
    }, 30_000);
    return () => clearInterval(id);
  }, [user, processOfflineQueue]);

  const retryOfflineIncident = useCallback(async (localId: string) => {
    await patchOfflineIncident(localId, { status: 'queued', nextAttemptAt: new Date(0).toISOString() });
    await refreshOfflineIncidents();
    await processOfflineQueue();
  }, [processOfflineQueue, refreshOfflineIncidents]);

  const removeOfflineIncident = useCallback(async (localId: string) => {
    await removeOfflineIncidentFromStorage(localId);
    await refreshOfflineIncidents();
  }, [refreshOfflineIncidents]);

  const triggerPanic = useCallback(async (
    mode: PanicMode,
    location: LocationData | null,
  ): Promise<{ mode: 'sent'; incident: Incident } | { mode: 'queued'; localId: string }> => {
    setIsPanicActive(true);
    setPanicMode(mode);

    const result = await submitIncident({
      type: 'police',
      description: mode === 'silent' ? 'Silent panic alert triggered' : 'Loud panic alert triggered',
      location,
      panicMode: mode,
      isAnonymous: false,
      priorityScore: 5,
    });

    if (result.mode === 'sent') {
      setActiveIncident(result.incident);
    } else {
      setActiveIncident(null);
    }

    return result;
  }, [submitIncident]);

  const cancelPanic = useCallback(() => {
    setIsPanicActive(false);
    setActiveIncident(null);
  }, []);

  const deleteIncident = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      throw new Error(error.message || 'Failed to delete incident');
    }

    setIncidents(prev => prev.filter(i => i.id !== id));
  }, [user]);

  const deleteAllIncidents = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('userId', user.id);

    if (error) {
      throw new Error(error.message || 'Failed to delete incidents');
    }

    setIncidents([]);
  }, [user]);

  const value = useMemo(() => ({
    incidents,
    activeIncident,
    isPanicActive,
    panicMode,
    language,
    isLoading,
    offlineIncidents,
    communityAlerts,
    setLanguage,
    triggerPanic,
    cancelPanic,
    createIncident,
    submitIncident,
    retryOfflineIncident,
    removeOfflineIncident,
    loadIncidents,
    deleteIncident,
    deleteAllIncidents,
    loadCommunityAlertsAround,
  }), [incidents, activeIncident, isPanicActive, panicMode, language, isLoading, offlineIncidents, communityAlerts,
    setLanguage, triggerPanic, cancelPanic, createIncident, submitIncident, retryOfflineIncident, removeOfflineIncident,
    loadIncidents, deleteIncident, deleteAllIncidents, loadCommunityAlertsAround]);

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error('useEmergency must be used within EmergencyProvider');
  return ctx;
}
