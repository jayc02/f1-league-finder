import { PrismaClient, type Region, type PreferredPlatform, type RaceSlotStatus, type EventVisibility, type OrganiserProfileMemberRole, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();
const DEMO_EMAIL_DOMAIN = '@racehub.demo';
const DEFAULT_DEMO_PASSWORD = 'RaceHubDemo123!';
const clearMode = process.argv.includes('--clear');

const tracks = ['Monaco', 'Silverstone', 'Spa', 'Monza', 'Suzuka', 'Imola', 'Red Bull Ring', 'Nurburgring GP', 'Bathurst', 'Brands Hatch', 'Interlagos', 'Zandvoort'];
const formats = [
  'One-shot qualifying, 35% race',
  '15 min qualifying, 45 min sprint',
  'GT3 fixed setup, stewarded race',
  'Beginner friendly lobby, assists allowed',
  'No assists, simulation damage',
  'Clean racing rules enforced',
];
const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const usernames = [
  'magicmonkey', 'peanut05', 'mark245', 'sleepytoast', 'papichurro97', 'randomspoon', 'mintybrake', 'tommyapex', 'slowbanana', 'neonbadger',
  'joshua_r', 'sectorfox', 'velvetkerb', 'm4xshift', 'sunnyhelmet', 'driftmango', 'cerealdriver', 'northline44', 'quietpigeon', 'fastotter',
  'brakelamp', 'toastyracer', 'delta_jay', 'kerbline', 'apexmiles', 'turnone_tom', 'pixelkerb', 'latebraker', 'racingmika', 'vortexlap',
  'sprintnate', 'cleanapex', 'mintsector', 'trackmason', 'shiftlucas', 'racecraft_lee', 'coldtyre', 'greenflag90', 'pitlanepaul', 'brakebias_ben',
  'gridjamie', 'linehunter', 'quickmango', 'sectorivy', 'neonclutch', 'quietapex', 'finalsector', 'copperkerb', 'stormbrake', 'timingloop',
  'rubberline', 'fuelmix', 'nightshift44', 'softtyres', 'apexroomie', 'monzamikey', 'silverlap', 'redsector', 'chicanejoe', 'cleanexit',
  'northapex', 'midnightmax', 'deltaflow', 'sunnyshift', 'gridtoni', 'kerbwalker', 'overcut_owen', 'undercut_eli', 'tracklimit', 'freshslicks',
  'sectorseven', 'brakepoint', 'racepace17', 'lateapex', 'blueflagged', 'velvetline', 'ghostsector', 'apexcass', 'toastyracer2', 'mintythrottle',
  'markus_88', 'nightkerb', 'finalchicane', 'shiftmango', 'cerealapex', 'tyrewarmers', 'clutchpoint', 'lap_delta', 'gridrunner', 'cleanline05',
  'sectorpulse', 'northline78', 'sunnykerb', 'brakemarker', 'deltahelmet', 'quietshift', 'tracktoast', 'm4xsector', 'apexnora', 'pitexit12',
];

const communitySeeds = [
  ['apex-room', 'Apex Room', 'Weekly GT3 and Formula events with stewarded results and a friendly grid for committed drivers.', 'F1 24 and GT3', 'PC', 'EU', '#e10600', ['F1', 'GT3', 'Stewarded'], true, true],
  ['sunday-sprint-club', 'Sunday Sprint Club', 'European evening sprints with simple rules, SR-based grids, and fast post-race reviews.', 'F1 24 casual sprints', 'PLAYSTATION', 'EU', '#ff9f1c', ['Sprint', 'Weekend', 'Clean racing'], true, false],
  ['gridline-motorsport', 'Gridline Motorsport', 'Structured multi-tier racing for drivers who want clear results, tidy racecraft, and visible progression.', 'F1 24 multi-tier', 'PC', 'EU', '#d63031', ['Multi-tier', 'Weeknight', 'Rules'], true, true],
  ['late-brake-league', 'Late Brake League', 'Cross-platform race nights built around close battles, incident reviews, and transparent driver reputation.', 'F1 24 crossplay', 'XBOX', 'GLOBAL', '#7c3aed', ['Crossplay', 'Ranked', 'Social'], false, true],
  ['sector-seven-racing', 'Sector Seven Racing', 'Prime-time North American events with stewarded lobbies, clear penalties, and clean overtaking standards.', 'F1 24 NA league', 'PLAYSTATION', 'NA', '#00a3e0', ['Prime time', 'Broadcasted', 'Competitive'], false, true],
  ['apex-syndicate', 'Apex Syndicate', 'Fast no-assist grids for experienced drivers who value clean exits, fair defence, and proper result records.', 'F1 24 no assists', 'PC', 'EU', '#ef4444', ['No assists', 'Stewarded', 'Fast grids'], true, true],
  ['monza-after-dark', 'Monza After Dark', 'Late-night European lobbies with strict clean-racing etiquette and short-format ranked events.', 'F1 24 night lobbies', 'PC', 'EU', '#111827', ['Late night', 'Monza', 'Clean racing'], false, false],
  ['the-racing-room', 'The Racing Room', 'Casual-to-competitive community nights across F1, GT3, and endurance formats with a calm stewarding process.', 'F1, GT3, endurance', 'PC', 'GLOBAL', '#8e44ad', ['Cross-sim', 'Endurance', 'Community'], true, true],
  ['clean-lap-club', 'Clean Lap Club', 'Beginner-friendly racing group focused on finishing races, respectful comms, and building Honour over time.', 'Clean racing across sims', 'PC', 'GLOBAL', '#0984e3', ['Beginner friendly', 'Coaching', 'Inclusive'], true, true],
  ['northern-apex', 'Northern Apex', 'Evening grids for consistent drivers, with stewarded results and friendly practice sessions before race night.', 'Beginner F1 leagues', 'PLAYSTATION', 'NA', '#74b9ff', ['Evenings', 'Practice', 'Crossplay'], true, false],
  ['chicane-collective', 'Chicane Collective', 'Community-led events with rotating tracks, racecraft coaching, and a focus on fair wheel-to-wheel racing.', 'F1 24 social events', 'XBOX', 'GLOBAL', '#c0392b', ['Social', 'Rotating tracks', 'Casual'], false, false],
  ['delta-racing-hub', 'Delta Racing Hub', 'Driver-development hub with weekly pace groups, transparent SR movement, and practical post-race notes.', 'F1 24 development', 'PC', 'SA', '#1abc9c', ['Development', 'Pace groups', 'Coaching'], false, false],
  ['midnight-motorsport', 'Midnight Motorsport', 'After-hours racing with compact ranked events, clean lobbies, and a relaxed but serious stewarding tone.', 'F1 24 late night', 'PC', 'NA', '#6c5ce7', ['Late night', 'Crossplay', 'Ranked'], true, true],
  ['trackside-league', 'Trackside League', 'Regular race nights with driver rankings, incident reviews, and a strong emphasis on respectful competition.', 'F1 24 race nights', 'PLAYSTATION', 'EU', '#f1c40f', ['Race nights', 'Clean', 'Highlights'], true, false],
  ['club-130r', 'Club 130R', 'Suzuka-inspired sprint and feature races for drivers who enjoy technical tracks and measured racecraft.', 'F1 24 technical tracks', 'PC', 'APAC', '#fd79a8', ['Technical', 'Sprint', 'Feature races'], false, false],
  ['slipstream-social', 'Slipstream Social', 'Friendly mixed-skill grids with quick signups, clear etiquette, and RaceHub-backed reputation tracking.', 'F1 24 mixed skill', 'XBOX', 'GLOBAL', '#22c55e', ['Mixed skill', 'Social', 'Quick signups'], false, false],
  ['brake-bias-racing', 'Brake Bias Racing', 'Setup chat, short ranked races, and tidy wheel-to-wheel battles for drivers chasing better consistency.', 'F1 24 setup club', 'PC', 'APAC', '#06b6d4', ['Setups', 'Short races', 'Community'], false, false],
  ['final-sector-club', 'Final Sector Club', 'Close sprint formats, clean last-lap battles, and result history that keeps every season easy to follow.', 'Sprint and feature races', 'PC', 'EU', '#f97316', ['Sprint', 'Clean', 'Results'], true, false],
] as const;

type DemoUser = { id: string; username: string; email: string; role: Role; skillRating: number; honourScore: number; region: Region };
type DemoCommunity = { id: string; userId: string; slug: string; displayName: string; region: Region; platformFocus: PreferredPlatform | null };
type DemoLeague = { id: string; slug: string; ownerId: string; organiserProfileId: string; region: Region };

function databaseHostOnly() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return '(DATABASE_URL not set)';
  try {
    return new URL(raw).hostname;
  } catch {
    return '(unparseable DATABASE_URL host)';
  }
}

function requireSeedConfirmation() {
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    console.log('Set DEMO_SEED_ENABLED=true to run the fictional community seed.');
    process.exit(0);
  }
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_SEED_PRODUCTION_CONFIRM !== 'true') {
    console.log('Refusing to seed production without DEMO_SEED_PRODUCTION_CONFIRM=true.');
    process.exit(0);
  }
}

function printStartup() {
  console.log('RaceHub fictional community seed startup');
  console.log(`Database host: ${databaseHostOnly()}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV ?? '(not set)'}`);
  console.log(`Seed target: ${process.env.DEMO_SEED_TARGET ?? 'local'}`);
  console.log(`Clear mode: ${clearMode ? 'enabled' : 'disabled'}`);
  console.log(`Planned users: ${usernames.length}`);
  console.log(`Planned communities: ${communitySeeds.length}`);
  console.log('Planned race slots: 44');
}

function assertUniqueValues(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(', ')}`);
}

function daysFromNow(days: number, hourOffset = 0) {
  const date = new Date();
  date.setUTCHours(20, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(date.getUTCHours() + hourOffset);
  return date;
}

function isDemoEmail(email: string) {
  return email.endsWith(DEMO_EMAIL_DOMAIN);
}

async function knownDemoIds() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } }, select: { id: true } });
  const profiles = await prisma.organiserProfile.findMany({ where: { slug: { in: communitySeeds.map(([slug]) => slug) } }, select: { id: true } });
  const leagues = await prisma.league.findMany({ where: { slug: { in: communitySeeds.flatMap(([slug]) => [`${slug}-series`, `${slug}-demo-league`]) } }, select: { id: true } });
  const raceSlots = await prisma.raceSlot.findMany({
    where: { OR: [{ leagueId: { in: leagues.map((league) => league.id) } }, { organiserProfileId: { in: profiles.map((profile) => profile.id) } }] },
    select: { id: true },
  });
  const results = await prisma.raceResult.findMany({ where: { raceSlotId: { in: raceSlots.map((slot) => slot.id) } }, select: { id: true } });
  const disputes = await prisma.dispute.findMany({
    where: { OR: [{ raceSlotId: { in: raceSlots.map((slot) => slot.id) } }, { openedById: { in: users.map((user) => user.id) } }] },
    select: { id: true },
  });
  return {
    userIds: users.map((user) => user.id),
    profileIds: profiles.map((profile) => profile.id),
    leagueIds: leagues.map((league) => league.id),
    raceSlotIds: raceSlots.map((slot) => slot.id),
    resultIds: results.map((result) => result.id),
    disputeIds: disputes.map((dispute) => dispute.id),
  };
}

async function clearDemoData() {
  const ids = await knownDemoIds();
  await prisma.disputeEmailLog.deleteMany({ where: { OR: [{ disputeId: { in: ids.disputeIds } }, { recipientId: { in: ids.userIds } }, { sentById: { in: ids.userIds } }] } });
  await prisma.disputeStatusLog.deleteMany({ where: { OR: [{ disputeId: { in: ids.disputeIds } }, { changedById: { in: ids.userIds } }] } });
  await prisma.dispute.deleteMany({ where: { id: { in: ids.disputeIds } } });
  await prisma.communityRatingEvent.deleteMany({ where: { OR: [{ organiserProfileId: { in: ids.profileIds } }, { raceSlotId: { in: ids.raceSlotIds } }, { raceResultId: { in: ids.resultIds } }] } });
  await prisma.communityDriverRating.deleteMany({ where: { organiserProfileId: { in: ids.profileIds } } });
  await prisma.moderationAction.deleteMany({ where: { OR: [{ targetUserId: { in: ids.userIds } }, { raceSlotId: { in: ids.raceSlotIds } }, { disputeId: { in: ids.disputeIds } }] } });
  await prisma.honourEvent.deleteMany({ where: { OR: [{ userId: { in: ids.userIds } }, { raceSlotId: { in: ids.raceSlotIds } }, { raceResultId: { in: ids.resultIds } }] } });
  await prisma.raceResultEntry.deleteMany({ where: { OR: [{ userId: { in: ids.userIds } }, { raceResultId: { in: ids.resultIds } }] } });
  await prisma.raceResult.deleteMany({ where: { id: { in: ids.resultIds } } });
  await prisma.raceRegistration.deleteMany({ where: { OR: [{ userId: { in: ids.userIds } }, { raceSlotId: { in: ids.raceSlotIds } }] } });
  await prisma.raceSlot.deleteMany({ where: { id: { in: ids.raceSlotIds } } });
  await prisma.league.deleteMany({ where: { id: { in: ids.leagueIds } } });
  await prisma.organiserProfileMember.deleteMany({ where: { OR: [{ organiserProfileId: { in: ids.profileIds } }, { userId: { in: ids.userIds } }] } });
  await prisma.organiserProfile.deleteMany({ where: { id: { in: ids.profileIds } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids.userIds } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } } });
  console.log(`Seed clear complete. Removed safe seed users with ${DEMO_EMAIL_DOMAIN} emails and known community slugs only.`);
}

async function createUsers(passwordHash: string): Promise<DemoUser[]> {
  const users: DemoUser[] = [];
  for (const [index, username] of usernames.entries()) {
    const email = `${username}${DEMO_EMAIL_DOMAIN}`;
    const existingUsername = await prisma.user.findUnique({ where: { username }, select: { email: true } });
    if (existingUsername && !isDemoEmail(existingUsername.email)) {
      throw new Error(`Refusing to reuse existing non-demo username: ${username}`);
    }
    const role = index === 0 ? Role.ADMIN : index <= 15 ? Role.ORGANISER : Role.PLAYER;
    const region = (['GLOBAL', 'EU', 'NA', 'APAC', 'SA', 'MENA'][index % 6] ?? 'GLOBAL') as Region;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        username,
        passwordHash,
        role,
        region,
        avatarUrl: null,
        bio: 'Clean-racing regular focused on consistent finishes, respectful comms, and tidy wheel-to-wheel battles.',
      },
      create: {
        username,
        email,
        passwordHash,
        role,
        region,
        avatarUrl: null,
        bio: 'Clean-racing regular focused on consistent finishes, respectful comms, and tidy wheel-to-wheel battles.',
        skillRating: 1120 + ((index * 37) % 520),
        honourScore: 88 + ((index * 7) % 42),
      },
    });
    users.push(user as DemoUser);
  }
  return users;
}

async function createCommunities(users: DemoUser[]): Promise<DemoCommunity[]> {
  const communities: DemoCommunity[] = [];
  for (const [index, seed] of communitySeeds.entries()) {
    const [slug, displayName, shortDescription, gameFocus, platformFocus, region, color, tags, featured, verified] = seed;
    const owner = users[index + 1];
    const community = await prisma.organiserProfile.upsert({
      where: { slug },
      update: {
        userId: owner.id,
        displayName,
        shortDescription,
        description: `${shortDescription}`,
        brandingColor: color,
        logoUrl: null,
        bannerUrl: null,
        websiteUrl: null,
        discordUrl: `https://discord.gg/${slug.replaceAll('-', '')}`,
        redditUrl: null,
        gameFocus,
        platformFocus: platformFocus as PreferredPlatform,
        region: region as Region,
        tags: [...tags],
        isPublic: true,
        featured,
        verified,
        displayedMemberCount: 140 + index * 57,
        memberCountSource: 'manual',
        credibilityNotes: 'Race cleanly, respect blue flags, avoid intentional contact, and report incidents with evidence. Stewards may apply SR or Honour adjustments after reviewing results, incidents, and repeated behaviour.',
      },
      create: {
        userId: owner.id,
        slug,
        displayName,
        shortDescription,
        description: `${shortDescription}`,
        brandingColor: color,
        logoUrl: null,
        bannerUrl: null,
        websiteUrl: null,
        discordUrl: `https://discord.gg/${slug.replaceAll('-', '')}`,
        redditUrl: null,
        gameFocus,
        platformFocus: platformFocus as PreferredPlatform,
        region: region as Region,
        tags: [...tags],
        isPublic: true,
        featured,
        verified,
        displayedMemberCount: 140 + index * 57,
        memberCountSource: 'manual',
        credibilityNotes: 'Race cleanly, respect blue flags, avoid intentional contact, and report incidents with evidence. Stewards may apply SR or Honour adjustments after reviewing results, incidents, and repeated behaviour.',
      },
    });
    communities.push(community as DemoCommunity);
  }
  return communities;
}

async function createMemberships(users: DemoUser[], communities: DemoCommunity[]) {
  for (const [index, community] of communities.entries()) {
    const owner = users[index + 1];
    const staff = [users[16 + (index * 2) % 10], users[16 + (index * 2 + 1) % 10]].filter(Boolean);
    const memberCount = 5 + ((index * 3) % 21);
    const members = users.slice(26 + index, 26 + index + memberCount);
    const membershipRows = [
      { userId: owner.id, role: 'OWNER' as OrganiserProfileMemberRole },
      ...staff.map((user, staffIndex) => ({ userId: user.id, role: (staffIndex === 0 ? 'ADMIN' : 'MODERATOR') as OrganiserProfileMemberRole })),
      ...members.map((user) => ({ userId: user.id, role: 'MEMBER' as OrganiserProfileMemberRole })),
    ];
    const seen = new Set<string>();
    for (const row of membershipRows) {
      if (seen.has(row.userId)) continue;
      seen.add(row.userId);
      await prisma.organiserProfileMember.upsert({
        where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: row.userId } },
        update: { role: row.role, status: 'ACTIVE' },
        create: { organiserProfileId: community.id, userId: row.userId, role: row.role, status: 'ACTIVE' },
      });
    }
  }
}

async function createLeagues(communities: DemoCommunity[]): Promise<DemoLeague[]> {
  const leagues: DemoLeague[] = [];
  for (const [index, community] of communities.entries()) {
    const league = await prisma.league.upsert({
      where: { slug: `${community.slug}-series` },
      update: {
        name: `${community.displayName} Series`,
        description: `${community.displayName} race programme with stewarded results and community SR tracking.`,
        ownerId: community.userId,
        organiserProfileId: community.id,
        region: community.region,
        active: true,
        brandingPrimary: communitySeeds[index][6],
        brandingSecondary: '#111827',
      },
      create: {
        name: `${community.displayName} Series`,
        slug: `${community.slug}-series`,
        description: `${community.displayName} race programme with stewarded results and community SR tracking.`,
        ownerId: community.userId,
        organiserProfileId: community.id,
        region: community.region,
        active: true,
        brandingPrimary: communitySeeds[index][6],
        brandingSecondary: '#111827',
      },
    });
    leagues.push(league as DemoLeague);
  }
  return leagues;
}

async function clearDemoRaceActivityOnly() {
  const ids = await knownDemoIds();
  await prisma.disputeEmailLog.deleteMany({ where: { disputeId: { in: ids.disputeIds } } });
  await prisma.disputeStatusLog.deleteMany({ where: { disputeId: { in: ids.disputeIds } } });
  await prisma.dispute.deleteMany({ where: { id: { in: ids.disputeIds } } });
  await prisma.communityRatingEvent.deleteMany({ where: { OR: [{ organiserProfileId: { in: ids.profileIds } }, { raceSlotId: { in: ids.raceSlotIds } }, { raceResultId: { in: ids.resultIds } }] } });
  await prisma.communityDriverRating.deleteMany({ where: { organiserProfileId: { in: ids.profileIds } } });
  await prisma.moderationAction.deleteMany({ where: { raceSlotId: { in: ids.raceSlotIds } } });
  await prisma.honourEvent.deleteMany({ where: { OR: [{ raceSlotId: { in: ids.raceSlotIds } }, { raceResultId: { in: ids.resultIds } }] } });
  await prisma.raceResultEntry.deleteMany({ where: { raceResultId: { in: ids.resultIds } } });
  await prisma.raceResult.deleteMany({ where: { id: { in: ids.resultIds } } });
  await prisma.raceRegistration.deleteMany({ where: { raceSlotId: { in: ids.raceSlotIds } } });
  await prisma.raceSlot.deleteMany({ where: { id: { in: ids.raceSlotIds } } });
}

async function seedCommunityRatings(communities: DemoCommunity[]) {
  for (const [communityIndex, community] of communities.entries()) {
    const members = await prisma.organiserProfileMember.findMany({
      where: { organiserProfileId: community.id, status: 'ACTIVE' },
      select: { userId: true, role: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    for (const [memberIndex, member] of members.entries()) {
      const skillRating = 1120 + ((communityIndex * 73 + memberIndex * 41) % 430);
      const honourScore = Math.min(150, 86 + ((communityIndex * 9 + memberIndex * 11) % 58));
      const starts = 3 + ((communityIndex + memberIndex) % 14);
      const wins = memberIndex === 0 ? 2 + (communityIndex % 3) : memberIndex % 7 === 0 ? 1 : 0;
      const podiums = Math.min(starts, wins + (memberIndex % 4));
      const cleanRaces = Math.max(1, starts - ((communityIndex + memberIndex) % 4));
      const incidents = Math.max(0, starts - cleanRaces - 1);

      await prisma.communityDriverRating.upsert({
        where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: member.userId } },
        update: {
          skillRating,
          honourScore,
          starts,
          wins,
          podiums,
          cleanRaces,
          incidents,
          lastRaceAt: daysFromNow(-((communityIndex + memberIndex) % 18) - 1),
        },
        create: {
          organiserProfileId: community.id,
          userId: member.userId,
          skillRating,
          honourScore,
          starts,
          wins,
          podiums,
          cleanRaces,
          incidents,
          lastRaceAt: daysFromNow(-((communityIndex + memberIndex) % 18) - 1),
        },
      });

      await prisma.communityRatingEvent.create({
        data: {
          organiserProfileId: community.id,
          userId: member.userId,
          appliedById: community.userId,
          skillDelta: 0,
          honourDelta: 0,
          reason: 'Initial community rating baseline for early-season standings.',
          metadata: {
            source: 'racehub_seed',
            skillRating,
            honourScore,
            starts,
            cleanRaces,
          },
        },
      });
    }
  }
}

async function createRaceSlots(users: DemoUser[], leagues: DemoLeague[]) {
  const createdSlots: { id: string; status: RaceSlotStatus; maxPlayers: number; visibility: EventVisibility; completed: boolean; organiserId: string; leagueId: string; organiserProfileId: string }[] = [];
  const plan = [
    ...Array.from({ length: 18 }, (_, i) => ({ status: 'OPEN' as RaceSlotStatus, visibility: 'PUBLIC' as EventVisibility, days: i + 2 })),
    ...Array.from({ length: 4 }, (_, i) => ({ status: (i % 2 === 0 ? 'FULL' : 'LOCKED') as RaceSlotStatus, visibility: 'PUBLIC' as EventVisibility, days: i + 21 })),
    ...Array.from({ length: 10 }, (_, i) => ({ status: 'OPEN' as RaceSlotStatus, visibility: 'COMMUNITY_ONLY' as EventVisibility, days: i + 8 })),
    ...Array.from({ length: 6 }, (_, i) => ({ status: 'COMPLETED' as RaceSlotStatus, visibility: 'PUBLIC' as EventVisibility, days: -i - 2 })),
    ...Array.from({ length: 6 }, (_, i) => ({ status: (i < 2 ? 'CANCELLED' : 'OPEN') as RaceSlotStatus, visibility: (i < 2 ? 'UNLISTED' : 'PUBLIC') as EventVisibility, days: i + 30 })),
  ];

  for (const [index, item] of plan.entries()) {
    const league = leagues[index % leagues.length];
    const scheduledAt = daysFromNow(item.days, index % 5);
    const maxPlayers = item.status === 'FULL' ? 16 : 20;
    const slot = await prisma.raceSlot.create({
      data: {
        title: `${tracks[index % tracks.length]} ${item.visibility === 'COMMUNITY_ONLY' ? 'Members Cup' : item.status === 'COMPLETED' ? 'Result Night' : 'Open Grid'} ${index + 1}`,
        leagueId: league.id,
        organiserId: league.ownerId,
        organiserProfileId: league.organiserProfileId,
        scheduledAt,
        region: league.region,
        game: index % 4 === 0 ? 'Assetto Corsa Competizione' : index % 5 === 0 ? 'iRacing' : 'F1 24',
        platform: (index % 3 === 0 ? 'PC' : index % 3 === 1 ? 'PLAYSTATION' : 'XBOX') as PreferredPlatform,
        crossplay: index % 2 === 0,
        track: tracks[index % tracks.length],
        eventNotes: 'Community race night with stewarded results, clean-racing expectations, and visible SR movement.',
        visibility: item.visibility,
        formatDetails: formats[index % formats.length],
        lobbySettings: { source: 'racehub_seed', assists: index % 3 === 0 ? 'allowed' : 'limited', damage: index % 4 === 0 ? 'simulation' : 'standard' },
        maxPlayers,
        status: item.status,
        registrationCutoffAt: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
        rulesSummary: 'Respect racing room, leave space on corner exit, and accept organiser stewarding decisions.',
        eventTierLabel: 'Club Series',
        cancellationReason: item.status === 'CANCELLED' ? 'Calendar conflict after organiser review.' : null,
      },
    });
    createdSlots.push({
      id: slot.id,
      status: slot.status,
      maxPlayers: slot.maxPlayers,
      visibility: slot.visibility,
      completed: item.status === 'COMPLETED',
      organiserId: slot.organiserId,
      leagueId: slot.leagueId,
      organiserProfileId: league.organiserProfileId,
    });
  }

  for (const [index, slot] of createdSlots.entries()) {
    const shuffled = users.slice(26).sort((a, b) => ((a.username.charCodeAt(0) + index) % 13) - ((b.username.charCodeAt(0) + index) % 13));
    const desired = slot.status === 'FULL' ? slot.maxPlayers : slot.status === 'LOCKED' ? 11 : slot.completed ? 14 : slot.visibility === 'COMMUNITY_ONLY' ? 8 + (index % 7) : 3 + (index % 12);
    const entrants = shuffled.slice(0, Math.min(desired, slot.maxPlayers));
    await prisma.raceRegistration.createMany({ data: entrants.map((user) => ({ raceSlotId: slot.id, userId: user.id })), skipDuplicates: true });

    if (slot.completed) {
      const result = await prisma.raceResult.create({
        data: {
          raceSlotId: slot.id,
          submittedById: slot.organiserId,
          notes: 'Confirmed result with clean-driving bonuses and measured rating movement.',
          evidenceUrl: `https://example.com/racehub/results/${slot.id}.png`,
          confirmationState: 'confirmed',
          submittedAt: new Date(new Date().getTime() - (index + 1) * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(new Date().getTime() - index * 24 * 60 * 60 * 1000),
          entries: {
            create: entrants.map((user, position) => ({
              userId: user.id,
              finishingPosition: position + 1,
              pointsAwarded: points[position] ?? 0,
              ratingDelta: position < 3 ? 18 - position * 4 : position < 10 ? 5 - position : -3,
              honourDelta: position % 5 === 0 ? 2 : 1,
            })),
          },
        },
        include: { entries: true },
      });
      for (const entry of result.entries) {
        await prisma.user.update({ where: { id: entry.userId }, data: { skillRating: { increment: entry.ratingDelta }, honourScore: { increment: entry.honourDelta } } });
        await prisma.honourEvent.create({
          data: {
            userId: entry.userId,
            raceSlotId: slot.id,
            raceResultId: result.id,
            type: entry.honourDelta > 1 ? 'CLEAN_RACE' : 'ADMIN_ADJUSTMENT',
            delta: entry.honourDelta,
            reason: 'Clean-race and leaderboard activity event.',
            metadata: { source: 'racehub_seed', finishingPosition: entry.finishingPosition },
            appliedById: slot.organiserId,
          },
        });
        const previous = await prisma.communityDriverRating.upsert({
          where: { organiserProfileId_userId: { organiserProfileId: slot.organiserProfileId, userId: entry.userId } },
          update: {},
          create: {
            organiserProfileId: slot.organiserProfileId,
            userId: entry.userId,
            skillRating: 1000,
            honourScore: 100,
          },
        });
        const nextSkill = Math.max(0, previous.skillRating + entry.ratingDelta);
        const nextHonour = Math.max(0, Math.min(150, previous.honourScore + entry.honourDelta));
        await prisma.communityDriverRating.update({
          where: { id: previous.id },
          data: {
            skillRating: nextSkill,
            honourScore: nextHonour,
            starts: { increment: 1 },
            wins: { increment: entry.finishingPosition === 1 ? 1 : 0 },
            podiums: { increment: entry.finishingPosition <= 3 ? 1 : 0 },
            cleanRaces: { increment: entry.honourDelta > 0 ? 1 : 0 },
            lastRaceAt: result.submittedAt,
          },
        });
        await prisma.communityRatingEvent.create({
          data: {
            organiserProfileId: slot.organiserProfileId,
            userId: entry.userId,
            raceSlotId: slot.id,
            raceResultId: result.id,
            appliedById: slot.organiserId,
            skillDelta: entry.ratingDelta,
            honourDelta: entry.honourDelta,
            reason: 'Race result applied to community ranking.',
            metadata: {
              sourceMarker: 'racehub_seed',
              source: 'race_result',
              finishingPosition: entry.finishingPosition,
              before: { skillRating: previous.skillRating, honourScore: previous.honourScore },
              after: { skillRating: nextSkill, honourScore: nextHonour },
            },
          },
        });
      }
    }
  }
  return createdSlots;
}

async function createDisputes(users: DemoUser[], admin: DemoUser) {
  const completed = await prisma.raceSlot.findMany({
    where: { status: 'COMPLETED', league: { slug: { in: communitySeeds.flatMap(([slug]) => [`${slug}-series`, `${slug}-demo-league`]) } } },
    include: { result: true },
    take: 5,
  });
  for (const [index, slot] of completed.entries()) {
    const opener = users[40 + index];
    const dispute = await prisma.dispute.create({
      data: {
        raceSlotId: slot.id,
        raceResultId: slot.result?.id,
        openedById: opener.id,
        reason: ['Unsafe rejoin review', 'Track limits clarification', 'Lap-one contact report', 'Blue flag confusion', 'Qualifying block review'][index],
        details: 'Incident report opened for steward review with supporting context and a clear requested outcome.',
        status: index % 2 === 0 ? 'RESOLVED' : 'UNDER_REVIEW',
        adminNotes: 'Steward note added after reviewing the event timeline.',
        resolutionNotes: index % 2 === 0 ? 'Review completed with no further action required.' : null,
        resolvedAt: index % 2 === 0 ? new Date() : null,
        resolvedById: index % 2 === 0 ? admin.id : null,
      },
    });
    await prisma.disputeStatusLog.create({ data: { disputeId: dispute.id, fromStatus: null, toStatus: 'OPEN', note: 'Dispute opened.', changedById: opener.id } });
    if (index % 2 === 0) {
      await prisma.disputeStatusLog.create({ data: { disputeId: dispute.id, fromStatus: 'OPEN', toStatus: 'RESOLVED', note: 'Dispute resolved.', changedById: admin.id } });
    }
    await prisma.moderationAction.create({
      data: {
        actionType: index % 2 === 0 ? 'DISPUTE_RESOLUTION' : 'WARNING',
        targetUserId: users[55 + index].id,
        adminId: admin.id,
        disputeId: dispute.id,
        raceSlotId: slot.id,
        notes: 'Moderation activity recorded from stewarding workflow.',
        metadata: { source: 'racehub_seed' },
      },
    });
  }
}

async function main() {
  requireSeedConfirmation();
  printStartup();
  assertUniqueValues(usernames, 'usernames');
  assertUniqueValues(communitySeeds.map(([slug]) => slug), 'community slugs');

  if (clearMode) {
    await clearDemoData();
    return;
  }

  const password = process.env.DEMO_USER_PASSWORD ?? DEFAULT_DEMO_PASSWORD;
  if (!process.env.DEMO_USER_PASSWORD) {
    console.warn('DEMO_USER_PASSWORD is not set; using the seed-only default password. Do not use this for real accounts.');
  }
  const passwordHash = await hashPassword(password);
  const users = await createUsers(passwordHash);
  const communities = await createCommunities(users);
  await createMemberships(users, communities);
  const leagues = await createLeagues(communities);
  await clearDemoRaceActivityOnly();
  await seedCommunityRatings(communities);
  const slots = await createRaceSlots(users, leagues);
  await createDisputes(users, users[0]);

  const completedResults = await prisma.raceResult.count({ where: { raceSlot: { league: { slug: { in: communitySeeds.flatMap(([slug]) => [`${slug}-series`, `${slug}-demo-league`]) } } } } });
  console.log('Fictional community seed complete');
  console.log(`Seeded users: ${users.length}`);
  console.log(`Seeded communities: ${communities.length}`);
  console.log(`Seeded race slots: ${slots.length}`);
  console.log(`Seeded completed results: ${completedResults}`);
  console.log(`Seeded records are identifiable by ${DEMO_EMAIL_DOMAIN} emails and known community slugs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
