
import React from 'react';
import { Users, BookOpen, Calendar, DollarSign } from 'lucide-react';
import DashboardCard from './DashboardCard';

export default function DashboardMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Students"
        value="128"
        icon={<Users className="h-full w-full" />}
        trend={{ value: "12%", positive: true }}
      />
      <DashboardCard
        title="Active Tutors"
        value="24"
        icon={<Users className="h-full w-full" />}
        trend={{ value: "5%", positive: true }}
      />
      <DashboardCard
        title="Scheduled Sessions"
        value="38"
        icon={<Calendar className="h-full w-full" />}
        trend={{ value: "8%", positive: true }}
      />
      <DashboardCard
        title="Monthly Revenue"
        value="$12,452"
        icon={<DollarSign className="h-full w-full" />}
        trend={{ value: "14%", positive: true }}
      />
    </div>
  );
}
