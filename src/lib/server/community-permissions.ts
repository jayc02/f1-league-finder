import { OrganiserProfileMemberRole, OrganiserProfileMemberStatus, Role, type OrganiserProfile, type OrganiserProfileMember, type User } from '@prisma/client';
import type { APIContext } from 'astro';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { HttpError } from '@/lib/utils/http';

type CommunityLike = Pick<OrganiserProfile, 'id' | 'userId'>;
type Membership = OrganiserProfileMember | { role: OrganiserProfileMemberRole; status: OrganiserProfileMemberStatus } | null;

const activeStaffRoles = [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR] as const;

export const getCommunityMembership = async (userId: string, organiserProfileId: string) =>
  prisma.organiserProfileMember.findUnique({
    where: { organiserProfileId_userId: { organiserProfileId, userId } },
    include: { user: { select: { id: true, username: true, avatarUrl: true, role: true } } },
  });

export const userCommunityRole = async (user: Pick<User, 'id' | 'role'>, organiserProfile: CommunityLike): Promise<OrganiserProfileMemberRole | null> => {
  if (user.role === Role.ADMIN) return OrganiserProfileMemberRole.OWNER;
  if (organiserProfile.userId === user.id) return OrganiserProfileMemberRole.OWNER;
  const membership = await prisma.organiserProfileMember.findUnique({
    where: { organiserProfileId_userId: { organiserProfileId: organiserProfile.id, userId: user.id } },
    select: { role: true, status: true },
  });
  if (!membership || membership.status !== OrganiserProfileMemberStatus.ACTIVE) return null;
  return membership.role;
};

export const requirePlatformAdmin = async (context: APIContext): Promise<User> => {
  const user = await getSessionUser(context);
  if (!user) throw new HttpError(401, 'Authentication required.');
  if (user.role !== Role.ADMIN) throw new HttpError(403, 'Platform admin access required.');
  return user;
};

export const requireCommunityRole = async (
  context: APIContext,
  organiserProfileId: string,
  allowedRoles: OrganiserProfileMemberRole[],
): Promise<{ user: User; organiserProfile: CommunityLike; role: OrganiserProfileMemberRole }> => {
  const user = await getSessionUser(context);
  if (!user) throw new HttpError(401, 'Authentication required.');

  const organiserProfile = await prisma.organiserProfile.findUnique({
    where: { id: organiserProfileId },
    select: { id: true, userId: true },
  });
  if (!organiserProfile) throw new HttpError(404, 'Community not found.');

  const role = await userCommunityRole(user, organiserProfile);
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpError(403, 'Insufficient community permissions.');
  }

  return { user, organiserProfile, role };
};

export const hasCommunityRole = (membership: Membership, allowedRoles: OrganiserProfileMemberRole[]) =>
  Boolean(membership && membership.status === OrganiserProfileMemberStatus.ACTIVE && allowedRoles.includes(membership.role));

export const canManageCommunity = async (user: Pick<User, 'id' | 'role'>, organiserProfile: CommunityLike) =>
  Boolean(await userCommunityRole(user, organiserProfile));

export const canManageCommunityProfile = async (user: Pick<User, 'id' | 'role'>, organiserProfile: CommunityLike) => {
  const role = await userCommunityRole(user, organiserProfile);
  return Boolean(role && [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN].includes(role));
};

export const canManageCommunityRaces = async (user: Pick<User, 'id' | 'role'>, organiserProfile: CommunityLike) => {
  const role = await userCommunityRole(user, organiserProfile);
  return Boolean(role && [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN].includes(role));
};

export const canManageCommunityMembers = async (user: Pick<User, 'id' | 'role'>, organiserProfile: CommunityLike) => {
  const role = await userCommunityRole(user, organiserProfile);
  return Boolean(role && activeStaffRoles.includes(role as never));
};

export { OrganiserProfileMemberRole, OrganiserProfileMemberStatus };
