import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STEPS = [
  { id: 1, label: 'Parent', description: 'From completed proposal' },
  { id: 2, label: 'Sessions', description: 'Review proposal sessions' },
  { id: 3, label: 'Add Lessons', description: 'Schedule in calendar' },
  
];

interface FoundLesson {
  id: string;
  start_time: string;
  end_time: string;
  subject: string | null;
  title: string | null;
}

interface LessonTime {
  day?: string;
  time?: string;
  duration?: number;
  subject?: string | null;
}

interface Proposal {
  id: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  completed_at: string | null;
  subject?: string | null;
  lesson_type?: string | null;
  lesson_times?: LessonTime[] | null;
  price_per_lesson?: number | null;
  payment_cycle?: string | null;
  contract_term?: string | null;
  internal_notes?: string | null;
}

const splitName = (full: string) => {
  const trimmed = (full || '').trim();
  if (!trimmed) return { first_name: '', last_name: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isOwner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && !isOwner) {
      navigate('/unauthorized');
    }
  }, [isAdmin, isOwner, navigate]);

  const [createError, setCreateError] = useState<string | null>(null);
  const [createdProposal, setCreatedProposal] = useState<Proposal | null>(null);
  const [createdParentRowId, setCreatedParentRowId] = useState<string | null>(null);
  const [createdParentUserId, setCreatedParentUserId] = useState<string | null>(null);

  // Step 3 state
  const [hasOpenedCalendar, setHasOpenedCalendar] = useState(false);
  const [checkingLessons, setCheckingLessons] = useState(false);
  const [foundLessons, setFoundLessons] = useState<FoundLesson[]>([]);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Step 4 state
  const [pushingTicket, setPushingTicket] = useState(false);

  const handleAddedLessons = async () => {
    if (pushingTicket || completed.includes(3)) return;
    setCompleted((c) => Array.from(new Set([...c, 3])));

    if (!createdProposal || !createdProposal.recipient_email) {
      toast.error('Missing proposal data — cannot push HubSpot ticket');
      navigate('/students');
      return;
    }
    setPushingTicket(true);
    try {
      // Fire welcome email in parallel with HubSpot ticket
      const welcomeEmailPromise = supabase.functions.invoke('send-welcome-email', {
        body: {
          parentEmail: createdProposal.recipient_email,
          parentName: createdProposal.recipient_name || '',
          lessonTimes: createdProposal.lesson_times,
        },
      }).then(({ error }) => {
        if (error) {
          console.error('Welcome email failed:', error);
          toast.warning('Welcome email failed to send — please send manually');
        } else {
          toast.success('Welcome email sent to client');
        }
      }).catch((err) => {
        console.error('Welcome email exception:', err);
        toast.warning('Welcome email failed to send — please send manually');
      });

      const { data, error } = await supabase.functions.invoke('hubspot-create-payment-ticket', {
        body: {
          proposalId: createdProposal.id,
          parentEmail: createdProposal.recipient_email,
          parentName: createdProposal.recipient_name || '',
          parentPhone: createdProposal.recipient_phone,
          subject: createdProposal.subject,
          lessonType: createdProposal.lesson_type,
          contractTerm: createdProposal.contract_term,
          lessonTimes: createdProposal.lesson_times,
          sessionsPerWeek: Array.isArray(createdProposal.lesson_times) ? createdProposal.lesson_times.length : null,
        },
      });
      if (error) throw error;
      if ((data as any)?.ticketId) {
        if ((data as any)?.leadStatusUpdated) {
          toast.success('Onboarding complete — payment ticket created and HubSpot contact marked Active Customer');
        } else {
          toast.success('Onboarding complete — payment setup ticket created in HubSpot');
          toast.warning('Could not update HubSpot lead status — please set Active Customer manually');
        }
      } else {
        throw new Error((data as any)?.error || 'Unknown response from HubSpot');
      }

      await welcomeEmailPromise;
    } catch (e: any) {
      console.error('HubSpot ticket push failed:', e);
      toast.error('Onboarding complete, but HubSpot ticket failed — please create manually');
    } finally {
      setPushingTicket(false);
      navigate('/students');
    }
  };


  const loadProposals = async () => {
    setLoadingProposals(true);
    const { data, error } = await supabase
      .from('lesson_proposals')
      .select('id, recipient_name, recipient_email, recipient_phone, completed_at, subject, lesson_type, lesson_times, price_per_lesson, payment_cycle, contract_term')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Failed to load proposals');
    } else {
      setProposals((data as Proposal[]) || []);
    }
    setLoadingProposals(false);
  };

  useEffect(() => {
    if (isAdmin || isOwner) loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isOwner]);

  const selectedProposal = proposals.find((p) => p.id === selectedProposalId);

  const handleCreateFromProposal = async () => {
    if (creating || completed.includes(1)) return;
    setCreateError(null);
    if (!selectedProposal || !selectedProposal.recipient_email) {
      const msg = 'Selected proposal is missing an email';
      setCreateError(msg);
      toast.error(msg);
      return;
    }
    setCreating(true);

    try {
      const { first_name, last_name } = splitName(selectedProposal.recipient_name || '');
      const { data, error } = await supabase.functions.invoke('create-parent-account', {
        body: {
          first_name,
          last_name,
          email: selectedProposal.recipient_email,
          phone: selectedProposal.recipient_phone || undefined,
        },
      });
      if (error) {
        const msg = error.message || 'Failed to create parent account';
        setCreateError(msg);
        toast.error(msg);
        return;
      }
      if (data?.error) {
        setCreateError(data.error);
        toast.error(data.error);
        return;
      }

      // Link proposal to newly created parent so it disappears from the picker
      const newParentRowId = data?.parent?.id;
      const newParentUserId = data?.parent?.user_id;
      if (newParentUserId) {
        const { error: linkErr } = await supabase
          .from('lesson_proposals')
          .update({ parent_id: newParentUserId })
          .eq('id', selectedProposal.id);
        if (linkErr) {
          const msg = `Parent created, but failed to link proposal: ${linkErr.message}`;
          setCreateError(msg);
          toast.error(msg);
          return;
        }
      }

      toast.success(data?.message || 'Parent account created (default password: classbeyond123!)');
      if (data?.activatedStudents > 0) {
        toast.success(`${data.activatedStudents} student(s) moved from trial to active`);
      }

      setCreatedEmail(selectedProposal.recipient_email);
      setCreatedProposal(selectedProposal);
      setCreatedParentRowId(newParentRowId || null);
      setCreatedParentUserId(newParentUserId || null);
      setCompleted((c) => Array.from(new Set([...c, 1])));
      setProposals((list) => list.filter((p) => p.id !== selectedProposal.id));
      setCurrentStep(2);
    } catch (e: any) {
      const msg = e?.message || 'Unexpected error';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCalendar = () => {
    setHasOpenedCalendar(true);
    window.open('https://classclowncrm.com/calendar', '_blank');
  };

  const handleCheckLessons = async () => {
    setCheckError(null);
    setHasChecked(true);
    if (!createdParentRowId) {
      setCheckError('Missing parent id — complete step 1 first.');
      return;
    }
    setCheckingLessons(true);
    try {
      const { data: studentRows, error: sErr } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', createdParentRowId);
      if (sErr) throw sErr;
      const studentIds = (studentRows || []).map((s: any) => s.id);
      if (studentIds.length === 0) {
        setFoundLessons([]);
        setCheckError("No students linked to this parent yet. Add the student while scheduling the lesson in the calendar, then check again.");
        return;
      }
      const { data: lsRows, error: lsErr } = await supabase
        .from('lesson_students')
        .select('lesson_id')
        .in('student_id', studentIds);
      if (lsErr) throw lsErr;
      const lessonIds = Array.from(new Set((lsRows || []).map((r: any) => r.lesson_id)));
      if (lessonIds.length === 0) {
        setFoundLessons([]);
        return;
      }
      const { data: lessonRows, error: lErr } = await supabase
        .from('lessons')
        .select('id, start_time, end_time, subject, title')
        .in('id', lessonIds)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      if (lErr) throw lErr;
      const found = (lessonRows || []) as FoundLesson[];
      setFoundLessons(found);
      if (found.length > 0) {
        setCompleted((c) => Array.from(new Set([...c, 3])));
        toast.success(`Found ${found.length} upcoming lesson${found.length === 1 ? '' : 's'}`);
      }
    } catch (e: any) {
      setCheckError(e?.message || 'Failed to check lessons');
    } finally {
      setCheckingLessons(false);
    }
  };



  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <PageTitle
            title="Onboarding"
            subtitle="Follow the steps to onboard a new client"
            className="mb-6"
          />

          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, i) => {
              const isDone = completed.includes(step.id);
              const isActive = currentStep === step.id;
              const canNavigate = isDone || isActive;
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    disabled={!canNavigate}
                    onClick={() => canNavigate && setCurrentStep(step.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 flex-1 min-w-0',
                      !canNavigate && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm transition',
                        isDone
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isActive
                          ? 'border-primary text-primary bg-background'
                          : 'border-muted-foreground/30 text-muted-foreground bg-background'
                      )}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    <div className="text-center">
                      <div className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {step.label}
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn('h-0.5 flex-1 mx-2', completed.includes(step.id) ? 'bg-primary' : 'bg-muted')} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Step 1: Select completed proposal
                </CardTitle>
                <CardDescription>
                  Pick a signed proposal — we'll auto-create the parent account using the details on file.
                  Default password: <code className="text-xs">classbeyond123!</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {createdEmail && (
                  <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-md p-3">
                    <Check className="h-4 w-4" />
                    Parent account created for <strong>{createdEmail}</strong>.
                  </div>
                )}

                {createError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                    <strong className="block mb-1">Couldn't create parent account</strong>
                    {createError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Completed proposal</label>
                  <Select
                    value={selectedProposalId}
                    onValueChange={setSelectedProposalId}
                    disabled={loadingProposals || creating}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingProposals
                            ? 'Loading proposals…'
                            : proposals.length === 0
                            ? 'No completed proposals'
                            : 'Select a completed proposal'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {proposals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {(p.recipient_name || 'Unnamed').trim()} — {p.recipient_email}
                          {p.completed_at ? ` · ${new Date(p.completed_at).toLocaleDateString()}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProposal && (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <div><span className="text-muted-foreground">Name:</span> {selectedProposal.recipient_name}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selectedProposal.recipient_email}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {selectedProposal.recipient_phone || '—'}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateFromProposal}
                    disabled={!selectedProposal || creating || completed.includes(1)}
                  >
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {completed.includes(1) ? 'Parent account created' : 'Create parent account'}
                  </Button>

                  <Button variant="outline" onClick={loadProposals} disabled={loadingProposals || creating}>
                    Refresh list
                  </Button>
                  {completed.includes(1) && (
                    <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                      Continue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Sessions offered on the proposal</CardTitle>
                <CardDescription>
                  Make a note of the sessions offered — these are the times agreed on the signed proposal.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {!createdProposal ? (
                  <div className="text-sm text-muted-foreground">
                    Complete step 1 first to load the proposal's sessions.
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border p-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Parent:</span> {createdProposal.recipient_name}</div>
                      <div><span className="text-muted-foreground">Subject:</span> {createdProposal.subject || '—'}</div>
                      <div><span className="text-muted-foreground">Lesson type:</span> {createdProposal.lesson_type || '—'}</div>
                      <div><span className="text-muted-foreground">Contract term:</span> {createdProposal.contract_term || 'Month to Month'}</div>
                      <div><span className="text-muted-foreground">Price per lesson:</span> {createdProposal.price_per_lesson != null ? `£${createdProposal.price_per_lesson}` : '—'}</div>
                      <div><span className="text-muted-foreground">Payment cycle:</span> {createdProposal.payment_cycle || '—'}</div>
                    </div>

                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                      <div className="text-sm font-medium text-amber-900 mb-1">Internal notes from the proposal</div>
                      {createdProposal.internal_notes ? (
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{createdProposal.internal_notes}</p>
                      ) : (
                        <p className="text-sm text-amber-900/70">No internal notes on this proposal.</p>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Sessions</div>
                      {Array.isArray(createdProposal.lesson_times) && createdProposal.lesson_times.length > 0 ? (
                        <ul className="space-y-2">
                          {createdProposal.lesson_times.map((lt, i) => (
                            <li key={i} className="rounded-md border p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                              <div><span className="text-muted-foreground">Day:</span> {lt.day || '—'}</div>
                              <div><span className="text-muted-foreground">Time:</span> {lt.time || '—'}</div>
                              <div><span className="text-muted-foreground">Duration:</span> {lt.duration ? `${lt.duration} min` : '—'}</div>
                              <div><span className="text-muted-foreground">Subject:</span> {lt.subject || createdProposal.subject || '—'}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-muted-foreground">No sessions listed on this proposal.</div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button
                    onClick={() => {
                      setCompleted((c) => Array.from(new Set([...c, 2])));
                      setCurrentStep(3);
                    }}
                    disabled={!createdProposal}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Add lessons in the calendar</CardTitle>
                <CardDescription>
                  Open the calendar in a new tab and schedule the sessions agreed on the proposal.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {createdProposal && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium mb-1">Reminder — sessions to schedule</div>
                    <div className="text-muted-foreground mb-2">
                      Parent: {createdProposal.recipient_name} · Subject: {createdProposal.subject || '—'} · Type: {createdProposal.lesson_type || '—'}
                    </div>
                    {Array.isArray(createdProposal.lesson_times) && createdProposal.lesson_times.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {createdProposal.lesson_times.map((lt, i) => (
                          <li key={i}>
                            {lt.day || '—'} at {lt.time || '—'} ({lt.duration ? `${lt.duration} min` : '—'}) — {lt.subject || createdProposal.subject || '—'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-muted-foreground">No sessions listed on this proposal.</div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleOpenCalendar}>Add lessons</Button>
                  <Button
                    variant="outline"
                    onClick={handleAddedLessons}
                    disabled={pushingTicket}
                  >
                    {pushingTicket ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finishing…</>
                    ) : (
                      'I have added lessons'
                    )}
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                </div>

              </CardContent>
            </Card>
          )}


        </main>
      </div>
    </>
  );
};

export default Onboarding;
