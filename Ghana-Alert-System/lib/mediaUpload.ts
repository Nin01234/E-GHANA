/**
 * Media upload utilities for Supabase Storage.
 * Handles face biometric, national ID, and incident media (photos, videos, audio).
 */
import { supabase } from '@/lib/supabase';

const BUCKET_FACE = 'face';
const BUCKET_NATIONAL_ID = 'national-id';
const BUCKET_INCIDENT_MEDIA = 'incident-media';

function getExtensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match) return match[1].toLowerCase();
  return 'jpg';
}

function getMimeType(uri: string, extension?: string): string {
  const ext = extension || getExtensionFromUri(uri);
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  return response.blob();
}

/**
 * Upload face biometric image to Supabase Storage.
 * Used during signup and when updating face from settings.
 */
export async function uploadFaceImage(localUri: string, userId: string): Promise<string> {
  const ext = getExtensionFromUri(localUri);
  const path = `${userId}/${Date.now()}.${ext}`;
  const blob = await uriToBlob(localUri);
  const contentType = getMimeType(localUri, ext);

  const { data, error } = await supabase.storage
    .from(BUCKET_FACE)
    .upload(path, blob, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload face image');
  }

  const { data: urlData } = supabase.storage.from(BUCKET_FACE).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/**
 * Upload national ID image to Supabase Storage.
 * Used during signup and profile update.
 */
export async function uploadNationalIdImage(localUri: string, userId: string): Promise<string> {
  const ext = getExtensionFromUri(localUri);
  const path = `${userId}/${Date.now()}.${ext}`;
  const blob = await uriToBlob(localUri);
  const contentType = getMimeType(localUri, ext);

  const { data, error } = await supabase.storage
    .from(BUCKET_NATIONAL_ID)
    .upload(path, blob, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload national ID image');
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NATIONAL_ID).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/**
 * Upload incident media (photo, video, or audio) to Supabase Storage.
 * Returns the public URL for storage in incident.mediaUrls.
 */
export async function uploadIncidentMedia(
  localUri: string,
  incidentId: string,
  index: number
): Promise<string> {
  const ext = getExtensionFromUri(localUri);
  const filePath = `${incidentId}/${Date.now()}-${index}.${ext}`;
  const blob = await uriToBlob(localUri);
  const contentType = getMimeType(localUri, ext);

  const { data, error } = await supabase.storage
    .from(BUCKET_INCIDENT_MEDIA)
    .upload(filePath, blob, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || `Failed to upload media (${index + 1})`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET_INCIDENT_MEDIA).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/**
 * Upload multiple incident media files. Returns array of public URLs.
 */
export async function uploadIncidentMediaBatch(
  localUris: string[],
  incidentId: string
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < localUris.length; i++) {
    const url = await uploadIncidentMedia(localUris[i], incidentId, i);
    urls.push(url);
  }
  return urls;
}
