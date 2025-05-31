import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Brain, Lock } from 'lucide-react';

interface AIAssessmentChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
    selectedChild: string;
  };
  userRole: string;
}

interface AssessmentScore {
  date: string;
  percentage: number;
  subject: string;
  assessment_title: string;
  student_name?: string;
  has_purchased: boolean;
}

const AIAssessmentChart: React.FC<AIAssessmentChartProps> = ({ filters, userRole }) => {
  const [data, setData] = useState<AssessmentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnpurchasedContent, setHasUnpurchasedContent] = useState(false);
  const { user, parentProfile } = useAuth();

  useEffect(() => {
    fetchAIAssessmentChart();
  }, [filters, user, userRole, parentProfile]);

  const fetchAIAssessmentChart = async () => {
    if (!user) return;

    setLoading(true);
    try {
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
        .order('completed_at', { ascending: true });

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

      const chartData = sessions?.map(session => {
        const percentage = session.total_marks_available > 0 
          ? Math.round((session.total_marks_achieved / session.total_marks_available) * 100)
          : 0;
        
        // For demo purposes, assume some content requires purchase
        const hasPurchased = userRole === 'owner' || userRole === 'admin' || Math.random() > 0.3;
        
        return {
          date: format(parseISO(session.completed_at), 'MMM dd'),
          percentage: hasPurchased ? percentage : 0,
          subject: session.assessment?.subject || 'General',
          assessment_title: session.assessment?.title || 'Unknown Assessment',
          student_name: userRole === 'owner' && session.student
            ? `${session.student.first_name} ${session.student.last_name}`
            : undefined,
          has_purchased: hasPurchased
        };
      }) || [];

      // Check if there's any unpurchased content
      setHasUnpurchasedContent(chartData.some(item => !item.has_purchased));

      // Filter by subject if specified
      const filteredData = filters.selectedSubjects.length > 0
        ? chartData.filter(item => filters.selectedSubjects.includes(item.subject))
        : chartData;

      setData(filteredData);
    } catch (error) {
      console.error('Error fetching AI assessment chart data:', error);
      toast.error('Failed to load AI assessment chart');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg border-l-4 border-l-[#8b5cf6]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {data.has_purchased ? (
            <>
              <p className="text-[#8b5cf6] font-medium">Score: {data.percentage}%</p>
              <p className="text-sm text-gray-600 mt-1">Subject: {data.subject}</p>
              <p className="text-sm text-gray-600">{data.assessment_title}</p>
              {data.student_name && (
                <p className="text-sm text-gray-600">Student: {data.student_name}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-gray-400" />
                <p className="text-gray-500 font-medium">Purchase Required</p>
              </div>
              <p className="text-sm text-gray-600">Subject: {data.subject}</p>
              <p className="text-sm text-gray-600">{data.assessment_title}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="font-playfair text-xl text-gray-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#8b5cf6]" />
            AI Assessment Trends
          </CardTitle>
          <CardDescription className="text-gray-600">Loading assessment trends...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="font-playfair text-xl text-gray-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#8b5cf6]" />
          AI Assessment Trends
          {hasUnpurchasedContent && (
            <Lock className="h-4 w-4 text-gray-400 ml-auto" />
          )}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {userRole === 'owner' ? 'Student AI assessment scores over time' : 
           userRole === 'parent' ? 'Your children\'s AI assessment trends' :
           'Your AI assessment scores over time'}
          {hasUnpurchasedContent && (
            <span className="text-amber-600 ml-2">• Some content requires course purchase</span>
          )}
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
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        {...props}
                        fill={payload?.has_purchased ? "#8b5cf6" : "#9ca3af"}
                        stroke={payload?.has_purchased ? "#8b5cf6" : "#9ca3af"}
                        strokeWidth={2}
                        r={payload?.has_purchased ? 5 : 3}
                      />
                    );
                  }}
                  activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-400">No AI assessment data available</p>
                <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssessmentChart;
