import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type BidData = { currentHighestBid: { id: string; amountTokens: number; userId: string } | null; currentLeader: { id: string; username: string } | null; tokenPot: number; bidClosesAt: string | null; serverNow: string; increments: { small: number; medium: number; big: number }; userBid: { amountTokens: number } | null; userBalance: { available: number; held: number } | null; recentBids: Array<{ id: string; amountTokens: number; user: { username: string } }>; canBid: boolean; reason: string | null };

const fmt=(n:number)=>new Intl.NumberFormat().format(n);
export default function DuelBidPanel({ duelId, isCreator, duelStatus, tokenPotStatus }: { duelId: string; isCreator: boolean; duelStatus: string; tokenPotStatus?: string | null }) {
  const [data,setData]=useState<BidData|null>(null);const [msg,setMsg]=useState('');const [newPulse,setNewPulse]=useState(false);const [open,setOpen]=useState(false);
  const load=async()=>{const next=await apiRequest<BidData>(`/api/duels/${duelId}/bids`);setData((prev)=>{if(prev?.currentHighestBid?.id!==next.currentHighestBid?.id&&prev) setNewPulse(true);return next;});};
  useEffect(()=>{void load();const t=setInterval(()=>{if(['COMPLETED','CANCELLED','EXPIRED'].includes(duelStatus)) return; void load();},3000);return()=>clearInterval(t);},[duelId,duelStatus]);
  useEffect(()=>{if(!newPulse)return;const t=setTimeout(()=>setNewPulse(false),1200);return()=>clearTimeout(t);},[newPulse]);
  const leaderState=useMemo(()=>{if(!data?.userBid||!data.currentHighestBid) return 'idle';return data.currentHighestBid.amountTokens===data.userBid.amountTokens?'leading':'outbid';},[data]);
  const place=async(inc:number)=>{if(!data)return;setMsg('');try{await apiRequest(`/api/duels/${duelId}/bids`,{method:'POST',body:JSON.stringify({amountTokens:(data.currentHighestBid?.amountTokens??0)+inc})});setMsg('Bid placed.');void load();sessionStorage.setItem('racehub.tokens.refresh','1');}catch(e){setMsg(e instanceof Error?e.message:'Could not place bid.');}};
  const close=async()=>{try{await apiRequest(`/api/duels/${duelId}/bids/close`,{method:'POST'});setMsg('Seat locked.');void load();}catch(e){setMsg(e instanceof Error?e.message:'Could not lock seat.');}};
  if(!data)return <aside className='panel rounded-3xl p-4'>Loading bid panel…</aside>;
  const timeLeft = data.bidClosesAt ? Math.max(0, Math.floor((new Date(data.bidClosesAt).getTime()-Date.now())/1000)) : 0;
  const closed = timeLeft<=0;
  return <>
  <aside className='panel hidden rounded-3xl p-5 lg:block'>
    <h3 className='font-display text-2xl'>Bid for challenger slot</h3>
    <p className='mt-3 text-4xl font-black text-cyan-100'>{fmt(data.currentHighestBid?.amountTokens ?? 0)} Tokens</p>
    <p className='text-sm text-slate-300'>Token pot: <span className='text-white'>{fmt(data.tokenPot)} Tokens</span></p>
    <p className={`mt-2 text-xs ${newPulse?'text-emerald-300':'text-slate-400'}`}>{newPulse?'New bid just landed':'Live updates every 3s'}</p>
    <div className='mt-4 grid grid-cols-2 gap-2 text-sm'><div className='rounded-xl bg-white/5 p-3'>Leader<br/><b>{data.currentLeader?.username??'No bids yet'}</b></div><div className='rounded-xl bg-white/5 p-3'>Time left<br/><b>{Math.floor(timeLeft/60)}m {timeLeft%60}s</b></div><div className='rounded-xl bg-white/5 p-3'>Your balance<br/><b>{fmt(data.userBalance?.available ?? 0)}</b></div><div className='rounded-xl bg-white/5 p-3'>Your bid<br/><b>{fmt(data.userBid?.amountTokens ?? 0)}</b></div></div>
    {tokenPotStatus && <p className='mt-3 rounded-xl border border-white/10 bg-white/5 p-2 text-xs'>Token pot status: {tokenPotStatus === 'HOLDING' ? 'Token pot held until both drivers confirm.' : tokenPotStatus === 'DISPUTED' ? 'Token pot held pending admin review.' : tokenPotStatus === 'AWARDED' ? 'Token pot awarded.' : 'Token pot refunded.'}</p>}
    <div className='mt-4 grid grid-cols-3 gap-2'>{[data.increments.small,data.increments.medium,data.increments.big].map((inc,i)=><button disabled={isCreator||closed} onClick={()=>void place(inc)} className='rounded-xl bg-cyan-400/20 px-2 py-2 text-xs'>{i===0?'Nudge':i===1?'Raise':'Send it'} +{inc}</button>)}</div>
    {closed ? <button onClick={()=>void close()} className='mt-3 w-full rounded-xl bg-cyan-300 px-4 py-3 font-bold text-black'>Lock seat</button> : null}
    {leaderState==='leading'&&<p className='mt-3 rounded-xl border border-emerald-300/40 bg-emerald-500/15 p-2 text-sm text-emerald-100'>You are leading.</p>}
    {leaderState==='outbid'&&<p className='mt-3 rounded-xl border border-amber-300/40 bg-amber-500/15 p-2 text-sm text-amber-100'>You have been outbid.</p>}
    {msg&&<p className='mt-3 text-sm text-slate-200'>{msg}</p>}
    <div className='mt-4 space-y-1 text-sm'>{(data.recentBids.slice(0,8)).map((b)=><p key={b.id} className='text-slate-300'>{b.user.username} raised to {fmt(b.amountTokens)} Tokens</p>)}</div>
  </aside>
  <div className='fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/80 p-3 backdrop-blur-xl mobile-safe-bottom lg:hidden'>
    <button onClick={()=>setOpen((v)=>!v)} className='flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm'><span>{fmt(data.currentHighestBid?.amountTokens??0)} Tokens · {Math.floor(timeLeft/60)}m {timeLeft%60}s</span><span>Bid</span></button>
    {open && <div className='mt-2 rounded-2xl bg-white/5 p-3'><p className='text-xs text-slate-300'>Pot {fmt(data.tokenPot)} · Leader {data.currentLeader?.username??'—'}</p><div className='mt-2 grid grid-cols-3 gap-2'>{[data.increments.small,data.increments.medium,data.increments.big].map((inc)=><button onClick={()=>void place(inc)} className='rounded-xl bg-cyan-400/20 py-2 text-xs'>+{inc}</button>)}</div><p className='mt-2 text-xs text-slate-300'>Balance {fmt(data.userBalance?.available??0)}</p></div>}
  </div></>;
}
