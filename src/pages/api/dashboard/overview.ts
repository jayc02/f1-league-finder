export const prerender = false;

import type { APIRoute } from 'astro';
import { getDashboardPageData } from '@/server/services/dashboard.service';
import { withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const { upcomingRegistrations, upcomingEvents, organiserProfile, staffMembership } = await getDashboardPageData(user.id);
    const managedCommunity = organiserProfile ?? staffMembership?.organiserProfile ?? null;
    const organiserCtaLabel = organiserProfile ? 'Manage Community' : staffMembership ? 'Staff Community' : 'Create Community';
    return jsonResponse(200, { upcomingRegistrations, upcomingEvents, managedCommunity, organiserCtaLabel });
  });
