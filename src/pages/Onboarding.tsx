import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, ArrowLeft, Check } from 'lucide-react';
import AddParentOnlyForm from '@/components/parents/AddParentOnlyForm';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Parent', description: 'Create parent account' },
  { id: 2, label: 'Student', description: 'Coming soon' },
  { id: 3, label: 'Review', description: 'Coming soon' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isOwner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [parentFormOpen, setParentFormOpen] = useState(false);

  if (!isAdmin && !isOwner) {
    navigate('/unauthorized');
    return null;
  }

  const handleParentCreated = () => {
    setCompleted((c) => Array.from(new Set([...c, 1])));
    setParentFormOpen(false);
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

          {/* Step content */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Step 1: Parent Only
                </CardTitle>
                <CardDescription>
                  Create a standalone parent account. Students can be linked in later steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {completed.includes(1) ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Check className="h-4 w-4" />
                    Parent account created.
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click below to open the parent details form.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => setParentFormOpen(true)} variant={completed.includes(1) ? 'outline' : 'default'}>
                    {completed.includes(1) ? 'Create another parent' : 'Open parent form'}
                  </Button>
                  {completed.includes(1) && (
                    <Button onClick={() => setCurrentStep(2)}>Continue</Button>
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

      <AddParentOnlyForm
        isOpen={parentFormOpen}
        onClose={() => setParentFormOpen(false)}
        onSuccess={handleParentCreated}
      />
    </>
  );
};

export default Onboarding;
