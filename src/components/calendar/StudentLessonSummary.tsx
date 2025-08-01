import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, User, Clock, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

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
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
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
}

const StudentLessonSummary: React.FC<StudentLessonSummaryProps> = ({ lessonId, students }) => {
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();

  const isTeacherRole = isTutor || isAdmin || isOwner;

  useEffect(() => {
    if (lessonId && students.length > 0) {
      fetchSummaries();
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Loading AI lesson summaries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleSummaries.length === 0) {
    return null; // Don't show the section if no summaries are available
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4" />
          AI Lesson Summaries
          <Badge variant="secondary" className="ml-2">
            {visibleSummaries.length} {visibleSummaries.length === 1 ? 'Summary' : 'Summaries'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {visibleSummaries.map((summary) => (
            <Collapsible
              key={summary.id}
              open={expandedSummaries.has(summary.id)}
              onOpenChange={() => toggleExpanded(summary.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {summary.student?.first_name} {summary.student?.last_name}
                      </p>
                      {summary.engagement_level && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs mt-1 ${getEngagementColor(summary.engagement_level)}`}
                        >
                          {summary.engagement_level} Engagement
                        </Badge>
                      )}
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
                  {summary.ai_summary && (
                    <div className="p-3 bg-background rounded-lg border">
                      <h4 className="font-medium text-sm mb-2">AI Summary</h4>
                      <p className="text-sm text-muted-foreground">{summary.ai_summary}</p>
                    </div>
                  )}

                  {summary.topics_covered && summary.topics_covered.length > 0 && (
                    <div className="p-3 bg-background rounded-lg border">
                      <h4 className="font-medium text-sm mb-2">Topics Covered</h4>
                      <div className="flex flex-wrap gap-1">
                        {summary.topics_covered.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.student_contributions && (
                    <div className="p-3 bg-background rounded-lg border">
                      <h4 className="font-medium text-sm mb-2">Student Contributions</h4>
                      <p className="text-sm text-muted-foreground">{summary.student_contributions}</p>
                    </div>
                  )}

                  {summary.what_went_well && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-sm mb-2 text-green-800">What Went Well</h4>
                      <p className="text-sm text-green-700">{summary.what_went_well}</p>
                    </div>
                  )}

                  {summary.areas_for_improvement && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium text-sm mb-2 text-amber-800">Areas for Improvement</h4>
                      <p className="text-sm text-amber-700">{summary.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentLessonSummary;