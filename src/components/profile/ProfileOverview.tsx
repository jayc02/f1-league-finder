import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/http';
import { getHonourGrade } from '@/lib/honour';

interface OverviewData { stats: any; recentResults: any[]; community: any; }

export default function ProfileOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  useEffect(() => { apiRequest<OverviewData>('/api/profile/overview').then(setOverview).catch(() => setOverview({ stats: {}, recentResults: [], community: {} } as any)); }, []);
  const s = overview?.stats;
  const winRate = s?.winRate ?? 0;
  return <div className="rh-grid" aria-live="polite">
    <aside className="rh-sidebar">{['Overview','Duels','Rivals','Communities','Match History','Honour'].map((i,idx)=><a key={i} className={`item ${idx===0?'active':''}`}>{i}</a>)}</aside>
    <main>
      <header className="top">
        <div><h2>{s?.username ?? 'Driver'}</h2><p className="tag">#RH1042</p><p className="team">{overview?.community?.owned?.displayName ?? 'INDEPENDENT DRIVER'}</p><div className="xp"><div style={{width:`${Math.max(12,Math.min(100,winRate))}%`}}/></div><small>XP 900 / 1,800</small></div>
        <div className="badges">{[['Duel Rating',s?.skillRating ?? '—','tier-gold'],['Honour',getHonourGrade(s?.honourScore ?? 0).label,'tier-silver'],['Clean Racing',`${s?.cleanRaceRatio ?? 0}%`,'tier-elite']].map(([l,v,c])=><article className="badgeCard"><div className={`badge ${c}`}/><b>{v as any}</b><span>{l as any}</span></article>)}</div>
      </header>
      <section className="cols"><article className="card"><h3>This Week</h3><p>{overview?.recentResults?.length ? 'Ranked Duels' : 'No weekly duel data yet'}</p></article><article className="card"><h3>Overall</h3><p>Total duels {s?.starts ?? 0} · Win rate {winRate}% · Completion {(s?.completedRaces ?? 0)}</p></article></section>
    </main>
  </div>;
}
