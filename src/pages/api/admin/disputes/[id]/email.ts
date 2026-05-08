export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { adminDisputeEmailSchema } from '@/lib/validation/admin';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';
import { sendPlatformEmail } from '@/server/services/email.service';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Dispute ID is required.');

    const body = await parseBody(context.request, adminDisputeEmailSchema);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, username: true, email: true } },
        raceSlot: { include: { organiser: { select: { id: true, username: true, email: true } } } },
      },
    });

    if (!dispute) throw new HttpError(404, 'Dispute not found.');

    const recipients = [] as Array<{ id: string; username: string; email: string }>;
    if (body.recipientMode === 'REPORTER' || body.recipientMode === 'BOTH') recipients.push(dispute.openedBy);
    if (body.recipientMode === 'ORGANISER' || body.recipientMode === 'BOTH') recipients.push(dispute.raceSlot.organiser);

    const uniqueRecipients = Array.from(new Map(recipients.map((item) => [item.id, item])).values());
    if (!uniqueRecipients.length) throw new HttpError(400, 'No recipient resolved for this dispute email.');

    const sent = [] as Array<{ id: string; email: string }>;

    for (const recipient of uniqueRecipients) {
      const message = [
        `Hello ${recipient.username},`,
        '',
        `This is an update regarding dispute ${dispute.id} for event "${dispute.raceSlot.title}".`,
        '',
        body.body,
        '',
        `Current status: ${dispute.status}`,
        'RaceHub Moderation Team',
      ].join('\n');

      const providerMessage = await sendPlatformEmail({
        to: recipient.email,
        subject: body.subject,
        text: message,
      });

      await prisma.disputeEmailLog.create({
        data: {
          disputeId: dispute.id,
          sentById: admin.id,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          subject: body.subject,
          bodyPreview: body.body.slice(0, 240),
        },
      });

      sent.push({ id: providerMessage.id, email: recipient.email });
    }

    return jsonResponse(200, { ok: true, sent });
  });
