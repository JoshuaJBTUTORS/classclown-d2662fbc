import React from 'react';
import { Users, BookOpen, Clock, Calendar } from 'lucide-react';
import DashboardCard from './DashboardCard';

export default function TutorStatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="My Students"
        value="16"
        icon={<Users className="h-full w-full" />}
        trend={{ value: "2 new", positive: true }}
      />
      <DashboardCard
        title="This Week's Lessons"
        value="12"
        icon={<BookOpen className="h-full w-full" />}
        trend={{ value: "3 pending", positive: false }}
      />
      <DashboardCard
        title="Hours This Month"
        value="48"
        icon={<Clock className="h-full w-full" />}
        trend={{ value: "6 hrs", positive: true }}
      />
      <DashboardCard
        title="Next Lesson"
        value="Today 3pm"
        icon={<Calendar className="h-full w-full" />}
      />
    </div>
  );
}