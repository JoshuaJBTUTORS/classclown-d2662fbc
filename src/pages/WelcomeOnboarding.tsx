import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TOUR_SLIDES,
  YEAR_GROUP_OPTIONS,
  WelcomeIntroIcon,
  AllSetIcon,
} from '@/components/welcome/welcomeSlides';

interface ChildRow {
  id: number;
  first_name: string | null;
  last_name: string | null;
  school: string | null;
  year_group: string | null;
}

const cardTone = 'rounded-[1.5rem] border-2 border-foreground/90 bg-card';

const WelcomeOnboarding: React.FC = () => {
  const { user, profile, userRole, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const isStudent = userRole === 'student';

  // Already onboarded (or an admin/tutor landed here) -> leave.
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (userRole && userRole !== 'parent' && userRole !== 'student') {
      navigate('/', { replace: true });
      return;
    }
    if (profile?.onboarding_completed) {
      navigate('/calendar', { replace: true });
    }
  }, [loading, user, userRole, profile?.onboarding_completed, navigate]);

  // Load the children (or the student's own record) to collect details for.
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoadingChildren(true);
      try {
        let query = supabase
          .from('students')
          .select('id, first_name, last_name, school, year_group');

        if (isStudent) {
          query = query.eq('user_id', user.id);
        } else {
          const { data: parentRow } = await supabase
            .from('parents')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!parentRow) {
            setChildren([]);
            setLoadingChildren(false);
            return;
          }
          query = query.eq('parent_id', parentRow.id);
        }

        const { data, error } = await query.order('first_name');
        if (error) throw error;
        setChildren((data as ChildRow[]) || []);
      } catch (err) {
        console.error('Failed to load student records for onboarding:', err);
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    };
    load();
  }, [user, isStudent]);

  const totalSteps = 2 + TOUR_SLIDES.length + 1; // intro + details + tour + finish
  const detailsStepIndex = 1;
  const finishStepIndex = totalSteps - 1;

  const detailsComplete = useMemo(() => {
    if (children.length === 0) return true; // nothing to collect
    return children.every((c) => (c.school || '').trim() && (c.year_group || '').trim());
  }, [children]);

  const updateChild = (id: number, patch: Partial<ChildRow>) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveDetails = async () => {
    if (children.length === 0) return true;
    setSaving(true);
    try {
      for (const child of children) {
        const { error } = await supabase
          .from('students')
          .update({
            school: (child.school || '').trim(),
            year_group: (child.year_group || '').trim(),
            grade: (child.year_group || '').trim(),
          })
          .eq('id', child.id);
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      console.error('Failed to save onboarding details:', err);
      toast.error(err?.message || 'Could not save those details. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!user) return;
    setFinishing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: now,
          platform_tour_completed_at: now,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      navigate('/calendar', { replace: true });
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      toast.error(err?.message || 'Could not finish onboarding. Please try again.');
    } finally {
      setFinishing(false);
    }
  };

  const goNext = async () => {
    if (step === detailsStepIndex) {
      if (!detailsComplete) {
        toast.error('Please add a school and year group first.');
        return;
      }
      const ok = await saveDetails();
      if (!ok) return;
    }
    if (step === finishStepIndex) {
      await finish();
      return;
    }
    setStep((s) => Math.min(s + 1, finishStepIndex));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const firstName = profile?.first_name || '';

  const renderBody = () => {
    if (step === 0) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/90 bg-pastel-mint">
            <WelcomeIntroIcon className="h-8 w-8 text-pastel-mint-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome{firstName ? `, ${firstName}` : ''} to Class Beyond
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            This is your home for lessons, homework, lesson plans, summaries and progress.
            We'll grab a couple of details and then show you around — it takes about a minute.
          </p>
        </div>
      );
    }

    if (step === detailsStepIndex) {
      return (
        <div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isStudent ? 'Tell us about your school' : 'Tell us about your children'}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This helps us match lesson plans and progress tracking to the right curriculum.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {loadingChildren ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-[1.25rem] border-2 border-foreground/90 bg-pastel-butter p-5 text-sm text-pastel-butter-foreground">
                We couldn't find a student record linked to your account yet. You can continue —
                your coordinator will add these details for you.
              </div>
            ) : (
              children.map((child) => (
                <div
                  key={child.id}
                  className="rounded-[1.25rem] border-2 border-foreground/90 bg-background/70 p-5"
                >
                  <p className="mb-4 font-heading text-base font-bold text-foreground">
                    {[child.first_name, child.last_name].filter(Boolean).join(' ') || 'Student'}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        School
                      </Label>
                      <Input
                        value={child.school || ''}
                        onChange={(e) => updateChild(child.id, { school: e.target.value })}
                        placeholder="e.g. Hitchin Girls' School"
                        className="h-11 rounded-full border-2 border-foreground/80 bg-card px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Year group
                      </Label>
                      <Select
                        value={child.year_group || ''}
                        onValueChange={(v) => updateChild(child.id, { year_group: v })}
                      >
                        <SelectTrigger className="h-11 rounded-full border-2 border-foreground/80 bg-card px-4">
                          <SelectValue placeholder="Select year group" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {YEAR_GROUP_OPTIONS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (step === finishStepIndex) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/90 bg-pastel-mint">
            <AllSetIcon className="h-8 w-8 text-pastel-mint-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            You're all set
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            That's the tour done. Your calendar is the best place to start — every lesson,
            homework task and summary lives alongside it.
          </p>
        </div>
      );
    }

    const slide = TOUR_SLIDES[step - 2];
    const Icon = slide.icon;
    return (
      <div>
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground/90 ${slide.tone}`}
          >
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {slide.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{slide.subtitle}</p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {slide.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-[1.25rem] border-2 border-foreground/90 bg-background/70 p-4 text-sm text-foreground"
            >
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const busy = saving || finishing;

  return (
    <div className="relative min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-pastel-sky opacity-50 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-pastel-blush opacity-50 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full border-2 border-foreground/90 bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
            Getting started
          </span>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

        <div className={`${cardTone} p-6 shadow-[6px_6px_0_0_hsl(var(--foreground)/0.9)] sm:p-10`}>
          {renderBody()}

          {/* Progress dots */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-foreground' : 'w-4 bg-foreground/20'
                }`}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || busy}
              className="h-11 rounded-full border-2 border-foreground/90 bg-transparent px-6 font-semibold"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={goNext}
              disabled={busy || (step === detailsStepIndex && loadingChildren)}
              className="h-11 rounded-full bg-foreground px-8 font-semibold text-background hover:bg-foreground/90"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : step === finishStepIndex ? (
                'Go to my calendar'
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Step {step + 1} of {totalSteps}
        </p>
      </div>
    </div>
  );
};

export default WelcomeOnboarding;
