import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.moderationAction.deleteMany();
  await prisma.honourEvent.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.raceResultEntry.deleteMany();
  await prisma.raceResult.deleteMany();
  await prisma.raceRegistration.deleteMany();
  await prisma.raceSlot.deleteMany();
  await prisma.league.deleteMany();
  await prisma.organiserProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin_control',
      email: 'admin@f1grid.local',
      passwordHash,
      role: Role.ADMIN,
      honourScore: 130,
      skillRating: 1500,
      region: 'GLOBAL',
    },
  });

  const organiserA = await prisma.user.create({
    data: {
      username: 'pitwall_pulse',
      email: 'organiser1@f1grid.local',
      passwordHash,
      role: Role.ORGANISER,
      region: 'EU',
      honourScore: 120,
      skillRating: 1420,
    },
  });

  const organiserB = await prisma.user.create({
    data: {
      username: 'sector3_ops',
      email: 'organiser2@f1grid.local',
      passwordHash,
      role: Role.ORGANISER,
      region: 'NA',
      honourScore: 118,
      skillRating: 1390,
    },
  });

  const players = await Promise.all(
    [
      ['verstappen_fan', 'EU', 1610, 112],
      ['smooth_operator', 'EU', 1550, 115],
      ['rainmaster_44', 'NA', 1490, 110],
      ['late_braker', 'NA', 1460, 109],
      ['monaco_ghost', 'EU', 1520, 116],
      ['tyre_whisperer', 'APAC', 1420, 120],
      ['aero_hawk', 'MENA', 1400, 105],
      ['track_limits', 'SA', 1360, 98],
      ['clean_exit', 'EU', 1340, 124],
      ['delta_time', 'NA', 1310, 104],
      ['ERS_boost', 'APAC', 1280, 100],
      ['parc_ferme', 'EU', 1260, 102],
    ].map(([username, region, skillRating, honourScore], index) =>
      prisma.user.create({
        data: {
          username: username as string,
          email: `player${index + 1}@f1grid.local`,
          passwordHash,
          role: Role.PLAYER,
          region: region as never,
          skillRating: skillRating as number,
          honourScore: honourScore as number,
        },
      }),
    ),
  );

  const orgProfileA = await prisma.organiserProfile.create({
    data: {
      userId: organiserA.id,
      displayName: 'Pitwall Pulse Racing',
      description: 'Structured EU evenings with stewarded racing.',
      brandingColor: '#E10600',
      verified: true,
    },
  });

  const orgProfileB = await prisma.organiserProfile.create({
    data: {
      userId: organiserB.id,
      displayName: 'Sector 3 Operations',
      description: 'NA prime-time championship race slots.',
      brandingColor: '#00A3E0',
      verified: true,
    },
  });

  const leagueA = await prisma.league.create({
    data: {
      name: 'F1 Apex EU Championship',
      slug: 'f1-apex-eu',
      description: 'Competitive no-assist EU weekly league with clean driving standards.',
      ownerId: organiserA.id,
      organiserProfileId: orgProfileA.id,
      region: 'EU',
      brandingPrimary: '#E10600',
      brandingSecondary: '#1E1E1E',
    },
  });

  const leagueB = await prisma.league.create({
    data: {
      name: 'North America Night Grid',
      slug: 'na-night-grid',
      description: 'NA evening race slots focused on attendance consistency and fair racing.',
      ownerId: organiserB.id,
      organiserProfileId: orgProfileB.id,
      region: 'NA',
      brandingPrimary: '#0057B8',
      brandingSecondary: '#FFFFFF',
    },
  });

  const now = Date.now();
  const upcoming = [
    { days: 2, league: leagueA, organiser: organiserA, title: 'Imola Sprint Qualifier' },
    { days: 4, league: leagueA, organiser: organiserA, title: 'Barcelona Main Event' },
    { days: 3, league: leagueB, organiser: organiserB, title: 'Montreal Evening Slot' },
    { days: 5, league: leagueB, organiser: organiserB, title: 'Austin Prime Lobby' },
  ];

  for (const slot of upcoming) {
    const scheduledAt = new Date(now + slot.days * 24 * 60 * 60 * 1000);
    const cutoff = new Date(scheduledAt.getTime() - 3 * 60 * 60 * 1000);

    const created = await prisma.raceSlot.create({
      data: {
        title: slot.title,
        leagueId: slot.league.id,
        organiserId: slot.organiser.id,
        organiserProfileId: slot.organiser.id === organiserA.id ? orgProfileA.id : orgProfileB.id,
        scheduledAt,
        region: slot.league.region,
        platform: 'PC',
        crossplay: true,
        formatDetails: '18-minute qualy + 50% race, strict corner cutting, dynamic weather',
        lobbySettings: { assists: 'limited', safetyCar: 'reduced', damage: 'standard' },
        maxPlayers: 20,
        status: 'OPEN',
        registrationCutoffAt: cutoff,
        rulesSummary: 'One mandatory stop, steward review for collisions, no divebombing from >1 car length back.',
        stakeTierMetadata: 'pro-tier',
      },
    });

    for (const player of players.slice(0, 12)) {
      await prisma.raceRegistration.create({
        data: { raceSlotId: created.id, userId: player.id },
      });
    }
  }

  const completedSlot = await prisma.raceSlot.create({
    data: {
      title: 'Silverstone Weekly Final',
      leagueId: leagueA.id,
      organiserId: organiserA.id,
      organiserProfileId: orgProfileA.id,
      scheduledAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      region: 'EU',
      platform: 'PC',
      crossplay: true,
      formatDetails: 'Short qualy + 35% race',
      maxPlayers: 20,
      status: 'COMPLETED',
      registrationCutoffAt: new Date(now - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      rulesSummary: 'Stewarded race. Contact reviewed by organisers.',
    },
  });

  const entrants = players.slice(0, 10);
  await prisma.raceRegistration.createMany({
    data: entrants.map((p) => ({ raceSlotId: completedSlot.id, userId: p.id })),
  });

  const result = await prisma.raceResult.create({
    data: {
      raceSlotId: completedSlot.id,
      submittedById: organiserA.id,
      notes: 'Tight race with one late safety car period.',
      evidenceUrl: 'https://example.com/silverstone-result.png',
      confirmationState: 'confirmed',
      confirmedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      entries: {
        create: entrants.map((p, index) => ({
          userId: p.id,
          finishingPosition: index + 1,
          pointsAwarded: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index] ?? 0,
          ratingDelta: Math.max(10 - index, -5),
          honourDelta: index < 6 ? 1 : 0,
        })),
      },
    },
    include: { entries: true },
  });

  for (const entry of result.entries) {
    await prisma.user.update({
      where: { id: entry.userId },
      data: {
        skillRating: { increment: entry.ratingDelta },
        honourScore: { increment: entry.honourDelta },
      },
    });

    await prisma.honourEvent.create({
      data: {
        userId: entry.userId,
        raceSlotId: completedSlot.id,
        raceResultId: result.id,
        type: 'CLEAN_RACE',
        delta: entry.honourDelta,
        reason: 'Race completion and clean conduct.',
        appliedById: organiserA.id,
      },
    });
  }

  const dispute = await prisma.dispute.create({
    data: {
      raceSlotId: completedSlot.id,
      raceResultId: result.id,
      openedById: entrants[5].id,
      reason: 'Collision under safety car restart',
      details: 'Car ahead braked unexpectedly before green flag timing, requesting review.',
      status: 'UNDER_REVIEW',
      adminNotes: 'Awaiting onboard evidence from both drivers.',
    },
  });

  await prisma.moderationAction.create({
    data: {
      actionType: 'WARNING',
      targetUserId: entrants[7].id,
      adminId: admin.id,
      disputeId: dispute.id,
      raceSlotId: completedSlot.id,
      notes: 'Warning issued for erratic defensive movement under braking.',
      metadata: { warningLevel: 1 },
    },
  });

  console.log('Seed complete ✅');
  console.log('Admin: admin@f1grid.local / ChangeMe123!');
  console.log('Organiser: organiser1@f1grid.local / ChangeMe123!');
  console.log('Player: player1@f1grid.local / ChangeMe123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
