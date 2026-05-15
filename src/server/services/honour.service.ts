import { HonourEventType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export const applyHonourEvent = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    delta: number;
    reason: string;
    type: HonourEventType;
    appliedById?: string;
    raceSlotId?: string;
    raceResultId?: string;
    metadata?: Prisma.InputJsonValue;
    warningIssued?: boolean;
  },
) => {
  await tx.honourEvent.create({
    data: {
      userId: input.userId,
      delta: input.delta,
      reason: input.reason,
      type: input.type,
      appliedById: input.appliedById,
      raceSlotId: input.raceSlotId,
      raceResultId: input.raceResultId,
      metadata: input.metadata,
      warningIssued: input.warningIssued ?? false,
    },
  });

  await tx.user.update({
    where: { id: input.userId },
    data: {
      honourScore: {
        increment: input.delta,
      },
    },
  });
};
