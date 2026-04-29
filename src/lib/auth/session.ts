import crypto from 'node:crypto';
import type { APIContext } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

const SESSION_COOKIE = 'racehub_session';
const SESSION_TTL_DAYS = 30;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const createSession = async (userId: string, context: APIContext) => {
  const token = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: context.clientAddress,
      userAgent: context.request.headers.get('user-agent') ?? undefined,
    },
  });

  context.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
};

export const destroySession = async (context: APIContext) => {
  const rawToken = context.cookies.get(SESSION_COOKIE)?.value;
  if (rawToken) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(rawToken) },
    });
  }
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
};

export const getSessionUser = async (context: APIContext) => {
  const rawToken = context.cookies.get(SESSION_COOKIE)?.value;
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const session = await withPerf('session.findUnique', () => prisma.session.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true, user: true },
  }));

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    context.cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }

  await withPerf('session.touch', () => prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  }));

  return session.user;
};
