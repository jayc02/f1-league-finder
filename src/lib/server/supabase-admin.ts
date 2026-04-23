import { HttpError } from '@/lib/utils/http';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;

if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured.');
if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
if (!storageBucket) throw new Error('SUPABASE_STORAGE_BUCKET is not configured.');

const buildStoragePath = (objectPath: string) => `${supabaseUrl}/storage/v1/object/${storageBucket}/${objectPath}`;
const buildPublicPath = (objectPath: string) => `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${objectPath}`;

const upload = async (objectPath: string, bytes: Buffer, contentType: string) => {
  const response = await fetch(buildStoragePath(objectPath), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      'content-type': contentType,
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: bytes,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new HttpError(500, `Failed to upload file to Supabase Storage. ${details}`.trim());
  }
};

const remove = async (objectPath: string) => {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${storageBucket}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });

  if (!response.ok) {
    throw new HttpError(500, 'Failed to remove file from Supabase Storage.');
  }
};

export const supabaseAdmin = {
  bucket: storageBucket,
  upload,
  remove,
  getPublicUrl: buildPublicPath,
  extractObjectPathFromPublicUrl: (value: string) => {
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${storageBucket}/`;
    if (!value.startsWith(publicPrefix)) return null;

    const objectPath = value.slice(publicPrefix.length).replace(/^\/+/, '');
    return objectPath || null;
  },
};
