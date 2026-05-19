import { useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type Mode = 'login' | 'register';
interface Props { mode: Mode }

export default function AuthForm({ mode }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      if (mode === 'login') {
        await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: payload.email, password: payload.password }) });
      } else {
        await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username: payload.username, email: payload.email, password: payload.password, region: payload.region || undefined, preferredPlatform: payload.preferredPlatform || undefined }),
        });
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={onSubmit} className="panel mx-auto w-full max-w-xl rounded-3xl p-6 md:p-8">
      <h1 className="font-display text-3xl text-white">{mode === 'login' ? 'Welcome back' : 'Create your RaceHub account'}</h1>
      <p className="mt-2 text-sm text-slate-300">{mode === 'login' ? 'Sign in to manage your grid commitments.' : 'Join verified race slots and live leaderboards.'}</p>

      <div className="mt-6 space-y-3">
        <a href="/api/auth/google" className="block w-full rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-center font-medium text-white hover:bg-white/10">Continue with Google</a>
        <a href="/api/auth/discord" className="block w-full rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-center font-medium text-white hover:bg-white/10">Continue with Discord</a>
      </div>

      <div className="my-6 text-center text-xs uppercase tracking-[0.2em] text-slate-400">or continue with email</div>

      <div className="space-y-4">
        {mode === 'register' && <label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Username</span><input required name="username" minLength={3} className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none ring-redline/40 focus:ring" /></label>}
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Email</span><input required type="email" name="email" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none ring-redline/40 focus:ring" /></label>
        <label className="block"><div className="mb-1 flex items-center justify-between"><span className="text-xs uppercase tracking-[0.2em] text-slate-400">Password</span>{mode === 'login' && <a href="/forgot-password" className="text-xs text-slate-200 hover:text-white">Forgot password?</a>}</div><input required type="password" name="password" minLength={8} className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none ring-redline/40 focus:ring" /></label>
        {mode === 'register' && <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Region</span><select name="region" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none ring-redline/40 focus:ring"><option value="">Select region</option>{['EU','NA','SA','APAC','MENA','GLOBAL'].map((region)=><option key={region} value={region}>{region}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Platform</span><select name="preferredPlatform" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white outline-none ring-redline/40 focus:ring"><option value="">Preferred platform</option>{['PC','PLAYSTATION','XBOX'].map((platform)=><option key={platform} value={platform}>{platform}</option>)}</select></label></div>}
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-slate-100 disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <p className="mt-4 text-center text-sm text-slate-400">{mode === 'login' ? <>Need an account? <a className="text-white" href="/register">Create one</a></> : <>Already have an account? <a className="text-white" href="/login">Sign in</a></>}</p>
    </form>
  );
}
