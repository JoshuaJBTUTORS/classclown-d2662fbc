import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface TopicOption {
  id: string;
  name: string;
  icon: string;
}

interface TopicSelectionScreenProps {
  courseId: string;
  moduleId: string;
  userName?: string;
  topics: TopicOption[];
  yearGroup?: string;
}

export const TopicSelectionScreen = ({
  courseId,
  moduleId,
  userName = 'there',
  topics,
  yearGroup = 'GCSE'
}: TopicSelectionScreenProps) => {
  const navigate = useNavigate();

  const handleTopicSelect = (topic: TopicOption) => {
    navigate(
      `/lesson-planning?topic=${encodeURIComponent(topic.name)}&yearGroup=${encodeURIComponent(yearGroup)}&moduleId=${moduleId}&courseId=${courseId}`
    );
  };

  return (
    <div className="container mx-auto max-w-[720px] text-center py-10">
      <button
        onClick={() => navigate(`/course/${courseId}`)}
        className="cleo-btn-outline mb-6 inline-flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </button>

      <div className="text-[28px] font-bold mb-7" style={{ color: 'var(--cleo-green)' }}>
        Cleo
      </div>
      
      <div className="cleo-avatar-large">
        🧑🏻‍🔬
      </div>

      <h1 className="text-[34px] font-bold mb-9">
        What do you want to focus on today, {userName}?
      </h1>

      <div className="cleo-topic-grid">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="cleo-topic-card"
            onClick={() => handleTopicSelect(topic)}
          >
            <span className="text-[26px]">{topic.icon}</span>
            <span className="font-semibold text-[18px]">{topic.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
