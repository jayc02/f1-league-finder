import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from '@/lib/utils/http';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const isAllowedMime = (mimeType: string) => Object.prototype.hasOwnProperty.call(IMAGE_MIME_TO_EXT, mimeType);

export const saveUploadedImage = async (
  file: File,
  options: {
    folder: 'avatars' | 'community-logos' | 'community-banners';
    maxBytes: number;
    label: string;
  },
) => {
  if (!file.size) throw new HttpError(400, `Please choose a ${options.label} file before saving.`);
  if (!isAllowedMime(file.type)) throw new HttpError(400, `${options.label} must be JPG, PNG, WebP, GIF, or AVIF.`);
  if (file.size > options.maxBytes) throw new HttpError(400, `${options.label} is too large.`);

  const ext = IMAGE_MIME_TO_EXT[file.type];
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const objectPath = path.posix.join('uploads', options.folder, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await supabaseAdmin.upload(objectPath, bytes, file.type);

  return supabaseAdmin.getPublicUrl(objectPath);
};

export const removeManagedUploadIfPresent = async (value: string | null | undefined) => {
  if (!value) return;

  const objectPath = supabaseAdmin.extractObjectPathFromPublicUrl(value);
  if (!objectPath) return;

  try {
    await supabaseAdmin.remove(objectPath);
  } catch {
    // Keep request success path stable even if deletion fails.
  }
};
