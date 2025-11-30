import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Plus, Target, TrendingUp, Clock, BookOpen, Trash2, BrainCircuit } from 'lucide-react';
import { revisionCalendarService } from '@/services/revisionCalendarService';
import RevisionSetupWizard from '@/components/learningHub/RevisionSetupWizard';
import RevisionCalendar from '@/components/learningHub/RevisionCalendar';
import { topicPerformanceService } from '@/services/topicPerformanceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const LearningHubRevision = () => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch revision schedules
  const { data: schedules, refetch: refetchSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['revision-schedules'],
    queryFn: () => revisionCalendarService.getRevisionSchedules(),
  });

  // Fetch revision sessions for stats
  const { data: sessions } = useQuery({
    queryKey: ['revision-sessions'],
    queryFn: () => revisionCalendarService.getRevisionSessions(),
  });

  const activeSchedule = schedules?.find(s => s.status === 'active');

  // Fetch all worst performing topics for the revision planner
  const { data: allWorstTopics, isLoading: allWorstTopicsLoading } = useQuery({
      queryKey: ['worst-topics-all', user?.id],
      queryFn: () => topicPerformanceService.getWorstPerformingTopics(20),
      enabled: !!user,
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!sessions) return { total: 0, completed: 0, upcoming: 0, streak: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const completed = sessions.filter(s => s.status === 'completed').length;
    const upcoming = sessions.filter(s => s.session_date >= today && s.status === 'scheduled').length;
    
    // Calculate streak (consecutive completed days)
    const completedSessions = sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday
    
    for (const session of completedSessions) {
      const sessionDate = new Date(session.session_date);
      if (sessionDate.toDateString() === currentDate.toDateString()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return {
      total: sessions.length,
      completed,
      upcoming,
      streak
    };
  }, [sessions]);

  const resetScheduleMutation = useMutation({
    mutationFn: revisionCalendarService.resetActiveSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revision-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['revision-sessions'] });
      toast({
        title: "Schedule Reset",
        description: "Your revision schedule has been reset.",
      });
    },
    onError: (error: any) => {
      // Enhanced error handling: show exact error message if available
      let message = error?.message || 'Failed to reset schedule for an unknown reason.';
      toast({
        title: "Reset Failed",
        description: message,
        variant: "destructive",
        duration: 9000,
      });
      // Also log to console for development
      console.error('[LearningHubRevision] Schedule reset error:', error);
    }
  });

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    refetchSchedules();
  };

  if (schedulesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (showSetupWizard || (!activeSchedule && !schedulesLoading)) {
    return (
      <div className="p-6">
        <RevisionSetupWizard
          onComplete={handleSetupComplete}
          onCancel={() => setShowSetupWizard(false)}
          worstTopics={allWorstTopics}
          worstTopicsLoading={allWorstTopicsLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revision Calendar</h1>
          <p className="text-gray-600 mt-1">Plan and track your revision sessions</p>
        </div>
        <Button onClick={() => setShowSetupWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {!activeSchedule ? (
        /* No Active Schedule */
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Revision Schedule</h3>
            <p className="text-gray-600 mb-8">
              Create a personalized revision schedule to stay on track with your studies.
            </p>
            <Button onClick={() => setShowSetupWizard(true)} size="lg">
              <Target className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Day Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.streak}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Schedule</span>
                <div className="flex items-center gap-4">
                   <Badge variant="default">{activeSchedule.status}</Badge>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your current schedule and all its planned sessions. You will be able to create a new one.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => resetScheduleMutation.mutate()}>
                          Yes, reset schedule
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardTitle>
              <CardDescription>
                {activeSchedule.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {activeSchedule.selected_days.length} days per week
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {activeSchedule.weekly_hours} hours per week
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Started {new Date(activeSchedule.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-gray-500" />
                  <span className="text-sm capitalize">
                    {activeSchedule.study_technique.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <RevisionCalendar />
        </>
      )}
    </div>
  );
};

export default LearningHubRevision;
