/**
 * Create Supabase Storage buckets for Ghana Alert System.
 * Run once with: node scripts/create-supabase-buckets.js
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY (and optionally EXPO_PUBLIC_SUPABASE_URL)
 * Get the service role key from: Supabase Dashboard → Project Settings → API → service_role
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mcvdzewqydblspcnmkrs.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Set it in your environment or .env, then run: node scripts/create-supabase-buckets.js');
  console.error('Get the key from: Supabase Dashboard → Project Settings → API → service_role (secret)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BUCKETS = [
  { id: 'face', public: true, description: 'Face biometric images (signup & verification)' },
  { id: 'national-id', public: true, description: 'National ID document images' },
  { id: 'incident-media', public: true, description: 'Incident photos, videos, audio' },
];

async function main() {
  console.log('Creating Supabase Storage buckets...\n');

  for (const bucket of BUCKETS) {
    const { data, error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.id === 'incident-media' ? 52428800 : 10485760, // 50MB for incident-media, 10MB others
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`✓ ${bucket.id} (already exists)`);
      } else {
        console.error(`✗ ${bucket.id}: ${error.message}`);
      }
    } else {
      console.log(`✓ ${bucket.id} created — ${bucket.description}`);
    }
  }

  console.log('\nDone. Buckets are ready for use.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
