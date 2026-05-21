import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';
import { getHonourGrade } from '@/lib/honour';

type TabKey = 'overview' | 'duels' | 'rivals' | 'communities' | 'match-history' | 'honour';

interface OverviewData {
  stats: {
    skillRating: number | null;
    honourScore: number | null;
    starts: number;
    wins: number;
    cleanRaceRatio: number;
    rank: number | null;
    regionalRank: number | null;
    region: string;
    completedRaces: number;
    winRate: number;
    points: number;
  };
  recentResults: Array<{ id: string; finishingPosition: number; ratingDelta: number; raceResult: { submittedAt: string; raceSlot: { title: string; track?: string | null; league: { name: string } } } }>;
  upcomingRegistrations: Array<{ id: string; raceSlot: { id: string; title: string; track?: string | null; scheduledAt: string; league: { name: string } } }>;
  community: { owned: null | { displayName: string; slug: string; verified: boolean; displayedMemberCount: number }; membershipCount: number };
}

const tabs: Array<{ key: TabKey; label: string; hash: string }> = [
  { key: 'overview', label: 'Overview', hash: '#overview' },
  { key: 'duels', label: 'Duels', hash: '#duels' },
  { key: 'rivals', label: 'Rivals', hash: '#rivals' },
  { key: 'communities', label: 'Communities', hash: '#communities' },
  { key: 'match-history', label: 'Match History', hash: '#match-history' },
  { key: 'honour', label: 'Honour', hash: '#honour' },
];

export default function ProfileOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    const next = window.location.hash.replace('#', '') as TabKey;
    if (tabs.some((tab) => tab.key === next)) setActiveTab(next);
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabKey;
      if (tabs.some((tab) => tab.key === hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    apiRequest<OverviewData>('/api/profile/overview').then(setOverview).catch(() => setOverview(null));
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const losses = useMemo(() => {
    if (!overview) return null;
    return Math.max(0, overview.stats.starts - overview.stats.wins);
  }, [overview]);

  const openTab = (key: TabKey) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `#${key}`);
  };

  const duels = overview?.recentResults ?? [];

  return <div className="rh-grid" aria-live="polite">
    <aside className="rh-sidebar">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => openTab(tab.key)} className={`item ${activeTab === tab.key ? 'active' : ''}`}>{tab.label}</button>)}<a className="item" href="/profile/edit">Settings</a></aside>
    <main>
      <section className="top" id={activeTab}>
        <div>
          <h2>{overview ? `#${overview.stats.rank ?? '—'} Driver` : 'Driver Profile'}</h2>
          <p className="tag">Region: {overview?.stats.region ?? '—'} · Regional Rank: {overview?.stats.regionalRank ?? '—'}</p>
          <p className="team">{overview?.community.owned?.displayName ?? 'Independent Driver'}</p>
          <div className="xp"><div style={{ width: `${Math.min(100, Math.max(0, overview?.stats.winRate ?? 0))}%` }} /></div>
          <small>Progress {overview ? `${overview.stats.points} pts` : 'No progression data yet'}</small>
        </div>
        <div className="badges">{[['Duel Rating', overview?.stats.skillRating ?? '—', 'tier-gold'], ['Honour', overview?.stats.honourScore == null ? '—' : getHonourGrade(overview.stats.honourScore).label, 'tier-silver'], ['Clean Racing', overview?.stats.cleanRaceRatio == null ? '—' : `${overview.stats.cleanRaceRatio}%`, 'tier-elite']].map(([label, value, tier]) => <article key={String(label)} className="badgeCard"><div className={`badge ${tier}`} /><b>{value}</b><span>{label}</span></article>)}</div>
      </section>

      {activeTab === 'overview' && <section className="cols"><article className="card"><h3>This Week</h3><p>{duels.length ? `Recent duels: ${duels.length}` : 'No weekly duel data yet'}</p><a href="#duels" onClick={(e) => { e.preventDefault(); openTab('duels'); }}>Open Duels</a></article><article className="card"><h3>Overall</h3><p>Total duels {overview?.stats.starts ?? '—'} · Wins {overview?.stats.wins ?? '—'} · Losses {losses ?? '—'}</p><p>Win rate {overview?.stats.winRate ?? '—'}%</p><a href="#rivals" onClick={(e) => { e.preventDefault(); openTab('rivals'); }}>Open Rivals</a></article></section>}

      {activeTab === 'duels' && <section className="card"><h3>Duels</h3>{duels.length ? duels.map((d) => <div key={d.id} className="leader-row"><div>{d.finishingPosition === 1 ? 'WIN' : 'LOSS'}</div><div>{d.raceResult.raceSlot.title}<small>{d.raceResult.raceSlot.league.name} · {d.raceResult.raceSlot.track ?? 'Track TBD'}</small></div><div>{d.ratingDelta > 0 ? '+' : ''}{d.ratingDelta}</div><div>{new Date(d.raceResult.submittedAt).toLocaleDateString()}</div></div>) : <p>No duels completed yet. <a href="/duels">Create or join a duel</a>.</p>}</section>}

      {activeTab === 'rivals' && <section className="card"><h3>Rivals</h3><p>Rivalries will appear after you race the same drivers multiple times.</p><a href="/duels/new">Run it back</a></section>}

      {activeTab === 'communities' && <section className="card"><h3>Communities</h3>{overview?.community.owned ? <div><p>{overview.community.owned.displayName}</p><p>{overview.community.owned.displayedMemberCount} members</p><a href={`/communities/${overview.community.owned.slug}`}>View community</a></div> : <p>No communities yet.</p>}<p>Active memberships: {overview?.community.membershipCount ?? 0}</p></section>}

      {activeTab === 'match-history' && <section className="card"><h3>Match History</h3>{duels.length ? duels.map((d) => <div key={`m-${d.id}`} className="leader-row"><div>#{d.finishingPosition}</div><div>{d.raceResult.raceSlot.title}</div><div>{d.ratingDelta > 0 ? '+' : ''}{d.ratingDelta}</div><div>{new Date(d.raceResult.submittedAt).toLocaleString()}</div></div>) : <p>No match history yet.</p>}</section>}

      {activeTab === 'honour' && <section className="card"><h3>Honour</h3><p>Honour reflects reliability and trust: completion rate, no-shows, forfeits, confirmed disputes, and organiser trust.</p><p>Honour score: {overview?.stats.honourScore ?? '—'}</p><p>Completion rate: {overview?.stats.starts ? `${Math.round((overview.stats.completedRaces / overview.stats.starts) * 100)}%` : 'No races yet'}</p><p>No-show rate: Data not currently exposed in profile API.</p><p>Confirmed disputes: Data not currently exposed in profile API.</p></section>}
    </main>
  </div>;
}
