import crypto from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

const normalizeUsername = (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

export const generateUniqueUsername = async (seed: string) => {
  const base = normalizeUsername(seed).slice(0, 20) || 'racer';

  for (let index = 0; index < 6; index += 1) {
    const suffix = index === 0 ? '' : `_${crypto.randomBytes(2).toString('hex')}`;
    const username = `${base}${suffix}`.slice(0, 24);
    const exists = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!exists) return username;
  }

  return `racer_${crypto.randomBytes(3).toString('hex')}`;
};
