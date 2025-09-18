import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Users, Calendar, UserCheck, GraduationCap, TrendingUp, MessageSquare } from 'lucide-react';
import { getAdminDashboardData, AdminDashboardData } from '@/services/adminDashboardService';
import { TopicRequestsManager } from '@/components/admin/TopicRequestsManager';
import PageTitle from '@/components/ui/PageTitle';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const loadDashboardData = async (showToast = false) => {
    const loading = showToast ? setIsRefreshing : setIsLoading;
    
    try {
      loading(true);
      const data = await getAdminDashboardData();
      setDashboardData(data);
      
      if (showToast) {
        toast({
          title: "Dashboard Updated",
          description: "Latest metrics have been loaded successfully."
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      loading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <PageTitle title="Admin Dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Admin Dashboard" />
          <p className="text-muted-foreground mt-2">
            Overview of key metrics for {getCurrentMonth()}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topic-requests">
            <MessageSquare className="h-4 w-4 mr-2" />
            Topic Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trial Lessons Booked */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Trial Lessons Booked
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.trialLessonsBooked || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  New trial bookings this month
                </p>
              </CardContent>
            </Card>

            {/* Trial Attendance Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Trial Attendance Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.trialAttendanceRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Students who attended trial lessons
                </p>
              </CardContent>
            </Card>

            {/* Regular Lessons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Regular Lessons
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.regularLessonsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled lessons this month
                </p>
              </CardContent>
            </Card>

            {/* Active Tutors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tutors
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.activeTutorsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active tutors
                </p>
              </CardContent>
            </Card>

            {/* Active Customers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.activeCustomersCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active students
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topic-requests">
          <TopicRequestsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
