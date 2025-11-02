import React from 'react';
import { CleoChat } from '@/components/cleo/CleoChat';
import { Helmet } from 'react-helmet-async';

const LearningHubCleo: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cleo AI Tutor - JB Tutors Learning Hub</title>
        <meta
          name="description"
          content="Learn anything with Cleo, your personal AI tutor. Get personalized lessons adapted to your level."
        />
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] w-full">
        <CleoChat />
      </div>
    </>
  );
};

export default LearningHubCleo;
