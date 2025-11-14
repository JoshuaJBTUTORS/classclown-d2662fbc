import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

      <div className="cleo-topics">
        {topics.map((topic) => {
          const isCompleted = completedLessonIds.includes(topic.id);
          return (
            <div
              key={topic.id}
              className={`cleo-topic ${isCompleted ? 'opacity-75 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}
              onClick={() => handleTopicSelect(topic)}
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
