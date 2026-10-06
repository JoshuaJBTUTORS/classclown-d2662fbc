import React from 'react';
import ReactDOM from 'react-dom/client';
import AssessmentWeekBanner from '@/components/calendar/AssessmentWeekBanner';
import '@/index.css';

function Main() {
  return (
    <div className="min-h-screen bg-background p-8">
      <AssessmentWeekBanner />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
