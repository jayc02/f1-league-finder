import { PrismaClient, type Region, type PreferredPlatform, type RaceSlotStatus, type EventVisibility, type OrganiserProfileMemberRole, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();
const DEMO_EMAIL_DOMAIN = '@racehub.demo';
const DEFAULT_DEMO_PASSWORD = 'RaceHubDemo123!';
const clearMode = process.argv.includes('--clear');

const tracks = ['Monaco', 'Silverstone', 'Spa', 'Monza', 'Suzuka', 'Imola', 'Red Bull Ring', 'Nürburgring GP', 'Bathurst', 'Brands Hatch', 'Interlagos', 'Zandvoort'];
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
  'magicmonkey',
  'peanut05',
  'tinywizard',
  'orangebucket',
  'sleepytoast',
  'beans17',
  'spoonrocket',
  'mossywindow',
  'froghelmet',
  'cloudy245',
  'wafflebat',
  'paperclip17',
  'moonpickle',
  'greenteabag',
  'softbrick',
  'rubberduck88',
  'crispycloud',
  'magic_otter',
  'melonchair',
  'biscuit09',
  'dustyplanet',
  'noodle_88',
  'purplekettle',
  'otterlogic',
  'pickleboots',
  'toastghost',
  'bluebadger',
  'quietmango',
  'snailrocket',
  'mysticmug',
  'ferretjacket',
  'sleepybutton',
  'rustybanana',
  'cabbageking',
  'wonkydesk',
  'tinyferret',
  'muffinpilot',
  'cosmicspoon',
  'wafflewizard',
  'plasticmoon',
  'gardenfrog',
  'bucketmouse',
  'pudding07',
  'jellyhelmet',
  'dustymango',
  'toasterelf',
  'pixelbadger',
  'softnoodle',
  'marbletoast',
  'orangeotter',
  'crunchysock',
  'moonwaffle',
  'lofi_pigeon',
  'teapotghost',
  'magicbeans',
  'sleepyferret',
  'tiny_pickle',
  'cloudymonkey',
  'randomspoon',
  'mossriver',
  'stonepixel',
  'blueatlas',
  'quietnova',
  'oldboots',
  'redchair',
  'greenmug',
  'window88',
  'paperplane17',
  'rubbertoast',
  'jellybean245',
  'oddmelon',
  'cosmicmuffin',
  'fuzzybucket',
  'pigeonhat',
  'wobblymug',
  'frogsocks',
  'plasticpigeon',
  'mangomoon',
  'toastybadger',
  'sleepykiwi',
  'tinysquid',
  'moonhelmet',
  'crunchytoast',
  'bucketwizard',
  'lofi_banana',
  'gremlinmug',
  'puddingghost',
  'waffleduck',
  'teabagwizard',
  'orangeferret',
  'magicnoodle',
  'cloudysock',
  'pickleplanet',
  'muffinchair',
  'rubberfrog',
  'snailbucket',
  'pixeltoast',
  'softotter',
  'tinybadger',
  'mossymonkey',
];

const communitySeeds = [
  ['apex-syndicate', 'Apex Syndicate', 'F1 24 stewarded championships for fast clean drivers.', 'F1 24', 'PC', 'EU', '#e10600', ['F1', 'No assists', 'Stewarded'], true, true],
  ['sunday-sprint-club', 'Sunday Sprint Club', 'Relaxed weekend sprint races with clear rules.', 'F1 24 casual sprints', 'PLAYSTATION', 'EU', '#ff9f1c', ['Beginner friendly', 'Sprint', 'Weekend'], true, false],
  ['nightshift-racing', 'Nightshift Racing', 'Late night cross-platform racing for after-hours drivers.', 'F1 24 late night', 'PC', 'NA', '#6c5ce7', ['Late night', 'Crossplay', 'Social'], true, true],
  ['velocity-gt', 'Velocity GT', 'GT3 grids with fixed setups and post-race reports.', 'GT3 fixed setup', 'PC', 'GLOBAL', '#00b894', ['GT3', 'Fixed setup', 'Endurance'], true, false],
  ['clean-racing-collective', 'Clean Racing Collective', 'Community-first lobbies focused on incident-free racing.', 'Clean racing across sims', 'PC', 'GLOBAL', '#0984e3', ['Clean racing', 'Coaching', 'Inclusive'], true, true],
  ['sector-three-racing', 'Sector Three Racing', 'Competitive North American prime-time championships.', 'F1 24 NA league', 'PLAYSTATION', 'NA', '#00a3e0', ['Prime time', 'Broadcasted', 'Competitive'], false, true],
  ['kerbside-league', 'Kerbside League', 'Friendly ladder races with quick steward decisions.', 'F1 24 ladder', 'XBOX', 'EU', '#2d3436', ['Ladder', 'Assists allowed', 'Friendly'], false, false],
  ['gridline-motorsport', 'Gridline Motorsport', 'Structured multi-tier league racing on weeknights.', 'F1 24 multi-tier', 'PC', 'EU', '#d63031', ['Multi-tier', 'Weeknight', 'Rules'], true, true],
  ['brake-bias-club', 'Brake Bias Club', 'Setup chat, short races, and tidy wheel-to-wheel battles.', 'F1 24 setup club', 'PC', 'APAC', '#fd79a8', ['Setups', 'Short races', 'Community'], false, false],
  ['northstar-racing', 'Northstar Racing', 'Beginner-friendly evening grids for consistent drivers.', 'Beginner F1 leagues', 'PLAYSTATION', 'NA', '#74b9ff', ['Beginner friendly', 'Evenings', 'Crossplay'], true, false],
  ['redline-social', 'Redline Social', 'Social races with light stewarding and rotating tracks.', 'F1 24 social events', 'XBOX', 'GLOBAL', '#c0392b', ['Social', 'Rotating tracks', 'Casual'], false, false],
  ['final-lap-society', 'Final Lap Society', 'Close sprint formats and clean last-lap battles.', 'Sprint and feature races', 'PC', 'EU', '#f1c40f', ['Sprint', 'Clean', 'Highlights'], true, false],
  ['delta-pace-league', 'Delta Pace League', 'Driver-development league with weekly pace groups.', 'F1 24 development', 'PC', 'SA', '#1abc9c', ['Development', 'Pace groups', 'Coaching'], false, false],
  ['the-racing-room', 'The Racing Room', 'Cross-sim community nights for F1, GT3, and touring cars.', 'F1 and Assetto Corsa', 'PC', 'GLOBAL', '#8e44ad', ['Assetto Corsa', 'GT3', 'Cross-sim'], true, true],
  ['monza-after-dark', 'Monza After Dark', 'Late-night European lobbies with strict clean-racing etiquette.', 'F1 24 night lobbies', 'PC', 'EU', '#111827', ['Late night', 'Monza', 'Clean racing'], false, false],
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
    console.log('Set DEMO_SEED_ENABLED=true to run demo seed.');
    process.exit(0);
  }
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_SEED_PRODUCTION_CONFIRM !== 'true') {
    console.log('Refusing to seed production without DEMO_SEED_PRODUCTION_CONFIRM=true.');
    process.exit(0);
  }
}

function printStartup() {
  console.log('RaceHub demo seed startup');
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
  const leagues = await prisma.league.findMany({ where: { slug: { in: communitySeeds.map(([slug]) => `${slug}-demo-league`) } }, select: { id: true } });
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
  console.log(`Demo clear complete. Removed demo users with ${DEMO_EMAIL_DOMAIN} emails and known demo community slugs only.`);
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
        avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${username}`,
        bio: 'Fictional RaceHub demo account used for public demo data.',
      },
      create: {
        username,
        email,
        passwordHash,
        role,
        region,
        avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${username}`,
        bio: 'Fictional RaceHub demo account used for public demo data.',
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
        description: `${shortDescription} This fictional demo community exists so RaceHub visitors can explore populated community, league, race, and leaderboard pages.`,
        brandingColor: color,
        logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${slug}`,
        bannerUrl: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1517649763962-0c623066013b' : '1461896836934-ffe607ba8211'}?auto=format&fit=crop&w=1600&q=80`,
        websiteUrl: `https://${slug}.racehub.demo`,
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
        memberCountSource: 'demo-seed',
        credibilityNotes: 'Fictional demo organiser profile created by RaceHub demo seed.',
      },
      create: {
        userId: owner.id,
        slug,
        displayName,
        shortDescription,
        description: `${shortDescription} This fictional demo community exists so RaceHub visitors can explore populated community, league, race, and leaderboard pages.`,
        brandingColor: color,
        logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${slug}`,
        bannerUrl: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1517649763962-0c623066013b' : '1461896836934-ffe607ba8211'}?auto=format&fit=crop&w=1600&q=80`,
        websiteUrl: `https://${slug}.racehub.demo`,
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
        memberCountSource: 'demo-seed',
        credibilityNotes: 'Fictional demo organiser profile created by RaceHub demo seed.',
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
      where: { slug: `${community.slug}-demo-league` },
      update: {
        name: `${community.displayName} Demo League`,
        description: `Fictional ${community.displayName} league populated by the RaceHub demo seed.`,
        ownerId: community.userId,
        organiserProfileId: community.id,
        region: community.region,
        active: true,
        brandingPrimary: communitySeeds[index][6],
        brandingSecondary: '#111827',
      },
      create: {
        name: `${community.displayName} Demo League`,
        slug: `${community.slug}-demo-league`,
        description: `Fictional ${community.displayName} league populated by the RaceHub demo seed.`,
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
        eventNotes: 'Fictional RaceHub demo event with realistic attendance, stewarding, and leaderboard impact.',
        visibility: item.visibility,
        formatDetails: formats[index % formats.length],
        lobbySettings: { demoSeed: true, assists: index % 3 === 0 ? 'allowed' : 'limited', damage: index % 4 === 0 ? 'simulation' : 'standard' },
        maxPlayers,
        status: item.status,
        registrationCutoffAt: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
        rulesSummary: 'Respect racing room, leave space on corner exit, and accept organiser stewarding decisions.',
        eventTierLabel: 'Demo Series',
        cancellationReason: item.status === 'CANCELLED' ? 'Fictional demo cancellation due to calendar conflict.' : null,
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
          notes: 'Confirmed fictional demo result with clean driving bonuses and small rating movement.',
          evidenceUrl: `https://example.com/racehub-demo/results/${slot.id}.png`,
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
            reason: 'Fictional demo clean-race and leaderboard activity event.',
            metadata: { demoSeed: true, finishingPosition: entry.finishingPosition },
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
            reason: 'Fictional demo race result applied to community ranking.',
            metadata: {
              demoSeed: true,
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
    where: { status: 'COMPLETED', league: { slug: { in: communitySeeds.map(([slug]) => `${slug}-demo-league`) } } },
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
        reason: ['Fictional unsafe rejoin review', 'Fictional track limits clarification', 'Fictional lap-one contact report', 'Fictional blue flag confusion', 'Fictional qualifying block review'][index],
        details: 'Demo-only dispute record for showcasing organiser workflow. No real person or real incident is represented.',
        status: index % 2 === 0 ? 'RESOLVED' : 'UNDER_REVIEW',
        adminNotes: 'Demo steward note created by production-safe seed.',
        resolutionNotes: index % 2 === 0 ? 'Demo review completed with no further action required.' : null,
        resolvedAt: index % 2 === 0 ? new Date() : null,
        resolvedById: index % 2 === 0 ? admin.id : null,
      },
    });
    await prisma.disputeStatusLog.create({ data: { disputeId: dispute.id, fromStatus: null, toStatus: 'OPEN', note: 'Demo dispute opened.', changedById: opener.id } });
    if (index % 2 === 0) {
      await prisma.disputeStatusLog.create({ data: { disputeId: dispute.id, fromStatus: 'OPEN', toStatus: 'RESOLVED', note: 'Demo dispute resolved.', changedById: admin.id } });
    }
    await prisma.moderationAction.create({
      data: {
        actionType: index % 2 === 0 ? 'DISPUTE_RESOLUTION' : 'WARNING',
        targetUserId: users[55 + index].id,
        adminId: admin.id,
        disputeId: dispute.id,
        raceSlotId: slot.id,
        notes: 'Fictional demo moderation activity for RaceHub admin screens.',
        metadata: { demoSeed: true },
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
    console.warn('DEMO_USER_PASSWORD is not set; using the demo-only default password. Do not use this for real accounts.');
  }
  const passwordHash = await hashPassword(password);
  const users = await createUsers(passwordHash);
  const communities = await createCommunities(users);
  await createMemberships(users, communities);
  const leagues = await createLeagues(communities);
  await clearDemoRaceActivityOnly();
  const slots = await createRaceSlots(users, leagues);
  await createDisputes(users, users[0]);

  const completedResults = await prisma.raceResult.count({ where: { raceSlot: { league: { slug: { in: communitySeeds.map(([slug]) => `${slug}-demo-league`) } } } } });
  console.log('Demo seed complete ✅');
  console.log(`Demo users: ${users.length}`);
  console.log(`Demo communities: ${communities.length}`);
  console.log(`Demo race slots: ${slots.length}`);
  console.log(`Demo completed results: ${completedResults}`);
  console.log(`Demo records are identifiable by ${DEMO_EMAIL_DOMAIN} emails, known demo community slugs, demo league slugs, and demo race metadata.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
