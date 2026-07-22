import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
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
  { id: 2, label: 'Student', description: 'Coming soon' },
  { id: 3, label: 'Review', description: 'Coming soon' },
];

interface Proposal {
  id: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  completed_at: string | null;
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

  const loadProposals = async () => {
    setLoadingProposals(true);
    const { data, error } = await supabase
      .from('lesson_proposals')
      .select('id, recipient_name, recipient_email, recipient_phone, completed_at')
      .eq('status', 'completed')
      .is('parent_id', null)
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
    if (!selectedProposal || !selectedProposal.recipient_email) {
      toast.error('Selected proposal is missing an email');
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
        toast.error(error.message || 'Failed to create parent account');
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Link proposal to newly created parent so it disappears from the picker
      const newParentId = data?.parent?.id;
      if (newParentId) {
        await supabase
          .from('lesson_proposals')
          .update({ parent_id: newParentId })
          .eq('id', selectedProposal.id);
      }

      toast.success(data?.message || 'Parent account created (default password: classbeyond123!)');
      setCreatedEmail(selectedProposal.recipient_email);
      setCompleted((c) => Array.from(new Set([...c, 1])));
      setProposals((list) => list.filter((p) => p.id !== selectedProposal.id));
      setSelectedProposalId('');
    } catch (e: any) {
      toast.error(e?.message || 'Unexpected error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className="flex flex-col items-center gap-2 flex-1 min-w-0"
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
                            ? 'No completed proposals without a parent account'
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
                    disabled={!selectedProposal || creating}
                  >
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create parent account
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

          {currentStep > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step {currentStep}: {STEPS[currentStep - 1].label}</CardTitle>
                <CardDescription>This step is coming soon.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
};

export default Onboarding;
