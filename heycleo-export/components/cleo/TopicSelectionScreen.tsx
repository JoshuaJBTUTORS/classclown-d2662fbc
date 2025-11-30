import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { supabase } from '@/integrations/supabase/client';

interface TopicOption {
  id: string;
  name: string;
  icon: string;
  position?: number;
}

interface TopicSelectionScreenProps {
  courseId: string;
  moduleId: string;
  userName?: string;
  topics: TopicOption[];
  yearGroup?: string;
  completedLessonIds?: string[];
}

export const TopicSelectionScreen = ({
  courseId,
  moduleId,
  userName = 'there',
  topics,
  yearGroup = 'GCSE',
  completedLessonIds = []
}: TopicSelectionScreenProps) => {
  const navigate = useNavigate();
  const [hasQuota, setHasQuota] = useState(true);
  const [checkingQuota, setCheckingQuota] = useState(true);

  useEffect(() => {
    const checkQuota = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingQuota(false);
          return;
        }

        const now = new Date().toISOString();
        const { data } = await supabase
          .from('voice_session_quotas')
          .select('minutes_remaining, bonus_minutes')
          .eq('user_id', user.id)
          .lte('period_start', now)
          .gte('period_end', now)
          .single();

        const totalMinutes = (data?.minutes_remaining || 0) + (data?.bonus_minutes || 0);
        setHasQuota(totalMinutes > 0);
      } catch (error) {
        console.error('Error checking quota:', error);
      } finally {
        setCheckingQuota(false);
      }
    };

    checkQuota();
  }, []);

  const handleTopicSelect = (topic: TopicOption) => {
    const isCompleted = completedLessonIds.includes(topic.id);
    navigate(
      `/lesson-planning?topic=${encodeURIComponent(topic.name)}&yearGroup=${encodeURIComponent(yearGroup)}&moduleId=${moduleId}&courseId=${courseId}&lessonId=${topic.id}&isCompleted=${isCompleted}`
    );
  };

  return (
    <div className="cleo-lesson-container">
      <button
        onClick={() => navigate(`/course/${courseId}`)}
        className="cleo-back-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </button>

      <div className="cleo-logo">Cleo</div>
      
      <div className="cleo-avatar">🧑🏻‍🔬</div>

      <h1 className="cleo-heading">
        What do you want to focus on today, {userName}?
      </h1>

      {/* Add subscription prompt for users with 0 minutes */}
      <div className="mb-6">
        <VoiceSessionIndicator showSubscriptionPrompt={true} />
        
        {!hasQuota && !checkingQuota && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Subscribe to unlock all lessons and start learning with Cleo! 🦊
          </p>
        )}
      </div>

      <div className="cleo-topics">
        {topics.map((topic) => {
          const isCompleted = completedLessonIds.includes(topic.id);
          const isDisabled = !hasQuota && !checkingQuota;
          
          return (
            <div
              key={topic.id}
              className={`cleo-topic ${
                isCompleted ? 'opacity-75 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''
              } ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => {
                if (!isDisabled) {
                  handleTopicSelect(topic);
                }
              }}
            >
              <span className="cleo-icon">{topic.icon}</span>
              <span className="flex-1">{topic.position ? `${topic.position}) ` : ''}{topic.name}</span>
              {isCompleted && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    Completed
                  </Badge>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
