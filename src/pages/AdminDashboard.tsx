import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Calendar, GraduationCap, TrendingUp, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getAdminDashboardData, AdminDashboardData } from '@/services/adminDashboardService';
import PageTitle from '@/components/ui/PageTitle';
import { UserPasswordReset } from '@/components/admin/UserPasswordReset';
import { VoiceMinutesManager } from '@/components/admin/VoiceMinutesManager';
import { StripeMetricsCard } from '@/components/admin/StripeMetricsCard';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadDashboardData = async (showToast = false, monthDate = selectedMonth) => {
    const loading = showToast ? setIsRefreshing : setIsLoading;

    try {
      loading(true);
      const data = await getAdminDashboardData({
        year: monthDate.getFullYear(),
        month: monthDate.getMonth(),
      });
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
    loadDashboardData(false, selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const getSelectedMonthLabel = () => {
    return selectedMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();

  const goPrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
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
            Overview of key metrics for {getSelectedMonthLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[130px] text-center">
              {getSelectedMonthLabel()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

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

        {/* Weekly Tutoring Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Tutoring Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {dashboardData?.weeklyTutoringHours ?? 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Student-hours this week (Mon-Sun) across {dashboardData?.weeklyLessonCount ?? 0} lessons
            </p>
          </CardContent>
        </Card>



        {/* User Password Management */}
        <UserPasswordReset />

        
        {/* Voice Minutes Management */}
        <VoiceMinutesManager />

        {/* Stripe Metrics */}
        <StripeMetricsCard />

        {/* Revenue Expansion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Expansion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Net revenue retention and per-customer spend growth from Stripe.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/revenue-expansion')}>
              View revenue expansion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;