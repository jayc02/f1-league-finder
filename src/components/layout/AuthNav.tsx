import type { SessionUser } from '@/lib/api/types';
import { apiRequest } from '@/lib/api/http';

interface Props {
  user: SessionUser | null;
}

export default function AuthNav({ user }: Props) {
  const logout = async () => {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a href="/login" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10">
          Sign in
        </a>
        <a href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-200">
          Create account
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/dashboard" className="hidden rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10 md:inline-flex">
        Dashboard
      </a>
      <div className="hidden text-right md:block">
        <p className="text-sm font-semibold text-white">{user.username}</p>
        <p className="text-xs text-slate-400">{user.role} · {user.skillRating} SR</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/20"
      >
        Logout
      </button>
    </div>
  );
}
