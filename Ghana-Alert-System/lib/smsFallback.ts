import { Platform, Linking } from 'react-native';
import type { CreateIncidentData } from '@/contexts/EmergencyContext';

function yesNoUnknown(v: unknown): 'Y' | 'N' | 'U' {
  if (v === true) return 'Y';
  if (v === false) return 'N';
  return 'U';
}

function safeCompactValue(s: string, maxLen: number): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[|\n\r\t]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function toIsoMinute(d: Date): string {
  const iso = d.toISOString();
  // "2026-02-27T09:41:19.123Z" -> "2026-02-27T09:41Z"
  return `${iso.slice(0, 16)}Z`;
}

function computeSeverity0to100(data: CreateIncidentData): number {
  const p = data.priorityScore ?? 3; // expected 1..5
  const clamped = Math.max(1, Math.min(5, p));
  return Math.round((clamped / 5) * 100);
}

export function buildSmsFallbackPayload(args: {
  localId: string;
  createdAt?: string;
  data: CreateIncidentData;
}): { compact: string; expanded: string } {
  const { localId, data } = args;
  const ts = args.createdAt ? new Date(args.createdAt) : new Date();
  const sev = computeSeverity0to100(data);
  const type = (data.type || 'other').toUpperCase();

  const loc = data.location
    ? {
        lat: Number(data.location.latitude).toFixed(5),
        lng: Number(data.location.longitude).toFixed(5),
        acc: Math.max(0, Math.round(data.location.accuracy || 0)),
        lm: safeCompactValue(data.location.humanReadable || '', 42),
      }
    : null;

  const anon = data.isAnonymous ?? true;
  const mediaCount = data.mediaUris?.length ?? 0;
  const desc = safeCompactValue(data.description || '', 80);

  const compactParts: string[] = [
    'EGH|V1',
    `TYPE=${type}`,
    `SEV=${sev}`,
    `ANON=${anon ? 'Y' : 'N'}`,
    `MEDIA=${mediaCount}`,
    `TS=${toIsoMinute(ts)}`,
    `ID=${safeCompactValue(localId, 24)}`,
  ];

  if (loc) compactParts.push(`LOC=${loc.lat},${loc.lng}±${loc.acc}m`);
  if (loc?.lm) compactParts.push(`LM=${loc.lm}`);
  if (desc) compactParts.push(`DESC=${desc}`);
  if (data.panicMode) compactParts.push(`PANIC=${safeCompactValue(String(data.panicMode).toUpperCase(), 8)}`);

  const compact = compactParts.join('|');

  const expandedLines: string[] = [
    'E-GHANA REPORT (V1)',
    `Type: ${data.type ?? 'other'}  Severity: ${sev} (${sev >= 70 ? 'High' : sev >= 40 ? 'Medium' : 'Low'})`,
    loc
      ? `Location: ${loc.lat},${loc.lng} (±${loc.acc}m)  Landmark: ${loc.lm || 'N/A'}`
      : 'Location: N/A',
    `Media: ${mediaCount}`,
    `Time: ${toIsoMinute(ts)}`,
    `Anonymous: ${anon ? 'YES' : 'NO'}`,
    `Local ID: ${safeCompactValue(localId, 36)}`,
  ];
  if (data.description) expandedLines.splice(2, 0, `Note: ${safeCompactValue(data.description, 200)}`);
  if (data.panicMode) expandedLines.splice(2, 0, `Panic: ${String(data.panicMode)}`);

  const expanded = expandedLines.join('\n');
  return { compact, expanded };
}

export async function openSmsComposer(args: {
  body: string;
  to?: string;
}): Promise<void> {
  const to = args.to ? safeCompactValue(args.to, 32) : '';
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${encodeURIComponent(to)}${separator}body=${encodeURIComponent(args.body)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error('SMS is not available on this device.');
  }
  await Linking.openURL(url);
}

