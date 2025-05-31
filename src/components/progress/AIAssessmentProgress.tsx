import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Brain, Lock, TrendingUp, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIAssessmentProgressProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
    selectedChild: string;
  };
  userRole: string;
}

interface AssessmentResult {
  id: string;
  assessment_title: string;
  subject: string;
  best_score: number;
  total_possible: number;
  percentage_score: number;
  completed_sessions: number;
  last_attempt_date: string;
  student_name?: string;
  has_purchased: boolean;
  course_id?: string;
}

const AIAssessmentProgress: React.FC<AIAssessmentProgressProps> = ({ filters, userRole }) => {
  const [data, setData] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, parentProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAIAssessmentProgress();
  }, [filters, user, userRole, parentProfile]);

  const fetchAIAssessmentProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Build the base query for assessment sessions
      let query = supabase
        .from('assessment_sessions')
        .select(`
          id,
          total_marks_achieved,
          total_marks_available,
          completed_at,
          user_id,
          assessment:ai_assessments(
            id,
            title,
            subject
          ),
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      // Filter by student for student role
      if (userRole === 'student') {
        query = query.eq('user_id', user.id);
      }

      // Filter by parent's children for parent role
      if (userRole === 'parent' && parentProfile) {
        const { data: childrenData } = await supabase
          .from('students')
          .select('id, user_id')
          .eq('parent_id', parentProfile.id);

        if (childrenData && childrenData.length > 0) {
          let childrenUserIds = childrenData.map(child => child.user_id).filter(Boolean);
          
          if (filters.selectedChild !== 'all') {
            const selectedChildId = parseInt(filters.selectedChild);
            const selectedChild = childrenData.find(child => child.id === selectedChildId);
            if (selectedChild?.user_id) {
              childrenUserIds = [selectedChild.user_id];
            } else {
              childrenUserIds = [];
            }
          }
          
          if (childrenUserIds.length > 0) {
            query = query.in('user_id', childrenUserIds);
          } else {
            setData([]);
            setLoading(false);
            return;
          }
        } else {
          setData([]);
          setLoading(false);
          return;
        }
      }

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('completed_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('completed_at', filters.dateRange.to.toISOString());
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      // Group sessions by assessment and calculate best scores
      const assessmentMap = new Map<string, AssessmentResult>();

      for (const session of sessions || []) {
        if (!session.assessment) continue;

        const assessmentId = session.assessment.id;
        const percentage = session.total_marks_available > 0 
          ? Math.round((session.total_marks_achieved / session.total_marks_available) * 100)
          : 0;

        // Check if user has purchased related course (simplified - assumes assessment is linked to a course)
        const hasPurchased = userRole === 'owner' || userRole === 'admin'; // For now, only restrict for students/parents

        if (assessmentMap.has(assessmentId)) {
          const existing = assessmentMap.get(assessmentId)!;
          assessmentMap.set(assessmentId, {
            ...existing,
            best_score: Math.max(existing.best_score, session.total_marks_achieved),
            percentage_score: Math.max(existing.percentage_score, percentage),
            completed_sessions: existing.completed_sessions + 1,
            last_attempt_date: session.completed_at > existing.last_attempt_date 
              ? session.completed_at 
              : existing.last_attempt_date
          });
        } else {
          assessmentMap.set(assessmentId, {
            id: assessmentId,
            assessment_title: session.assessment.title,
            subject: session.assessment.subject || 'General',
            best_score: session.total_marks_achieved,
            total_possible: session.total_marks_available,
            percentage_score: percentage,
            completed_sessions: 1,
            last_attempt_date: session.completed_at,
            student_name: userRole === 'owner' && session.student
              ? `${session.student.first_name} ${session.student.last_name}`
              : undefined,
            has_purchased: hasPurchased
          });
        }
      }

      let resultData = Array.from(assessmentMap.values());

      // Filter by subject if specified
      if (filters.selectedSubjects.length > 0) {
        resultData = resultData.filter(item => filters.selectedSubjects.includes(item.subject));
      }

      setData(resultData);
    } catch (error) {
      console.error('Error fetching AI assessment progress:', error);
      toast.error('Failed to load AI assessment progress');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (courseId?: string) => {
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      navigate('/learning-hub');
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#e94b7f]" />
            AI Assessment Progress
          </CardTitle>
          <CardDescription className="text-gray-600">Loading assessment results...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e94b7f]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="font-playfair text-xl text-gray-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#e94b7f]" />
          AI Assessment Progress
        </CardTitle>
        <CardDescription className="text-gray-600">
          {userRole === 'owner' ? 'Student AI assessment performance' : 
           userRole === 'parent' ? 'Your children\'s AI assessment scores' :
           'Your AI assessment performance'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {data.map((assessment) => (
              <div key={assessment.id} className="relative">
                <Card className={`border transition-all duration-200 ${
                  assessment.has_purchased 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-gray-300 bg-gray-50/50'
                }`}>
                  <CardContent className="p-4">
                    {!assessment.has_purchased && (
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600 mb-2">Course Purchase Required</p>
                          <Button 
                            size="sm" 
                            onClick={() => handlePurchaseClick(assessment.course_id)}
                            className="bg-[#e94b7f] hover:bg-[#d63d6f]"
                          >
                            View Courses
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {assessment.assessment_title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {assessment.subject}
                          </Badge>
                          {assessment.student_name && (
                            <span>• {assessment.student_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          assessment.percentage_score >= 80 ? 'text-green-600' :
                          assessment.percentage_score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {assessment.has_purchased ? `${assessment.percentage_score}%` : '--'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assessment.has_purchased 
                            ? `${assessment.best_score}/${assessment.total_possible} marks`
                            : 'Hidden'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {assessment.has_purchased && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{assessment.completed_sessions} attempts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Last: {format(parseISO(assessment.last_attempt_date), 'MMM dd')}</span>
                          </div>
                        </div>
                        {assessment.percentage_score >= 80 && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-60 text-gray-500">
            <div className="text-center">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-400">No AI assessment data available</p>
              <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssessmentProgress;
