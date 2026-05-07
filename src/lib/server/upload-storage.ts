import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from '@/lib/utils/http';

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const SUPABASE_CONFIG_ERROR =
  'Supabase storage is not configured. Check UPLOAD_STORAGE_PROVIDER, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.';

export type SaveUploadedImageOptions = {
  folder?: string;
  directory?: string;
  maxBytes?: number;
  label?: string;
};

type NormalizedSaveUploadedImageOptions = {
  folder: string;
  maxBytes: number;
  label: string;
};

const getStorageProvider = () => process.env.UPLOAD_STORAGE_PROVIDER ?? 'local';
const getLocalDir = () => process.env.UPLOAD_STORAGE_DIR ?? 'public/uploads';

const getRequiredSupabaseConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseBucket) {
    throw new HttpError(500, SUPABASE_CONFIG_ERROR);
  }

  return { supabaseUrl, supabaseServiceRoleKey, supabaseBucket };
};

const normalizeFolder = (folder: unknown) => {
  if (typeof folder !== 'string') {
    throw new HttpError(500, 'Upload folder must be a string.');
  }

  const normalized = folder.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized) throw new HttpError(500, 'Upload folder is required.');
  if (path.isAbsolute(folder) || path.win32.isAbsolute(folder) || path.posix.isAbsolute(normalized)) {
    throw new HttpError(500, 'Upload folder must be relative.');
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '..')) {
    throw new HttpError(500, 'Upload folder cannot contain parent directory segments.');
  }

  return segments.filter(Boolean).join('/');
};

const normalizeSaveUploadedImageArgs = (
  folderOrOptions?: string | SaveUploadedImageOptions,
  maxBytes?: number,
  label?: string,
): NormalizedSaveUploadedImageOptions => {
  const options: SaveUploadedImageOptions =
    typeof folderOrOptions === 'object' && folderOrOptions !== null
      ? folderOrOptions
      : { folder: folderOrOptions, maxBytes, label };

  const normalizedMaxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isFinite(normalizedMaxBytes)) {
    throw new HttpError(500, 'Upload maxBytes must be a finite number.');
  }

  return {
    folder: normalizeFolder(options.folder ?? options.directory),
    maxBytes: normalizedMaxBytes,
    label: options.label?.trim() || 'image',
  };
};

const deleteSupabaseObject = async (objectPath: string) => {
  const { supabaseUrl, supabaseServiceRoleKey, supabaseBucket } = getRequiredSupabaseConfig();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });

  if (!response.ok) {
    throw new Error(`Supabase Storage delete failed: ${await response.text()}`);
  }
};

export async function saveUploadedImage(
  file: File,
  folder: string,
  maxBytes: number,
  label: string,
): Promise<string>;
export async function saveUploadedImage(file: File, options: SaveUploadedImageOptions): Promise<string>;
export async function saveUploadedImage(
  file: File,
  folderOrOptions?: string | SaveUploadedImageOptions,
  maxBytes?: number,
  label?: string,
) {
  const options = normalizeSaveUploadedImageArgs(folderOrOptions, maxBytes, label);

  if (!file.size) throw new HttpError(400, `Please choose a ${options.label} file before saving.`);
  if (!IMAGE_MIME_TO_EXT[file.type]) throw new HttpError(400, `${options.label} must be JPG, PNG, or WebP.`);
  if (file.size > options.maxBytes) throw new HttpError(400, `${options.label} is too large.`);

  const provider = getStorageProvider();
  if (process.env.NODE_ENV === 'production' && provider !== 'supabase') {
    throw new HttpError(500, 'Production uploads require Supabase Storage. Set UPLOAD_STORAGE_PROVIDER=supabase.');
  }

  const ext = IMAGE_MIME_TO_EXT[file.type];
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const objectPath = path.posix.join(options.folder, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (provider === 'supabase') {
    const { supabaseUrl, supabaseServiceRoleKey, supabaseBucket } = getRequiredSupabaseConfig();
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
        'content-type': file.type,
        'x-upsert': 'false',
      },
      body: bytes,
    });

    if (!response.ok) throw new HttpError(500, `Failed to upload file. ${await response.text()}`.trim());
    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${objectPath}`;
  }

  if (provider !== 'local') {
    throw new HttpError(500, `Unsupported upload storage provider: ${provider}.`);
  }

  const configuredLocalDir = getLocalDir();
  const storageRoot = path.isAbsolute(configuredLocalDir) ? configuredLocalDir : path.resolve(process.cwd(), configuredLocalDir);
  const diskPath = path.join(storageRoot, ...options.folder.split('/'));
  await fs.mkdir(diskPath, { recursive: true });
  await fs.writeFile(path.join(diskPath, fileName), bytes);
  return `/${path.posix.join('uploads', options.folder, fileName)}`;
}

export const removeManagedUploadIfPresent = async (value: string | null | undefined) => {
  if (!value) return;

  if (value.startsWith('/uploads/')) {
    const rel = value.replace(/^\/uploads\//, '');
    if (!rel || rel.split('/').some((segment) => segment === '..')) return;

    await fs.rm(path.join(process.cwd(), 'public', 'uploads', ...rel.split('/')), { force: true }).catch(() => undefined);
    return;
  }

  if (getStorageProvider() !== 'supabase') return;

  try {
    const { supabaseUrl, supabaseBucket } = getRequiredSupabaseConfig();
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/`;
    if (!value.startsWith(publicPrefix)) return;

    const objectPath = value.slice(publicPrefix.length).replace(/^\/+/, '');
    if (!objectPath || objectPath.split('/').some((segment) => segment === '..')) return;

    await deleteSupabaseObject(objectPath);
  } catch (error) {
    console.error('Failed to remove managed upload.', error);
  }
};
