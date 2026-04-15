export const raceSlots = [
  {
    event: 'Bahrain Night Sprint',
    startsAt: '2026-04-11T20:30:00Z',
    platform: 'Crossplay',
    region: 'EU-West',
    assists: 'Restricted',
    tier: 'Apex Tier'
  },
  {
    event: 'Imola Precision Cup',
    startsAt: '2026-04-12T18:00:00Z',
    platform: 'PC / Console',
    region: 'NA-East',
    assists: 'No Line',
    tier: 'Elite Tier'
  },
  {
    event: 'Suzuka Endurance Grid',
    startsAt: '2026-04-13T19:30:00Z',
    platform: 'Crossplay',
    region: 'APAC',
    assists: 'Simulation',
    tier: 'Pro Tier'
  }
];

export const leaderboardData = {
  global: [
    { rank: 1, name: 'L. Marchetti', points: 2461, move: '+2', honour: 97 },
    { rank: 2, name: 'S. Ortega', points: 2424, move: '—', honour: 96 },
    { rank: 3, name: 'J. Haldane', points: 2368, move: '-1', honour: 92 },
    { rank: 4, name: 'A. Morrow', points: 2310, move: '+4', honour: 99 }
  ],
  clean: [
    { rank: 1, name: 'R. Vann', points: 1988, move: '+1', honour: 100 },
    { rank: 2, name: 'D. Carlsen', points: 1932, move: '+1', honour: 99 },
    { rank: 3, name: 'Y. Faber', points: 1904, move: '-2', honour: 98 },
    { rank: 4, name: 'M. Rossi', points: 1840, move: '+3', honour: 98 }
  ],
  organisers: [
    { rank: 1, name: 'RaceControl One', points: 878, move: '+1', honour: 98 },
    { rank: 2, name: 'Steward Collective', points: 860, move: '—', honour: 97 },
    { rank: 3, name: 'Grid Authority', points: 844, move: '+2', honour: 95 },
    { rank: 4, name: 'Grand Prix Office', points: 810, move: '-1', honour: 96 }
  ],
  weekly: [
    { rank: 1, name: 'N. Takeda', points: 188, move: '+12', honour: 95 },
    { rank: 2, name: 'K. Linden', points: 172, move: '+9', honour: 92 },
    { rank: 3, name: 'P. Duarte', points: 167, move: '+8', honour: 96 },
    { rank: 4, name: 'V. Sato', points: 159, move: '+7', honour: 94 }
  ]
};

export const features = [
  'Scheduled race slots',
  'Lobby standardisation',
  'Stewarding records',
  'Honour rating',
  'Global leaderboards',
  'Organiser toolset',
  'Crossplay-ready flow'
];
