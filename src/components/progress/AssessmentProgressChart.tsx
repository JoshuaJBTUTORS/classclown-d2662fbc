import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Brain, Lock, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';

interface AssessmentProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface AssessmentScore {
  date: string;
  percentage: number;
  subject: string;
  assessment_title: string;
  student_name?: string;
}

const AssessmentProgressChart: React.FC<AssessmentProgressChartProps> = ({ filters, userRole }) => {
  const [data, setData] = useState<AssessmentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkEnrollmentAccess();
  }, [user, userRole]);

  useEffect(() => {
    if (hasAccess) {
      fetchAssessmentProgress();
    } else {
      setLoading(false);
    }
  }, [filters, user, userRole, hasAccess]);

  const checkEnrollmentAccess = async () => {
    if (!user) return;

    setCheckingAccess(true);
    try {
      // Owners always have access
      if (userRole === 'owner') {
        setHasAccess(true);
        return;
      }

      // Check if user has purchased any course
      const purchases = await paymentService.getUserPurchases();
      setHasAccess(purchases.length > 0);
    } catch (error) {
      console.error('Error checking enrollment access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchAssessmentProgress = async () => {
    if (!user || !hasAccess) return;

    setLoading(true);
    try {
      let query = supabase
        .from('assessment_sessions')
        .select(`
          completed_at,
          total_marks_achieved,
          total_marks_available,
          user_id,
          assessment:ai_assessments(
            title,
            subject
          )
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .not('total_marks_available', 'is', null)
        .gt('total_marks_available', 0)
        .order('completed_at', { ascending: true });

      // Filter by user for students and parents
      if (userRole === 'student' || userRole === 'parent') {
        query = query.eq('user_id', user.id);
      }

      // Apply owner filters
      if (userRole === 'owner' && filters.selectedStudents.length > 0) {
        query = query.in('user_id', filters.selectedStudents);
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

      // If we need student names for owners, fetch them separately
      let userProfiles = {};
      if (userRole === 'owner' && sessions && sessions.length > 0) {
        const userIds = [...new Set(sessions.map(session => session.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (profiles) {
          userProfiles = profiles.reduce((acc, profile) => {
            acc[profile.id] = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            return acc;
          }, {});
        }
      }

      const chartData = sessions?.map(session => {
        const percentage = Math.round((session.total_marks_achieved / session.total_marks_available) * 100);
        return {
          date: format(parseISO(session.completed_at), 'MMM dd'),
          percentage,
          subject: session.assessment?.subject || 'General',
          assessment_title: session.assessment?.title || 'Assessment',
          student_name: userRole === 'owner' ? userProfiles[session.user_id] || 'Unknown' : undefined
        };
      }) || [];

      // Filter by subject if specified
      const filteredData = filters.selectedSubjects.length > 0
        ? chartData.filter(item => filters.selectedSubjects.includes(item.subject))
        : chartData;

      setData(filteredData);
    } catch (error) {
      console.error('Error fetching assessment progress:', error);
      toast.error('Failed to load assessment progress');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAccess = () => {
    navigate('/heycleo');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg border-l-4 border-l-[#8b5cf6]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-[#8b5cf6] font-medium">Score: {data.percentage}%</p>
          <p className="text-sm text-gray-600 mt-1">Subject: {data.subject}</p>
          <p className="text-sm text-gray-600">{data.assessment_title}</p>
          {data.student_name && (
            <p className="text-sm text-gray-600">Student: {data.student_name}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (checkingAccess || loading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900">Assessment Progress</CardTitle>
          <CardDescription className="text-gray-600">
            {checkingAccess ? 'Checking access...' : 'Loading assessment scores...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show locked state for users without course access
  if (!hasAccess) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900">Assessment Progress</CardTitle>
          <CardDescription className="text-gray-600">
            Course enrollment required to access assessment progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center relative">
            {/* Blurred background chart for visual effect */}
            <div className="absolute inset-0 opacity-20 blur-sm">
              <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                <Brain className="h-24 w-24 text-gray-300" />
              </div>
            </div>
            
            {/* Lock overlay */}
            <div className="relative z-10 text-center bg-white rounded-lg p-8 border border-gray-200 shadow-lg max-w-sm">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unlock Assessment Progress
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Purchase any course to access your assessment progress tracking and detailed performance analytics.
              </p>
              <Button 
                onClick={handleUnlockAccess}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="font-playfair text-xl text-gray-900">Assessment Progress</CardTitle>
        <CardDescription className="text-gray-600">
          {userRole === 'owner' ? 'Student assessment scores over time' : 
           'Your assessment scores over time'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-400">No assessment data available</p>
                <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentProgressChart;
