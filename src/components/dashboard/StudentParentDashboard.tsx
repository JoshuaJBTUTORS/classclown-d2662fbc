import React from 'react';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, Trophy, Users } from 'lucide-react';

export default function StudentParentDashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-muted/30">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 space-y-6">
          <PageTitle title="Student Dashboard" subtitle="Track your learning journey and upcoming lessons." />
          
          {/* Placeholder Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Lessons</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress Score</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Placeholder Content */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Learning Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Dashboard Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're working on creating an amazing dashboard experience for students and parents. 
                  This will include lesson tracking, progress monitoring, homework management, and much more!
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}