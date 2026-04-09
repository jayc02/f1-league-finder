import { useMemo, useState } from 'react';
import { leaderboardData } from '@/data/site';

type Tab = keyof typeof leaderboardData;

const tabs: { key: Tab; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'clean', label: 'Clean Drivers' },
  { key: 'organisers', label: 'Top Organisers' },
  { key: 'weekly', label: 'Weekly Movers' }
];

export default function LeaderboardPreview() {
  const [tab, setTab] = useState<Tab>('global');
  const rows = useMemo(() => leaderboardData[tab], [tab]);

  return (
    <section id="leaderboards" className="section-shell" data-reveal>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Leaderboards</p>
      <h2 className="section-title mt-3">Competition visibility, with conduct in plain sight.</h2>
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
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-5 py-3 text-left">Rank</th><th className="text-left">Name</th><th className="text-left">Points</th><th className="text-left">Move</th><th className="text-left">Honour</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-white/10 transition hover:bg-white/5">
                <td className="px-5 py-4 font-display text-xl text-white">{row.rank}</td>
                <td>{row.name}</td>
                <td>{row.points.toLocaleString()}</td>
                <td className={row.move.startsWith('+') ? 'text-emerald-300' : row.move.startsWith('-') ? 'text-rose-300' : 'text-slate-300'}>{row.move}</td>
                <td>
                  <div className="h-2 w-24 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-slate-300 to-white" style={{ width: `${row.honour}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
