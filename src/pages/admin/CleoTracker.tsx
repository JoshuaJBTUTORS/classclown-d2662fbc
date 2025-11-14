import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { CleoStatsCards } from '@/components/admin/cleo/CleoStatsCards';
import { CleoUserActivityTable } from '@/components/admin/cleo/CleoUserActivityTable';
import { TopicDistributionChart } from '@/components/admin/cleo/TopicDistributionChart';
import { useAdminCleoStats, useCleoUsers } from '@/hooks/useAdminCleoTracker';

const CleoTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminCleoStats();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useCleoUsers({ search: searchTerm });

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Cleo Tracker" />
          <p className="text-muted-foreground mt-2">
            Monitor AI tutoring activity and user engagement
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        <CleoStatsCards stats={stats} isLoading={statsLoading} />

        {stats && stats.mostPopularTopics.length > 0 && (
          <TopicDistributionChart topics={stats.mostPopularTopics} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading user data...
              </div>
            ) : (
              <CleoUserActivityTable
                users={users || []}
                onSearchChange={setSearchTerm}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleoTracker;
