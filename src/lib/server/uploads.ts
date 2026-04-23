import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from '@/lib/utils/http';
import { siteConfig } from '@/lib/config';

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const UPLOAD_ROOT = path.resolve(process.cwd(), siteConfig.uploadsDir);

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
  const relativePath = path.posix.join(siteConfig.uploadsPublicBasePath, options.folder, fileName);
  const absoluteDir = path.join(UPLOAD_ROOT, options.folder);
  const absolutePath = path.join(absoluteDir, fileName);

  await mkdir(absoluteDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return relativePath;
};

export const managedUploadPathToDisk = (publicPath: string) => {
  if (!publicPath.startsWith(`${siteConfig.uploadsPublicBasePath}/`)) return null;

  const relative = publicPath.slice(siteConfig.uploadsPublicBasePath.length).replace(/^\/+/, '');
  if (!relative || relative.includes('..')) return null;

  return path.join(UPLOAD_ROOT, relative);
};

export const removeManagedUploadIfPresent = async (value: string | null | undefined) => {
  if (!value) return;

  const absolutePath = managedUploadPathToDisk(value);
  if (!absolutePath) return;

  try {
    await unlink(absolutePath);
  } catch {
    // No-op: file may not exist on disk in some deployment environments.
  }
};
