import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function LearningHubCleoID() {
  const { user, profile, signOut } = useAuth();
  const { stats, badges, isLoading } = useGamification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const firstName = profile?.first_name || 'Student';
  const persona = stats?.learning_persona || 'The Strategist';
  const level = stats?.level || 1;
  const currentStreak = stats?.current_streak_days || 0;
  const energy = stats?.energy_percentage || 100;
  const focusScore = stats?.focus_score || 0;

  // Get top 2 badges
  const topBadges = badges?.slice(0, 2) || [];

  // Sample subjects - in real implementation, fetch from user's GCSE subjects
  const subjects = ['Maths', 'English', 'Science'];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background via-background/95 to-muted/20">
      <main className="w-full max-w-md bg-card rounded-[28px] shadow-[0_18px_45px_rgba(15,23,42,0.12)] p-6">
        {/* Section Label */}
        <div className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-5">
          My Cleo ID
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 via-orange-400 to-orange-500 flex items-center justify-center">
            <div className="w-[68px] h-[68px] rounded-full bg-amber-50 flex items-center justify-center text-4xl">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>👨‍🎓</span>
              )}
            </div>
          </div>
        </div>

        {/* Name & Persona */}
        <header className="text-center mb-2">
          <div className="mb-1">
            <span className="text-2xl font-bold">{firstName}</span>
            <span className="text-2xl ml-2">🦊</span>
          </div>
          <div className="text-xl font-semibold text-foreground/90">{persona}</div>
        </header>

        {/* Tagline */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          {currentStreak > 0
            ? 'Learning spirit unlocked through consistency.'
            : 'Ready to start your learning journey!'}
        </p>

        {/* Stats Inline */}
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <span>🔥</span>
            {currentStreak}-day streak
          </span>
          <span className="flex items-center gap-1">
            <span>🪴</span>
            Level {level}
          </span>
          <span>Energy: {energy}%</span>
        </div>

        {/* Info Grid - Pills */}
        <section className="grid grid-cols-2 gap-2.5 mb-4" aria-label="Cleo stats">
          {/* Streak Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <span>🔥</span>
              <span className="font-semibold">{currentStreak} days</span>
            </div>
            <div className="text-xs text-muted-foreground">strong</div>
          </article>

          {/* Persona Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
              <span>🍃</span>
              <span>{persona}</span>
            </div>
          </article>

          {/* Level Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
              <span>💚</span>
              <span>Level {level}</span>
            </div>
          </article>

          {/* Focus Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <span>⚡</span>
              <span>{focusScore}% Focus</span>
            </div>
          </article>

          {/* Subjects Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <span>🧪</span>
              <span>{subjects[0]},</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {subjects.slice(1).join(', ')}
            </div>
          </article>

          {/* Badges Pill */}
          <article className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <span>🏆</span>
              <span>
                {topBadges.length > 0 ? topBadges[0].badge_name : 'No badges yet'}
              </span>
            </div>
            {topBadges.length > 1 && (
              <div className="text-xs text-muted-foreground">{topBadges[1].badge_name}</div>
            )}
          </article>
        </section>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate('/learning-hub/settings')}
          >
            Edit Cleo ID
          </Button>
          <Button
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={() => navigate('/learning-hub/achievements')}
          >
            View Achievements
          </Button>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive mb-5"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          <span className="font-semibold">Cleo:</span> Consistency builds confidence — and
          confidence builds results 💚
        </p>
      </main>
    </div>
  );
}
