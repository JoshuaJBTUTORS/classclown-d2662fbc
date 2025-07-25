import React from 'react';
import { Users, BookOpen, Calendar, DollarSign, Clock } from 'lucide-react';
import DashboardCard from './DashboardCard';

export default function AdminStatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <DashboardCard
        title="Active Students"
        value="128"
        icon={<Users className="h-full w-full" />}
        trend={{ value: "12%", positive: true }}
      />
      <DashboardCard
        title="Active Teachers"
        value="24"
        icon={<Users className="h-full w-full" />}
        trend={{ value: "5%", positive: true }}
      />
      <DashboardCard
        title="Student Hours"
        value="342"
        icon={<Clock className="h-full w-full" />}
        trend={{ value: "18%", positive: true }}
      />
      <DashboardCard
        title="Student Lessons"
        value="156"
        icon={<BookOpen className="h-full w-full" />}
        trend={{ value: "8%", positive: true }}
      />
      <DashboardCard
        title="Monthly Revenue"
        value="£12,452"
        icon={<DollarSign className="h-full w-full" />}
        trend={{ value: "14%", positive: true }}
      />
    </div>
  );
}