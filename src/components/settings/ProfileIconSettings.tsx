import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CLEO_AVATARS, resolveAvatarSrc } from '@/lib/cleoAvatars';

const ProfileIconSettings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  const current = profile?.avatar_url ?? null;
  const currentSrc = resolveAvatarSrc(current);

  const initials = (() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'CC';
  })();

  const select = async (key: string | null) => {
    if (!user) return;
    setSaving(key ?? 'initials');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: key })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile icon updated');
    } catch (err: any) {
      toast.error(err.message || 'Could not update profile icon');
    } finally {
      setSaving(null);
    }
  };

  const optionClass = (active: boolean) =>
    cn(
      'group relative flex flex-col items-center gap-2 rounded-[1.25rem] border p-4 transition-all duration-200',
      'hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]',
      active ? 'border-foreground bg-muted/50' : 'border-border/60 bg-background'
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-5 rounded-[1.25rem] bg-muted/40 px-5 py-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pastel-sand font-heading text-lg font-extrabold text-foreground">
          {currentSrc ? (
            <img
              src={currentSrc}
              alt="Your profile icon"
              loading="lazy"
              width={512}
              height={512}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold text-foreground">Current icon</p>
          <p className="text-sm text-muted-foreground">
            Your initials are used by default. Pick a Cleo avatar to personalise it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        <button type="button" onClick={() => select(null)} className={optionClass(!current)}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pastel-sand font-heading text-lg font-extrabold text-foreground">
            {saving === 'initials' ? <Loader2 className="h-5 w-5 animate-spin" /> : initials}
          </span>
          <span className="font-heading text-xs font-bold text-foreground">Initials</span>
          {!current && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>

        {CLEO_AVATARS.map((avatar) => {
          const active = current === avatar.key;
          return (
            <button
              key={avatar.key}
              type="button"
              onClick={() => select(avatar.key)}
              className={optionClass(active)}
            >
              <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-background">
                <img
                  src={avatar.src}
                  alt={avatar.label}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-full w-full object-cover"
                />
                {saving === avatar.key && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                )}
              </span>
              <span className="font-heading text-xs font-bold text-foreground">{avatar.label}</span>
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileIconSettings;
