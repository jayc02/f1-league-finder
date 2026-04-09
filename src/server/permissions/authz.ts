import { Role, type User } from '@prisma/client';
import type { APIContext } from 'astro';
import { getSessionUser } from '@/lib/auth/session';
import { HttpError } from '@/lib/utils/http';

export const requireUser = async (context: APIContext): Promise<User> => {
  const user = await getSessionUser(context);
  if (!user) throw new HttpError(401, 'Authentication required.');
  return user;
};

export const requireRole = (user: User, allowed: Role[]) => {
  if (!allowed.includes(user.role)) {
    throw new HttpError(403, 'Insufficient permissions for this action.');
  }
};

export const requireAdmin = (user: User) => requireRole(user, [Role.ADMIN]);
export const requireOrganiserOrAdmin = (user: User) => requireRole(user, [Role.ORGANISER, Role.ADMIN]);
