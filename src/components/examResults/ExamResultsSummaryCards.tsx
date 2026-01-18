import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileCheck, BookOpen, Clock } from 'lucide-react';
import { ExamSummary } from '@/services/examResultsService';
import { Skeleton } from '@/components/ui/skeleton';

interface ExamResultsSummaryCardsProps {
  summary: ExamSummary | undefined;
  isLoading: boolean;
}

export const ExamResultsSummaryCards: React.FC<ExamResultsSummaryCardsProps> = ({
  summary,
  isLoading
}) => {
  const cards = [
    {
      title: 'Total Students',
      value: summary?.totalStudents || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Exams Completed',
      value: summary?.totalSessions || 0,
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Subjects Covered',
      value: summary?.totalSubjects || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg. Completion Time',
      value: `${summary?.averageCompletionTimeMinutes || 0} min`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
