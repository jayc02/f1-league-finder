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
        <a href="/login" className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20">
          Sign in
        </a>
        <a href="/register" className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_rgba(219,233,255,0.22)] transition hover:bg-white">
          Create account
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/dashboard" className="hidden rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20 md:inline-flex">
        Dashboard
      </a>
      {user.role === 'ADMIN' && (
        <a href="/admin" className="hidden rounded-full border border-rose-300/40 bg-rose-500/15 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/25 md:inline-flex">
          Admin
        </a>
      )}
      <a href="/profile" className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-slate-100 transition hover:border-white/40 hover:bg-white/10 md:inline-flex">
        <img src={user.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`} alt={`${user.username} avatar`} className="h-7 w-7 rounded-lg border border-white/10 object-cover" />
        <span>{user.username}</span>
      </a>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-red-200/35 bg-red-500/15 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/25"
      >
        Logout
      </button>
    </div>
  );
}
