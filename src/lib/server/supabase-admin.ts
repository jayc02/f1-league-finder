import { HttpError } from '@/lib/utils/http';

const SUPABASE_ADMIN_CONFIG_ERROR =
  'Supabase admin storage is not configured. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.';

type SupabaseAdminConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  storageBucket: string;
};

const getSupabaseAdminConfig = (): SupabaseAdminConfig => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !supabaseServiceRoleKey || !storageBucket) {
    throw new HttpError(500, SUPABASE_ADMIN_CONFIG_ERROR);
  }

  return { supabaseUrl, supabaseServiceRoleKey, storageBucket };
};

const buildStoragePath = ({ supabaseUrl, storageBucket }: SupabaseAdminConfig, objectPath: string) =>
  `${supabaseUrl}/storage/v1/object/${storageBucket}/${objectPath}`;

const buildPublicPath = ({ supabaseUrl, storageBucket }: SupabaseAdminConfig, objectPath: string) =>
  `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${objectPath}`;

const upload = async (objectPath: string, bytes: Buffer, contentType: string) => {
  const config = getSupabaseAdminConfig();
  const response = await fetch(buildStoragePath(config, objectPath), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      apikey: config.supabaseServiceRoleKey,
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
  const config = getSupabaseAdminConfig();
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${config.storageBucket}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      apikey: config.supabaseServiceRoleKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });

  if (!response.ok) {
    throw new HttpError(500, 'Failed to remove file from Supabase Storage.');
  }
};

export const supabaseAdmin = {
  get bucket() {
    return getSupabaseAdminConfig().storageBucket;
  },
  upload,
  remove,
  getPublicUrl: (objectPath: string) => buildPublicPath(getSupabaseAdminConfig(), objectPath),
  extractObjectPathFromPublicUrl: (value: string) => {
    const { supabaseUrl, storageBucket } = getSupabaseAdminConfig();
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${storageBucket}/`;
    if (!value.startsWith(publicPrefix)) return null;

    const objectPath = value.slice(publicPrefix.length).replace(/^\/+/, '');
    return objectPath || null;
  },
};
