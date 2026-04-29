import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from '@/lib/utils/http';

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const provider = process.env.UPLOAD_STORAGE_PROVIDER ?? 'local';
const localDir = process.env.UPLOAD_STORAGE_DIR ?? 'public/uploads';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET;

export const saveUploadedImage = async (file: File, folder: string, maxBytes: number, label: string) => {
  if (!file.size) throw new HttpError(400, `Please choose a ${label} file before saving.`);
  if (!IMAGE_MIME_TO_EXT[file.type]) throw new HttpError(400, `${label} must be JPG, PNG, or WebP.`);
  if (file.size > maxBytes) throw new HttpError(400, `${label} is too large.`);

  const ext = IMAGE_MIME_TO_EXT[file.type];
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const objectPath = path.posix.join('uploads', folder, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (provider === 'supabase') {
    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseBucket) throw new HttpError(500, 'Supabase storage is not configured.');
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}/${objectPath}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${supabaseServiceRoleKey}`, apikey: supabaseServiceRoleKey, 'content-type': file.type, 'x-upsert': 'false' },
      body: bytes,
    });
    if (!response.ok) throw new HttpError(500, `Failed to upload file. ${await response.text()}`);
    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${objectPath}`;
  }

  const diskPath = path.join(process.cwd(), localDir, folder);
  await fs.mkdir(diskPath, { recursive: true });
  await fs.writeFile(path.join(diskPath, fileName), bytes);
  return `/${path.posix.join('uploads', folder, fileName)}`;
};

export const removeManagedUploadIfPresent = async (value: string | null | undefined) => {
  if (!value) return;
  if (value.startsWith('/uploads/')) {
    const rel = value.replace(/^\/+/, '');
    await fs.rm(path.join(process.cwd(), 'public', rel), { force: true }).catch(() => undefined);
    return;
  }
  if (provider === 'supabase' && supabaseUrl && supabaseBucket && value.startsWith(`${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/`)) {
    const objectPath = value.split(`/storage/v1/object/public/${supabaseBucket}/`)[1];
    await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${supabaseServiceRoleKey}`, apikey: String(supabaseServiceRoleKey), 'content-type': 'application/json' },
      body: JSON.stringify({ prefixes: [objectPath] }),
    }).catch(() => undefined);
  }
};
