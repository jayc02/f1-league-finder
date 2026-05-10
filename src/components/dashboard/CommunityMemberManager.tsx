import { useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type CommunityRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
type CommunityStatus = 'ACTIVE' | 'INVITED' | 'BANNED';

interface MemberRow {
  id: string;
  role: CommunityRole;
  status: CommunityStatus;
  user: { id: string; username: string; email?: string | null; avatarUrl?: string | null; role: string };
}

interface Props {
  organiserProfileId: string;
  actorRole: CommunityRole;
  members: MemberRow[];
}

export default function CommunityMemberManager({ organiserProfileId, actorRole, members: initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState('');

  const canPromoteAdmins = actorRole === 'OWNER';
  const canChangeRoles = actorRole === 'OWNER' || actorRole === 'ADMIN';

  const updateMember = async (memberId: string, patch: { role?: 'ADMIN' | 'MODERATOR' | 'MEMBER'; status?: 'ACTIVE' | 'BANNED' }) => {
    setMessage('');
    try {
      const response = await apiRequest<{ member: MemberRow }>('/api/organiser/community/members', {
        method: 'PATCH',
        body: JSON.stringify({ organiserProfileId, memberId, ...patch }),
      });
      setMembers((rows) => rows.map((row) => (row.id === memberId ? response.member : row)));
      setMessage('Member updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update member.');
    }
  };

  const removeMember = async (memberId: string) => {
    setMessage('');
    try {
      await apiRequest('/api/organiser/community/members', {
        method: 'DELETE',
        body: JSON.stringify({ organiserProfileId, memberId }),
      });
      setMembers((rows) => rows.filter((row) => row.id !== memberId));
      setMessage('Member removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove member.');
    }
  };

  return (
    <div className="space-y-3">
      {message && <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">{message}</p>}
      {members.length ? members.map((member) => {
        const isOwner = member.role === 'OWNER';
        const roleLocked = isOwner || !canChangeRoles;
        return (
          <div key={member.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <img src={member.user.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${member.user.username}`} alt={`${member.user.username} avatar`} className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
                <div>
                  <p className="font-semibold text-white">{member.user.username}</p>
                  <p className="text-xs text-slate-500">Platform {member.user.role} · Community {member.role} · {member.status}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select disabled={roleLocked} value={member.role === 'OWNER' ? 'MEMBER' : member.role} onChange={(event) => updateMember(member.id, { role: event.target.value as 'ADMIN' | 'MODERATOR' | 'MEMBER' })} className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs disabled:opacity-50">
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  {canPromoteAdmins && <option value="ADMIN">Admin</option>}
                </select>
                <button type="button" disabled={isOwner} onClick={() => updateMember(member.id, { status: member.status === 'BANNED' ? 'ACTIVE' : 'BANNED' })} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-50">{member.status === 'BANNED' ? 'Unban' : 'Ban'}</button>
                <button type="button" disabled={isOwner} onClick={() => removeMember(member.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 disabled:opacity-50">Remove</button>
              </div>
            </div>
          </div>
        );
      }) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-300">No RaceHub members yet.</p>}
    </div>
  );
}
