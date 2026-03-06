# Supabase Storage Setup

The Ghana Alert System uses Supabase Storage for:

1. **Face biometric images** (signup & verification)
2. **National ID images** (identity verification)
3. **Incident media** (photos, videos, audio from reports)

## Create Storage Buckets

### Option A: Run the script (recommended)

1. Get your **service role key** from [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **API** → **service_role** (secret).
2. Run:

   ```bash
   # Set the key (use your actual key)
   # Windows PowerShell:
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   npm run supabase:create-buckets

   # macOS / Linux:
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run supabase:create-buckets
   ```

   Or add to a `.env` file (do not commit): `SUPABASE_SERVICE_ROLE_KEY=...` then run `npm run supabase:create-buckets`.

This creates the three buckets below. If a bucket already exists, the script skips it.

### Option B: Create manually

In [Supabase Dashboard](https://supabase.com/dashboard) → **Storage** → **New bucket**, create:

| Bucket Name       | Public | Description                          |
|-------------------|--------|--------------------------------------|
| `face`            | Yes    | Face biometric images (signup only)  |
| `national-id`     | Yes*   | National ID document images          |
| `incident-media`  | Yes    | Photos, videos, audio from reports   |

\* Use **private** for `national-id` if you prefer; then use signed URLs in the app.

## Bucket Policies (RLS)

Ensure your Storage policies allow:

- **face**: Authenticated users can upload to their own folder (`user_id/*`)
- **national-id**: Same as face
- **incident-media**: Authenticated users can upload

Example policy (Supabase SQL Editor):

```sql
-- Allow authenticated users to upload to face bucket
CREATE POLICY "Users can upload own face" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'face');

-- Allow public read for face (for display)
CREATE POLICY "Public read face" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'face');

-- Repeat for national-id and incident-media
```

Or use the Dashboard UI: Storage → Select bucket → Policies → New Policy.

## Storage Limits

- **File size**: 10MB limit for photos; 50MB for videos (adjust in multer/upload if using custom backend)
- **Incident media**: Up to 5 photos + 5 videos + 1 audio per report
