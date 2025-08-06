import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, BookOpen, Brain, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';

interface ProgressSummaryProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface SummaryStats {
  averageScore: number;
  attendanceRate: number;
  totalHomework: number;
  improvementTrend: number;
  averageAssessmentScore: number;
  totalAssessments: number;
  assessmentImprovementTrend: number;
  averageEngagement: number;
  averageConfidence: number;
  engagementTrend: number;
  confidenceTrend: number;
  totalLessonSummaries: number;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ filters, userRole }) => {
  const [stats, setStats] = useState<SummaryStats>({
    averageScore: 0,
    attendanceRate: 0,
    totalHomework: 0,
    improvementTrend: 0,
    averageAssessmentScore: 0,
    totalAssessments: 0,
    assessmentImprovementTrend: 0,
    averageEngagement: 0,
    averageConfidence: 0,
    engagementTrend: 0,
    confidenceTrend: 0,
    totalLessonSummaries: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasAssessmentAccess, setHasAssessmentAccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkAssessmentAccess();
  }, [user, userRole]);

  useEffect(() => {
    fetchSummaryStats();
  }, [filters, user, userRole, hasAssessmentAccess]);

  const checkAssessmentAccess = async () => {
    if (!user) return;

    try {
      // Owners always have access
      if (userRole === 'owner') {
        setHasAssessmentAccess(true);
        return;
      }

      // Check if user has purchased any course
      const purchases = await paymentService.getUserPurchases();
      setHasAssessmentAccess(purchases.length > 0);
    } catch (error) {
      console.error('Error checking assessment access:', error);
      setHasAssessmentAccess(false);
    }
  };

  const fetchSummaryStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let studentIds: number[] = [];

      // Get student IDs for homework data
      if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (studentData) studentIds = [studentData.id];
      } else if (userRole === 'owner' && filters.selectedStudents.length > 0) {
        studentIds = filters.selectedStudents.map(id => parseInt(id));
      }

      // Fetch homework statistics
      let homeworkQuery = supabase
        .from('homework_submissions')
        .select('percentage_score, submitted_at')
        .not('percentage_score', 'is', null)
        .order('submitted_at', { ascending: true });

      if (studentIds.length > 0) {
        homeworkQuery = homeworkQuery.in('student_id', studentIds);
      }

      if (filters.dateRange.from) {
        homeworkQuery = homeworkQuery.gte('submitted_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        homeworkQuery = homeworkQuery.lte('submitted_at', filters.dateRange.to.toISOString());
      }

      const { data: homeworkData, error: homeworkError } = await homeworkQuery;
      if (homeworkError) throw homeworkError;

      // Fetch assessment statistics only if user has access
      let assessmentData = null;
      if (hasAssessmentAccess) {
        let assessmentQuery = supabase
          .from('assessment_sessions')
          .select(`
            total_marks_achieved,
            total_marks_available,
            completed_at,
            assessment:ai_assessments(subject)
          `)
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .not('total_marks_available', 'is', null)
          .gt('total_marks_available', 0)
          .order('completed_at', { ascending: true });

        // Filter assessments by user
        if (userRole === 'student' || userRole === 'parent') {
          assessmentQuery = assessmentQuery.eq('user_id', user.id);
        } else if (userRole === 'owner' && filters.selectedStudents.length > 0) {
          assessmentQuery = assessmentQuery.in('user_id', filters.selectedStudents);
        }

        if (filters.dateRange.from) {
          assessmentQuery = assessmentQuery.gte('completed_at', filters.dateRange.from.toISOString());
        }
        if (filters.dateRange.to) {
          assessmentQuery = assessmentQuery.lte('completed_at', filters.dateRange.to.toISOString());
        }

        const { data: assessments, error: assessmentError } = await assessmentQuery;
        if (assessmentError) throw assessmentError;
        assessmentData = assessments;
      }

      // Fetch attendance statistics
      let attendanceQuery = supabase
        .from('lesson_attendance')
        .select(`
          attendance_status,
          lesson:lessons(start_time, subject)
        `);

      if (studentIds.length > 0) {
        attendanceQuery = attendanceQuery.in('student_id', studentIds);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Fetch engagement and confidence statistics
      let engagementData = null;
      if (hasAssessmentAccess) {
        let engagementQuery = supabase
          .from('lesson_student_summaries')
          .select(`
            engagement_score,
            confidence_score,
            created_at
          `)
          .not('engagement_score', 'is', null)
          .not('confidence_score', 'is', null)
          .order('created_at', { ascending: true });

        // Filter by student if applicable
        if (studentIds.length > 0) {
          engagementQuery = engagementQuery.in('student_id', studentIds);
        }

        if (filters.dateRange.from) {
          engagementQuery = engagementQuery.gte('created_at', filters.dateRange.from.toISOString());
        }
        if (filters.dateRange.to) {
          engagementQuery = engagementQuery.lte('created_at', filters.dateRange.to.toISOString());
        }

        const { data: engagement, error: engagementError } = await engagementQuery;
        if (engagementError) throw engagementError;
        engagementData = engagement;
      }

      // Calculate homework statistics
      const totalHomework = homeworkData?.length || 0;
      const averageScore = totalHomework > 0 
        ? Math.round(homeworkData!.reduce((sum, hw) => sum + hw.percentage_score, 0) / totalHomework)
        : 0;

      // Calculate assessment statistics
      const totalAssessments = assessmentData?.length || 0;
      const averageAssessmentScore = totalAssessments > 0
        ? Math.round(assessmentData!.reduce((sum, assessment) => {
            const percentage = (assessment.total_marks_achieved / assessment.total_marks_available) * 100;
            return sum + percentage;
          }, 0) / totalAssessments)
        : 0;

      // Calculate attendance statistics
      const totalLessons = attendanceData?.length || 0;
      const attendedLessons = attendanceData?.filter(a => a.attendance_status === 'present').length || 0;
      const attendanceRate = totalLessons > 0 
        ? Math.round((attendedLessons / totalLessons) * 100)
        : 0;

      // Calculate homework improvement trend
      let improvementTrend = 0;
      if (homeworkData && homeworkData.length >= 4) {
        const midpoint = Math.floor(homeworkData.length / 2);
        const firstHalf = homeworkData.slice(0, midpoint);
        const secondHalf = homeworkData.slice(midpoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, hw) => sum + hw.percentage_score, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, hw) => sum + hw.percentage_score, 0) / secondHalf.length;
        
        improvementTrend = Math.round(secondHalfAvg - firstHalfAvg);
      }

      // Calculate assessment improvement trend
      let assessmentImprovementTrend = 0;
      if (assessmentData && assessmentData.length >= 4) {
        const midpoint = Math.floor(assessmentData.length / 2);
        const firstHalf = assessmentData.slice(0, midpoint);
        const secondHalf = assessmentData.slice(midpoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, assessment) => {
          const percentage = (assessment.total_marks_achieved / assessment.total_marks_available) * 100;
          return sum + percentage;
        }, 0) / firstHalf.length;
        
        const secondHalfAvg = secondHalf.reduce((sum, assessment) => {
          const percentage = (assessment.total_marks_achieved / assessment.total_marks_available) * 100;
          return sum + percentage;
        }, 0) / secondHalf.length;
        
        assessmentImprovementTrend = Math.round(secondHalfAvg - firstHalfAvg);
      }

      // Calculate engagement and confidence statistics
      const totalLessonSummaries = engagementData?.length || 0;
      const averageEngagement = totalLessonSummaries > 0
        ? Math.round(engagementData!.reduce((sum, item) => sum + item.engagement_score, 0) / totalLessonSummaries)
        : 0;
      const averageConfidence = totalLessonSummaries > 0
        ? Math.round(engagementData!.reduce((sum, item) => sum + item.confidence_score, 0) / totalLessonSummaries)
        : 0;

      // Calculate engagement and confidence trends
      let engagementTrend = 0;
      let confidenceTrend = 0;
      if (engagementData && engagementData.length >= 4) {
        const midpoint = Math.floor(engagementData.length / 2);
        const firstHalf = engagementData.slice(0, midpoint);
        const secondHalf = engagementData.slice(midpoint);
        
        const firstHalfEngagementAvg = firstHalf.reduce((sum, item) => sum + item.engagement_score, 0) / firstHalf.length;
        const secondHalfEngagementAvg = secondHalf.reduce((sum, item) => sum + item.engagement_score, 0) / secondHalf.length;
        engagementTrend = Math.round(secondHalfEngagementAvg - firstHalfEngagementAvg);

        const firstHalfConfidenceAvg = firstHalf.reduce((sum, item) => sum + item.confidence_score, 0) / firstHalf.length;
        const secondHalfConfidenceAvg = secondHalf.reduce((sum, item) => sum + item.confidence_score, 0) / secondHalf.length;
        confidenceTrend = Math.round(secondHalfConfidenceAvg - firstHalfConfidenceAvg);
      }

      setStats({
        averageScore,
        attendanceRate,
        totalHomework,
        improvementTrend,
        averageAssessmentScore,
        totalAssessments,
        assessmentImprovementTrend,
        averageEngagement,
        averageConfidence,
        engagementTrend,
        confidenceTrend,
        totalLessonSummaries
      });
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      toast.error('Failed to load progress summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Homework Average",
      value: `${stats.averageScore}%`,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Assessment Average",
      value: hasAssessmentAccess ? `${stats.averageAssessmentScore}%` : "Locked",
      icon: hasAssessmentAccess ? Brain : Lock,
      color: hasAssessmentAccess ? "text-purple-600" : "text-gray-400",
      bgColor: hasAssessmentAccess ? "bg-purple-50" : "bg-gray-50"
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Average Engagement",
      value: hasAssessmentAccess ? `${stats.averageEngagement}/10` : "Locked",
      icon: hasAssessmentAccess ? TrendingUp : Lock,
      color: hasAssessmentAccess ? "text-emerald-600" : "text-gray-400",
      bgColor: hasAssessmentAccess ? "bg-emerald-50" : "bg-gray-50"
    },
    {
      title: "Average Confidence",
      value: hasAssessmentAccess ? `${stats.averageConfidence}/10` : "Locked",
      icon: hasAssessmentAccess ? Brain : Lock,
      color: hasAssessmentAccess ? "text-violet-600" : "text-gray-400",
      bgColor: hasAssessmentAccess ? "bg-violet-50" : "bg-gray-50"
    },
    {
      title: "Total Homework",
      value: stats.totalHomework.toString(),
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Total Assessments",
      value: hasAssessmentAccess ? stats.totalAssessments.toString() : "Locked",
      icon: hasAssessmentAccess ? Brain : Lock,
      color: hasAssessmentAccess ? "text-indigo-600" : "text-gray-400",
      bgColor: hasAssessmentAccess ? "bg-indigo-50" : "bg-gray-50"
    },
    {
      title: "Overall Progress",
      value: hasAssessmentAccess 
        ? `${Math.round((stats.improvementTrend + stats.assessmentImprovementTrend + stats.engagementTrend + stats.confidenceTrend) / 4) > 0 ? '+' : ''}${Math.round((stats.improvementTrend + stats.assessmentImprovementTrend + stats.engagementTrend + stats.confidenceTrend) / 4)}%`
        : `${stats.improvementTrend > 0 ? '+' : ''}${stats.improvementTrend}%`,
      icon: hasAssessmentAccess 
        ? (Math.round((stats.improvementTrend + stats.assessmentImprovementTrend + stats.engagementTrend + stats.confidenceTrend) / 4) >= 0 ? TrendingUp : TrendingDown)
        : (stats.improvementTrend >= 0 ? TrendingUp : TrendingDown),
      color: hasAssessmentAccess 
        ? (Math.round((stats.improvementTrend + stats.assessmentImprovementTrend + stats.engagementTrend + stats.confidenceTrend) / 4) >= 0 ? "text-green-600" : "text-red-600")
        : (stats.improvementTrend >= 0 ? "text-green-600" : "text-red-600"),
      bgColor: hasAssessmentAccess 
        ? (Math.round((stats.improvementTrend + stats.assessmentImprovementTrend + stats.engagementTrend + stats.confidenceTrend) / 4) >= 0 ? "bg-green-50" : "bg-red-50")
        : (stats.improvementTrend >= 0 ? "bg-green-50" : "bg-red-50")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-6">
      {statCards.map((card, index) => (
        <Card key={index} className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                  {card.title}
                </p>
                <p className="text-2xl font-bold font-playfair text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProgressSummary;
