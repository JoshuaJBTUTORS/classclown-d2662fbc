import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="cleo-topic"
            onClick={() => handleTopicSelect(topic)}
          >
            <span className="cleo-icon">{topic.icon}</span>
            <span>{topic.position ? `${topic.position}) ` : ''}{topic.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
