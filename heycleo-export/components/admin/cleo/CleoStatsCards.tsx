import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface CleoStatsCardsProps {
  stats: {
    totalUsers: number;
    totalConversations: number;
    totalCompleted: number;
    totalActive: number;
    totalVoiceMinutes: number;
    totalTextMessages: number;
  } | undefined;
  isLoading: boolean;
}

export const CleoStatsCards = ({ stats, isLoading }: CleoStatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">with Cleo activity</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversations</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats?.totalConversations || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalActive || 0} active, {stats?.totalCompleted || 0} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Voice Minutes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats?.totalVoiceMinutes || 0}</div>
          <p className="text-xs text-muted-foreground">total voice time used</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Messages</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats?.totalTextMessages || 0}</div>
          <p className="text-xs text-muted-foreground">text messages exchanged</p>
        </CardContent>
      </Card>
    </div>
  );
};
