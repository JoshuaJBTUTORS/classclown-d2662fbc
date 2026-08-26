import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, User, Clock, Brain, FileText, Loader2, TrendingUp, MessageCircle, NotebookPen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getPastelTone, type PastelTone } from '@/components/lessonPlans/pastelPalette';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import AIAssessmentViewer from '@/components/learningHub/AIAssessmentViewer';
import GenerateAssessmentFromLessonDialog from '@/components/learningHub/GenerateAssessmentFromLessonDialog';

interface StudentSummary {
  id: string;
  student_id: number;
  lesson_id: string;
  transcription_id: string;
  ai_summary: string | null;
  topics_covered: string[] | null;
  student_contributions: string | null;
  what_went_well: string | null;
  areas_for_improvement: string | null;
  engagement_level: string | null;
  engagement_score: number | null;
  confidence_score: number | null;
  participation_time_percentage: number | null;
  attendance_status?: string | null;
  confidence_indicators: any;
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LessonAssessment {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface TranscriptStatus {
  status: string;
  exists: boolean;
}

interface StudentLessonSummaryProps {
  lessonId: string;
  students: Array<{
    student: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  lesson?: {
    id: string;
    title: string;
    subject: string;
    start_time: string;
    lesson_students: Array<{
      student: {
        id: number;
        first_name: string;
        last_name: string;
      };
    }>;
  };
  tone?: PastelTone;
}

const StudentLessonSummary: React.FC<StudentLessonSummaryProps> = ({ lessonId, students, lesson, tone }) => {
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [lessonAssessments, setLessonAssessments] = useState<LessonAssessment[]>([]);
  const [transcriptStatus, setTranscriptStatus] = useState<TranscriptStatus>({ status: 'unknown', exists: false });
  const [showAssessmentViewer, setShowAssessmentViewer] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [showGenerateAssessment, setShowGenerateAssessment] = useState(false);
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();

  const isTeacherRole = isTutor || isAdmin || isOwner;

  const activeTone = tone ?? getPastelTone(lesson?.subject || lesson?.title || 'lesson');

  useEffect(() => {
    if (lessonId && students.length > 0) {
      fetchSummaries();
      fetchLessonAssessments();
      fetchTranscriptStatus();
    }
  }, [lessonId, students]);

  const fetchSummaries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_student_summaries')
        .select(`
          *,
          students!lesson_student_summaries_student_id_fkey(id, first_name, last_name, email)
        `)
        .eq('lesson_id', lessonId);

      if (error) throw error;

      // Map the data to include student info
      const summariesWithStudents = data?.map(summary => ({
        ...summary,
        student: summary.students
      })) || [];

      setSummaries(summariesWithStudents);
    } catch (error) {
      console.error('Error fetching student summaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessonAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assessments')
        .select('id, title, status, created_at')
        .eq('lesson_id', lessonId)
        .eq('status', 'published');

      if (error) throw error;
      setLessonAssessments(data || []);
    } catch (error) {
      console.error('Error fetching lesson assessments:', error);
    }
  };

  const fetchTranscriptStatus = async () => {
    try {
      console.log(`Fetching transcript status for lesson: ${lessonId}`);
      
      const { data, error } = await supabase
        .from('lesson_transcriptions')
        .select('transcription_status, processing_notes, last_processing_error')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching transcript status:', error);
        setTranscriptStatus({
          status: 'error',
          exists: false
        });
        return;
      }
      
      if (data) {
        console.log(`Transcript status for lesson ${lessonId}:`, data);
        setTranscriptStatus({
          status: data.transcription_status,
          exists: true
        });
      } else {
        console.log(`No transcript found for lesson ${lessonId}`);
        setTranscriptStatus({
          status: 'not_found',
          exists: false
        });
      }
    } catch (error) {
      console.error('Error in fetchTranscriptStatus:', error);
      setTranscriptStatus({
        status: 'error',
        exists: false
      });
    }
  };

  const toggleExpanded = (summaryId: string) => {
    const newExpanded = new Set(expandedSummaries);
    if (newExpanded.has(summaryId)) {
      newExpanded.delete(summaryId);
    } else {
      newExpanded.add(summaryId);
    }
    setExpandedSummaries(newExpanded);
  };

  const getEngagementColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-600';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!score) return 'outline';
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  // Filter summaries based on user role
  const getVisibleSummaries = () => {
    if (isTeacherRole) {
      return summaries; // Teachers can see all summaries
    }

    // For students/parents, only show their own summaries
    return summaries.filter(summary => {
      // This would need to be enhanced with proper parent-student relationship checking
      // For now, we'll rely on RLS policies to filter the data at the database level
      return true;
    });
  };

  const visibleSummaries = getVisibleSummaries();

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-soft,1.5rem)] bg-muted/40 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <NotebookPen className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Loading Cleo lesson summaries…</span>
        </div>
      </div>
    );
  }

  if (visibleSummaries.length === 0) {
    return null; // Don't show the section if no summaries are available
  }

  const handleTakeAssessment = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    setShowAssessmentViewer(true);
  };

  const handleCloseAssessmentViewer = () => {
    setShowAssessmentViewer(false);
    setSelectedAssessmentId(null);
  };

  const handleAssessmentGenerated = () => {
    setShowGenerateAssessment(false);
    fetchLessonAssessments(); // Refresh assessments list
  };

  const getTranscriptStatusMessage = () => {
    switch (transcriptStatus.status) {
      case 'processing':
        return 'Waiting for transcripts to be generated...';
      case 'completed':
        return null; // No message needed when ready
      case 'not_found':
        return 'No transcript available for this lesson yet.';
      case 'error':
        return 'Error processing lesson transcript.';
      default:
        return 'Checking transcript status...';
    }
  };

  const canShowAssessments = () => {
    return transcriptStatus.status === 'completed' && lessonAssessments.length > 0;
  };

  const canGenerateAssessment = () => {
    return transcriptStatus.status === 'completed';
  };

  const shouldShowWaitingMessage = () => {
    return transcriptStatus.status === 'processing' || !transcriptStatus.exists;
  };

  return (
    <>
      <Card className="rounded-[var(--radius-soft,1.5rem)] border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3 px-1">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', activeTone.bg, activeTone.text)}>
                <NotebookPen className="h-4 w-4" />
              </span>
              <span className="font-heading font-extrabold tracking-tight">Cleo Lesson Summary</span>
              <span className={cn('ml-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', activeTone.bg, activeTone.text)}>
                {visibleSummaries.length} {visibleSummaries.length === 1 ? 'Summary' : 'Summaries'}
              </span>
            </div>
            
            {/* Assessment Actions */}
            <div className="flex items-center gap-2">
              {isTeacherRole && canGenerateAssessment() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateAssessment(true)}
                  disabled={!lesson}
                  className="flex items-center gap-2 rounded-full"
                >
                  <FileText className="h-4 w-4" />
                  Generate Assessment
                </Button>
              )}
              
              {!isTeacherRole && canShowAssessments() && (
                <div className="flex items-center gap-2">
                  {lessonAssessments.map((assessment) => (
                    <Button
                      key={assessment.id}
                      variant="default"
                      size="sm"
                      onClick={() => handleTakeAssessment(assessment.id)}
                      className="flex items-center gap-2 rounded-full"
                    >
                      <FileText className="h-4 w-4" />
                      Take Assessment
                    </Button>
                  ))}
                </div>
              )}
              
              {shouldShowWaitingMessage() && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getTranscriptStatusMessage()}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="p-1 pt-0">
        <div className="space-y-3">
          {visibleSummaries.map((summary) => {
            const didNotAttend =
              summary.attendance_status === 'absent' || summary.attendance_status === 'excused';
            return (
            <Collapsible
              key={summary.id}
              open={expandedSummaries.has(summary.id)}
              onOpenChange={() => toggleExpanded(summary.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', activeTone.bg, activeTone.text)}>
                      <User className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {summary.student?.first_name} {summary.student?.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {didNotAttend ? (
                          <Badge
                            variant="secondary"
                            className={`text-xs rounded-full border-0 ${
                              summary.attendance_status === 'excused'
                                ? 'bg-pastel-sand text-pastel-sand-foreground'
                                : 'bg-pastel-butter text-pastel-butter-foreground'
                            }`}
                          >
                            {summary.attendance_status === 'excused' ? 'Excused absence' : 'Did not attend'}
                          </Badge>
                        ) : (
                          <>
                            {summary.engagement_level && (
                              <Badge
                                variant="secondary"
                                className={`text-xs rounded-full border-0 ${getEngagementColor(summary.engagement_level)}`}
                              >
                                {summary.engagement_level} Engagement
                              </Badge>
                            )}
                            {summary.engagement_score && (
                              <Badge variant={getScoreBadgeVariant(summary.engagement_score)} className="text-xs rounded-full">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {summary.engagement_score}/10
                              </Badge>
                            )}
                            {summary.confidence_score && (
                              <Badge variant={getScoreBadgeVariant(summary.confidence_score)} className="text-xs rounded-full">
                                <Brain className="h-3 w-3 mr-1" />
                                {summary.confidence_score}/10
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(summary.created_at), 'MMM d, h:mm a')}
                    </div>
                    {expandedSummaries.has(summary.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className="pl-7 space-y-3">
                  {/* Engagement Metrics Summary — hidden when student didn't attend */}
                  {!didNotAttend && (summary.engagement_score || summary.confidence_score || summary.participation_time_percentage) && (
                    <div className={cn('grid grid-cols-3 gap-4 rounded-2xl p-5', activeTone.bg)}>
                      {summary.engagement_score && (
                        <div className={cn('text-center', activeTone.text)}>
                          <div className={`font-heading text-2xl font-extrabold ${getScoreColor(summary.engagement_score)}`}>
                            {summary.engagement_score}/10
                          </div>
                          <div className="mb-1 text-xs font-medium opacity-70">Engagement</div>
                          <Progress value={summary.engagement_score * 10} className="h-1.5 bg-background/60" />
                        </div>
                      )}
                      {summary.confidence_score && (
                        <div className={cn('text-center', activeTone.text)}>
                          <div className={`font-heading text-2xl font-extrabold ${getScoreColor(summary.confidence_score)}`}>
                            {summary.confidence_score}/10
                          </div>
                          <div className="mb-1 text-xs font-medium opacity-70">Confidence</div>
                          <Progress value={summary.confidence_score * 10} className="h-1.5 bg-background/60" />
                        </div>
                      )}
                      {summary.participation_time_percentage && (
                        <div className={cn('text-center', activeTone.text)}>
                          <div className="font-heading text-2xl font-extrabold">
                            {Math.round(summary.participation_time_percentage)}%
                          </div>
                          <div className="mb-1 text-xs font-medium opacity-70">Speaking Time</div>
                          <Progress value={summary.participation_time_percentage} className="h-1.5 bg-background/60" />
                        </div>
                      )}
                    </div>
                  )}


                  {summary.ai_summary && (
                    <div className="rounded-2xl bg-muted/40 p-5">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-2">Cleo Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{summary.ai_summary}</p>
                    </div>
                  )}

                  {summary.topics_covered && summary.topics_covered.length > 0 && (
                    <div className="rounded-2xl bg-muted/40 p-5">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-3">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics_covered.map((topic, index) => (
                          <span
                            key={index}
                            className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', activeTone.bg, activeTone.text)}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Indicators */}
                  {summary.confidence_indicators && Object.keys(summary.confidence_indicators).length > 0 && (
                    <div className="rounded-2xl bg-pastel-lilac p-5 text-pastel-lilac-foreground">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-3 flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        Confidence Analysis
                      </h4>
                      <div className="space-y-3">
                        {summary.confidence_indicators.confident_statements && summary.confidence_indicators.confident_statements.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-green-700 mb-1">Confident Statements</h5>
                            <ul className="text-xs text-green-800 space-y-1">
                              {summary.confidence_indicators.confident_statements.map((statement: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  {statement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.confidence_indicators.hesitation_patterns && summary.confidence_indicators.hesitation_patterns.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-orange-700 mb-1">Areas of Hesitation</h5>
                            <ul className="text-xs text-orange-800 space-y-1">
                              {summary.confidence_indicators.hesitation_patterns.map((pattern: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-orange-500 mr-2">•</span>
                                  {pattern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.confidence_indicators.improvement_signs && summary.confidence_indicators.improvement_signs.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-blue-700 mb-1">Improvement Signs</h5>
                            <ul className="text-xs text-blue-800 space-y-1">
                              {summary.confidence_indicators.improvement_signs.map((sign: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {sign}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {summary.student_contributions && (
                    <div className="rounded-2xl bg-pastel-sky p-5 text-pastel-sky-foreground">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-2 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Student Contributions
                      </h4>
                      <p className="text-sm opacity-80 leading-relaxed">{summary.student_contributions}</p>
                    </div>
                  )}

                  {summary.what_went_well && (
                    <div className="rounded-2xl bg-pastel-mint p-5 text-pastel-mint-foreground">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-2">What Went Well</h4>
                      <p className="text-sm opacity-80 leading-relaxed">{summary.what_went_well}</p>
                    </div>
                  )}

                  {summary.areas_for_improvement && (
                    <div className="rounded-2xl bg-pastel-butter p-5 text-pastel-butter-foreground">
                      <h4 className="font-heading font-extrabold tracking-tight text-sm mb-2">Areas for Improvement</h4>
                      <p className="text-sm opacity-80 leading-relaxed">{summary.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>

    {/* Assessment Viewer Dialog */}
    {showAssessmentViewer && selectedAssessmentId && (
      <Dialog open={showAssessmentViewer} onOpenChange={handleCloseAssessmentViewer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <AIAssessmentViewer
            assessmentId={selectedAssessmentId}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
    )}

    {/* Generate Assessment Dialog */}
    {showGenerateAssessment && lesson && (
      <GenerateAssessmentFromLessonDialog
        isOpen={showGenerateAssessment}
        onClose={() => setShowGenerateAssessment(false)}
        onSuccess={handleAssessmentGenerated}
        lesson={lesson}
      />
    )}
  </>
  );
};

export default StudentLessonSummary;