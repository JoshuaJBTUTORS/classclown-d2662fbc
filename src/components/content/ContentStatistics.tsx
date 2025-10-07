import { Card } from '@/components/ui/card';
import { Video, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';

interface ContentStatisticsProps {
  stats: {
    totalVideos: number;
    approved: number;
    rejected: number;
    pending: number;
    averageApprovalTime: number;
    activeTutors: number;
    videosThisMonth: number;
  };
}

const ContentStatistics = ({ stats }: ContentStatisticsProps) => {
  const statCards = [
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      icon: Video,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Active Tutors',
      value: stats.activeTutors,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'This Month',
      value: stats.videosThisMonth,
      icon: TrendingUp,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {stats.averageApprovalTime > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Approval Time</p>
              <p className="text-2xl font-bold mt-1">
                {stats.averageApprovalTime.toFixed(1)} hours
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContentStatistics;
