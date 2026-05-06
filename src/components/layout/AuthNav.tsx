import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/http';
import type { UserRole } from '@/lib/api/types';

interface NavUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  role: UserRole;
}

interface Props {
  user?: NavUser | null;
  authStateKnown?: boolean;
}

type AuthState = 'checking' | 'authenticated' | 'anonymous';

const AUTH_CACHE_KEY = 'racehub.navUser.v1';
let memoryAuthUser: NavUser | null | undefined;
let inFlightAuthRequest: Promise<NavUser | null> | null = null;

const readStoredUser = (): NavUser | null | undefined => {
  if (memoryAuthUser !== undefined) return memoryAuthUser;
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = window.sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { user?: NavUser | null };
    memoryAuthUser = parsed.user ?? null;
    return memoryAuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    return undefined;
  }
};

const writeStoredUser = (nextUser: NavUser | null) => {
  memoryAuthUser = nextUser;
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user: nextUser }));
  } catch {
    // Storage can be unavailable in restricted browser contexts; memory cache still helps this page.
  }
};

const clearStoredUser = () => {
  memoryAuthUser = null;
  inFlightAuthRequest = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(AUTH_CACHE_KEY);
  }
};

const fetchAuthUser = () => {
  if (!inFlightAuthRequest) {
    inFlightAuthRequest = apiRequest<{ user: NavUser | null }>('/api/auth/me')
      .then((payload) => payload.user ?? null)
      .finally(() => {
        inFlightAuthRequest = null;
      });
  }

  return inFlightAuthRequest;
};

export default function AuthNav({ user, authStateKnown = false }: Props) {
  const [resolvedUser, setResolvedUser] = useState<NavUser | null>(() => {
    if (user) return user;
    if (authStateKnown) return null;
    return readStoredUser() ?? null;
  });
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (user) return 'authenticated';
    if (authStateKnown) return 'anonymous';
    const cachedUser = readStoredUser();
    if (cachedUser) return 'authenticated';
    if (cachedUser === null) return 'anonymous';
    return 'checking';
  });

  useEffect(() => {
    if (user) {
      writeStoredUser(user);
      setResolvedUser(user);
      setAuthState('authenticated');
      return;
    }

    if (authStateKnown) {
      writeStoredUser(null);
      setResolvedUser(null);
      setAuthState('anonymous');
      return;
    }

    let cancelled = false;
    const cachedUser = readStoredUser();
    if (cachedUser !== undefined) {
      setResolvedUser(cachedUser);
      setAuthState(cachedUser ? 'authenticated' : 'anonymous');
    } else {
      setAuthState('checking');
    }

    fetchAuthUser()
      .then((nextUser) => {
        writeStoredUser(nextUser);
        if (!cancelled) {
          setResolvedUser(nextUser);
          setAuthState(nextUser ? 'authenticated' : 'anonymous');
        }
      })
      .catch(() => {
        writeStoredUser(null);
        if (!cancelled) {
          setResolvedUser(null);
          setAuthState('anonymous');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authStateKnown, user]);

  const logout = async () => {
    clearStoredUser();
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (authState === 'checking') {
    return (
      <div className="flex min-w-[260px] items-center justify-end gap-3" aria-label="Checking account status">
        <div className="h-9 w-24 rounded-full border border-white/10 bg-white/[0.06]" />
        <div className="h-10 w-32 rounded-full border border-white/10 bg-white/[0.08]" />
      </div>
    );
  }

  if (!resolvedUser) {
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
      {resolvedUser.role === 'ADMIN' && (
        <a href="/admin" className="hidden rounded-full border border-rose-300/40 bg-rose-500/15 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/25 md:inline-flex">
          Admin
        </a>
      )}
      <a href="/profile" className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-slate-100 transition hover:border-white/40 hover:bg-white/10 md:inline-flex">
        <img src={resolvedUser.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${resolvedUser.username}`} alt={`${resolvedUser.username} avatar`} className="h-7 w-7 rounded-lg border border-white/10 object-cover" />
        <span>{resolvedUser.username}</span>
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
