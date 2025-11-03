import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CleoInteractiveLearning } from '@/components/cleo/CleoInteractiveLearning';
import { vectorsScalarsLesson } from '@/data/lessons/vectorsScalars';

const LearningHubCleo: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cleo AI Tutor - Interactive Learning | JB Tutors</title>
        <meta
          name="description"
          content="Learn with Cleo's interactive voice tutor. Visual lessons with tables, diagrams, and interactive questions."
        />
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] w-full">
        <CleoInteractiveLearning lessonData={vectorsScalarsLesson} />
      </div>
    </>
  );
};

export default LearningHubCleo;
