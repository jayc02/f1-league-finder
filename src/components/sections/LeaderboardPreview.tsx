import { useMemo, useState } from 'react';
import type { PublicUser } from '@/server/types/api';
import { getHonourGrade } from '@/lib/honour';

type Tab = 'global' | 'honour';

const tabs: { key: Tab; label: string }[] = [
  { key: 'global', label: '1v1 Skill' },
  { key: 'honour', label: 'Honour' },
];

interface Props {
  globalLeaderboard: PublicUser[];
  honourLeaderboard: PublicUser[];
}

export default function LeaderboardPreview({ globalLeaderboard, honourLeaderboard }: Props) {
  const [tab, setTab] = useState<Tab>('global');
  const rows = useMemo(
    () => (tab === 'global' ? globalLeaderboard : honourLeaderboard),
    [tab, globalLeaderboard, honourLeaderboard],
  );

  return (
    <section id="leaderboards" className="section-shell" data-reveal>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">1v1 rankings</p>
      <h2 className="section-title mt-3">Every confirmed result moves the ladder.</h2>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-full px-5 py-2 text-sm transition ${item.key === tab ? 'bg-white text-black' : 'border border-white/20 text-slate-300 hover:bg-white/10'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="panel mt-6 overflow-hidden rounded-3xl">
        {rows.length ? (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Rank</th><th className="text-left">Driver</th><th className="text-left">Rating</th><th className="text-left">Honour</th><th className="text-left">Region</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-white/10 transition hover:bg-white/5">
                  <td className="px-5 py-4 font-display text-xl text-white">{index + 1}</td>
                  <td>{row.username}</td>
                  <td>{row.skillRating.toLocaleString()}</td>
                  <td><span className={`rh-badge rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getHonourGrade(row.honourScore).tone}`}>{getHonourGrade(row.honourScore).grade}</span></td>
                  <td>{row.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-6 py-10 text-slate-300">Leaderboard data is loading in as races complete.</p>
        )}
      </div>
    </section>
  );
}
