import { useState, useEffect } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import { EarningGoalSetter } from '@/components/earnings/EarningGoalSetter';
import { EarningsProgressWheel } from '@/components/earnings/EarningsProgressWheel';
import { EarningsSummaryCards } from '@/components/earnings/EarningsSummaryCards';
import { EarningsDateFilter } from '@/components/earnings/EarningsDateFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTutorEarningsData, setTutorEarningGoal, type EarningsData } from '@/services/earningsService';
import { calculatePaymentDateFromRange, formatPeriodDisplay } from '@/utils/earningsPeriodUtils';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import { subDays } from 'date-fns';

export default function Earnings() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Get current tutor ID
  useEffect(() => {
    const getCurrentTutor = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tutor } = await supabase
          .from('tutors')
          .select('id')
          .eq('email', user.email)
          .single();

        if (tutor) {
          setTutorId(tutor.id);
        }
      } catch (error) {
        console.error('Error getting tutor ID:', error);
      }
    };

    getCurrentTutor();
  }, []);

  // Load earnings data
  const loadEarningsData = async () => {
    if (!tutorId || !dateRange.from || !dateRange.to) return;

    try {
      setIsRefreshing(true);
      const data = await getTutorEarningsData(tutorId, {
        from: dateRange.from,
        to: dateRange.to
      });
      setEarningsData(data);
    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load your earnings data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEarningsData();
  }, [tutorId, dateRange]);

  const handleGoalSet = async (amount: number, goalPeriod: 'weekly' | 'monthly') => {
    if (!tutorId) return;

    try {
      await setTutorEarningGoal(tutorId, amount, goalPeriod);
      await loadEarningsData();
    } catch (error) {
      throw error;
    }
  };

  const handleRefresh = () => {
    loadEarningsData();
  };

  const handleDateRangeChange = (newDateRange: { from: Date | null; to: Date | null }) => {
    setDateRange(newDateRange);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const nextPaymentDate = dateRange.to ? calculatePaymentDateFromRange(dateRange.to) : null;
  const periodDisplay = dateRange.from && dateRange.to 
    ? formatPeriodDisplay(dateRange.from, dateRange.to) 
    : undefined;

  if (isLoading) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="container mx-auto">
              <PageTitle title="Earnings" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-48 bg-muted animate-pulse rounded-lg" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                </div>
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <PageTitle title="Earnings" subtitle="Track your progress towards your earning goals" />
              <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <EarningsDateFilter
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              nextPaymentDate={nextPaymentDate}
              periodDisplay={periodDisplay}
            />

            {!dateRange.from || !dateRange.to ? (
              <Card className="border-dashed">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Select a Date Range
                  </CardTitle>
                  <CardDescription>
                    Choose your start and end dates to view earnings data
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : !earningsData?.goalAmount ? (
              <Card className="border-dashed">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Get Started with Your Earnings Goals
                  </CardTitle>
                  <CardDescription>
                    Set your earning goal to start tracking your progress
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {dateRange.from && dateRange.to && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Goal setter */}
                  <EarningGoalSetter
                    currentGoal={earningsData?.goalAmount ? {
                      amount: earningsData.goalAmount,
                      period: 'monthly'
                    } : undefined}
                    onGoalSet={handleGoalSet}
                    isLoading={isRefreshing}
                  />

                  {/* Summary cards */}
                  {earningsData && (
                    <EarningsSummaryCards
                      currentEarnings={earningsData.currentEarnings}
                      goalAmount={earningsData.goalAmount}
                      completedLessons={earningsData.completedLessons}
                      remainingAmount={earningsData.remainingAmount}
                      periodStart={earningsData.periodStart}
                      periodEnd={earningsData.periodEnd}
                    />
                  )}
                </div>

                {/* Progress wheel */}
                <div className="flex flex-col">
                  {earningsData?.goalAmount ? (
                    <EarningsProgressWheel
                      currentEarnings={earningsData.currentEarnings}
                      goalAmount={earningsData.goalAmount}
                      progressPercentage={earningsData.progressPercentage}
                      className="sticky top-6"
                    />
                  ) : (
                    <Card className="sticky top-6">
                      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <div className="text-lg font-medium text-muted-foreground">
                          Set a goal to see your progress wheel
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
