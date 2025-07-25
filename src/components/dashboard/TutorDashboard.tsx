import React from 'react';
import PageTitle from '@/components/ui/PageTitle';
import TutorUpcomingLessons from './TutorUpcomingLessons';
import TutorUncompletedLessons from './TutorUncompletedLessons';
import TutorStatsCards from './TutorStatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

export default function TutorDashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-muted/30">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 space-y-6">
          <PageTitle title="Tutor Dashboard" subtitle="Manage your lessons and track your progress." />
          
          {/* Tutor Stats */}
          <TutorStatsCards />
          
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Lesson</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Clock className="h-6 w-6" />
              <span>Request Time Off</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>View Calendar</span>
            </Button>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TutorUpcomingLessons />
            <TutorUncompletedLessons />
          </div>
          
          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Teaching</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Weekly teaching overview chart</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}