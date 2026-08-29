import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { resolveAvatarSrc } from '@/lib/cleoAvatars';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
  role: string;
}

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleCrown: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.2 17.4c.2-3.5.1-6.9-.3-10.3 2 1.6 3.9 3.2 5.8 4.9 1-1.9 2-3.7 3.1-5.5 1 1.9 2 3.7 3.1 5.6 1.8-1.7 3.7-3.3 5.7-4.8-.4 3.4-.5 6.8-.3 10.2-5.7.5-11.4.5-17.1-.1z" />
  </svg>
);

const DoodleShield: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M12 3.4c2.4 1.3 4.9 2 7.5 2.2.3 5.9-2.2 10.6-7.4 14.1C6.7 16.3 4.2 11.6 4.6 5.6 7.2 5.4 9.7 4.7 12 3.4z" />
  </svg>
);

const DoodlePeople: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M9.4 4.4c2.2-.2 3.8 1.3 3.7 3.3-.1 1.9-1.6 3.2-3.6 3.1-2-.1-3.3-1.5-3.2-3.4.1-1.8 1.4-2.9 3.1-3z" />
    <path d="M3.6 19.3c.3-3.3 2.7-5.2 6-5.2 3.2 0 5.5 1.9 5.8 5.2-3.9.4-7.9.4-11.8 0z" />
    <path d="M16.3 6.1c1.9-.3 3.4 1 3.3 2.8-.1 1.6-1.3 2.6-2.9 2.5" />
    <path d="M17.6 14.4c1.9.4 3 1.8 3.1 3.9" />
  </svg>
);

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const AdminList: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'owner']);

      if (rolesError) throw rolesError;

      if (!userRolesData || userRolesData.length === 0) {
        setAdmins([]);
        return;
      }

      const userIds = userRolesData.map((item) => item.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, job_title')
        .in('id', userIds);

      const adminList = userRolesData.map((roleItem) => {
        const profile = profilesData?.find((p) => p.id === roleItem.user_id) as any;

        return {
          id: roleItem.user_id,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url ?? null,
          job_title: profile?.job_title ?? null,
          role: roleItem.role,
        };
      });

      adminList.sort(
        (a, b) =>
          (a.role === 'owner' ? 0 : 1) - (b.role === 'owner' ? 0 : 1) ||
          (a.first_name || '').localeCompare(b.first_name || '', undefined, {
            sensitivity: 'base',
          }) ||
          (a.last_name || '').localeCompare(b.last_name || '', undefined, {
            sensitivity: 'base',
          })
      );

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-foreground">
          <DoodlePeople className="h-5 w-5" />
        </span>
        <h2 className="font-heading text-xl font-extrabold text-foreground">
          Current Administrative Staff
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-foreground/10" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
          <DoodlePeople className="h-10 w-10 text-foreground/70" />
          <p className="text-sm text-muted-foreground">No administrative staff found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {admins.map((admin, i) => {
            const avatarSrc = resolveAvatarSrc(admin.avatar_url);
            const isOwner = admin.role === 'owner';
            const name =
              admin.first_name || admin.last_name
                ? `${admin.first_name} ${admin.last_name}`.trim()
                : 'Unnamed';

            return (
              <div
                key={admin.id}
                className="flex flex-col gap-3 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 transition-colors duration-200 hover:bg-pastel-sky/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-foreground',
                      avatarTones[i % avatarTones.length]
                    )}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={`${name} profile icon`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(admin.first_name, admin.last_name)
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {admin.job_title || roleLabel(admin.role)}
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex w-fit items-center gap-1.5 self-start rounded-full border-2 border-foreground px-3 py-1 text-xs font-semibold text-foreground sm:self-auto',
                    isOwner ? 'bg-pastel-butter' : 'bg-background'
                  )}
                >
                  {isOwner ? (
                    <DoodleCrown className="h-3.5 w-3.5" />
                  ) : (
                    <DoodleShield className="h-3.5 w-3.5" />
                  )}
                  {roleLabel(admin.role)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminList;
