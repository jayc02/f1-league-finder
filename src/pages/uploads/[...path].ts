export const prerender = false;

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { managedUploadPathToDisk } from '@/lib/server/uploads';
import { HttpError, jsonResponse } from '@/lib/utils/http';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const pathValue = params.path || '';
    const publicPath = `/uploads/${String(pathValue).replace(/^\/+/, '')}`;
    const absolutePath = managedUploadPathToDisk(publicPath);

    if (!absolutePath) throw new HttpError(404, 'Upload not found.');

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const file = await readFile(absolutePath);

    return new Response(file, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return jsonResponse(404, { error: 'Upload not found.' });
  }
};
