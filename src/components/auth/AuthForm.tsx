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
    <form onSubmit={onSubmit} className="panel mx-auto w-full max-w-xl rounded-2xl p-6 md:p-8">
      <h1 className="font-display text-3xl text-white">{mode === 'login' ? 'Welcome back' : 'Create your RaceHub account'}</h1>
      <p className="mt-2 text-sm text-slate-300">{mode === 'login' ? 'Sign in to manage your community ranks, races, and reputation.' : 'Join communities, track SR, and build a clean racing reputation.'}</p>

      <div className="mt-6 space-y-3">
        <a
          href="/api/auth/google"
          className="rh-btn h-12 w-full border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 transition hover:bg-slate-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.29h6.45a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.56-5.18 3.56-8.67Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.31v3.12A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.32 14.31A7.22 7.22 0 0 1 4.94 12c0-.8.14-1.57.38-2.31V6.57H1.31A12 12 0 0 0 0 12c0 1.94.46 3.78 1.31 5.43l4.01-3.12Z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.31 6.57l4.01 3.12c.94-2.82 3.57-4.92 6.68-4.92Z" />
          </svg>
          <span>Continue with Google</span>
        </a>
        <a
          href="/api/auth/discord"
          className="rh-btn h-12 w-full bg-[#5865F2] px-4 text-base font-medium text-white transition hover:bg-[#4d59d9]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor">
            <path d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.84a13.78 13.78 0 0 0-.63 1.31 18.27 18.27 0 0 0-5.46 0 13.78 13.78 0 0 0-.64-1.31 19.74 19.74 0 0 0-4.96 1.54C.54 9.05-.31 13.61.11 18.11a19.9 19.9 0 0 0 6.08 3.06 14.6 14.6 0 0 0 1.3-2.1 12.93 12.93 0 0 1-2.05-.98c.17-.13.34-.26.5-.39a14.2 14.2 0 0 0 12.12 0c.17.14.33.27.5.39a12.95 12.95 0 0 1-2.06.98 14.6 14.6 0 0 0 1.3 2.1 19.86 19.86 0 0 0 6.09-3.06c.5-5.22-.84-9.73-3.57-13.74ZM8.02 15.35c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.41 0 1.32-.95 2.4-2.15 2.4Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.41 0 1.32-.95 2.4-2.15 2.4Z" />
          </svg>
          <span>Continue with Discord</span>
        </a>
      </div>

      <div className="my-6 text-center text-xs uppercase tracking-[0.2em] text-slate-400">or continue with email</div>

      <div className="space-y-4">
        {mode === 'register' && <label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Username</span><input required name="username" minLength={3} className="rh-input" /></label>}
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Email</span><input required type="email" name="email" className="rh-input" /></label>
        <label className="block"><div className="mb-1 flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-[0.2em] text-slate-400">Password</span>{mode === 'login' && <a href="/forgot-password" className="shrink-0 text-xs text-slate-200 hover:text-white">Forgot password?</a>}</div><input required type="password" name="password" minLength={8} className="rh-input" /></label>
        {mode === 'register' && <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Region</span><select name="region" className="rh-select"><option value="">Select region</option>{['EU','NA','SA','APAC','MENA','GLOBAL'].map((region)=><option key={region} value={region}>{region}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Platform</span><select name="preferredPlatform" className="rh-select"><option value="">Preferred platform</option>{['PC','PLAYSTATION','XBOX'].map((platform)=><option key={platform} value={platform}>{platform}</option>)}</select></label></div>}
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
      <button disabled={loading} className="rh-btn rh-btn-primary mt-6 w-full">{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <p className="mt-4 text-center text-sm text-slate-400">{mode === 'login' ? <>Need an account? <a className="text-white" href="/register">Create one</a></> : <>Already have an account? <a className="text-white" href="/login">Sign in</a></>}</p>
    </form>
  );
}
