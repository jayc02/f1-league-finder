export const prerender = false;

import type { APIRoute } from 'astro';
import { getDashboardPageData } from '@/server/services/dashboard.service';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const { upcomingRegistrations, upcomingEvents, myDuels, organiserProfile, staffMembership, communityRankings } = await getDashboardPageData(user.id);
    const managedCommunity = organiserProfile ?? staffMembership?.organiserProfile ?? null;
    const organiserCtaLabel = organiserProfile ? 'Manage Community' : staffMembership ? 'Staff Community' : 'Create Community';
    const response = jsonResponse(200, { upcomingRegistrations, upcomingEvents, myDuels, managedCommunity, organiserCtaLabel, communityRankings });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
