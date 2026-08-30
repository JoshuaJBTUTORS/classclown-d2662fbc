import { useState, useEffect } from 'react';
import { EarningGoalSetter } from '@/components/earnings/EarningGoalSetter';
import { EarningsProgressWheel } from '@/components/earnings/EarningsProgressWheel';
import { EarningsSummaryCards } from '@/components/earnings/EarningsSummaryCards';
import { EarningsDateFilter } from '@/components/earnings/EarningsDateFilter';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTutorEarningsData, setTutorEarningGoal, type EarningsData } from '@/services/earningsService';
import { calculatePaymentDateFromRange, formatPeriodDisplay, getMonthlyEarningsPeriod } from '@/utils/earningsPeriodUtils';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { DoodleCalendar, DoodleCircle, DoodleSparkle, DoodleTag } from '@/components/calendar/LessonDoodles';


const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-[var(--radius-soft)] border border-foreground/10 bg-pastel-sand/40 ${className}`} />
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <section className="rounded-[var(--radius-soft)] border-2 border-dashed border-foreground/20 bg-pastel-butter/40 p-8 text-center">
    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/70 bg-card text-foreground">
      <DoodleTag className="h-6 w-6" />
    </span>
    <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
      {title}
    </h2>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </section>
);

export default function Earnings() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>(() => {
    const period = getMonthlyEarningsPeriod(new Date());
    return { from: period.start, to: period.end };
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
          .ilike('email', user.email)
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
      <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          <div className="min-w-0 w-full flex-1">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Earnings
                </h1>
                <span className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleSparkle className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <SkeletonCard className="h-48" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <SkeletonCard key={i} className="h-28" />
                    ))}
                  </div>
                </div>
                <SkeletonCard className="h-96" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="min-w-0 w-full flex-1">
          <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Earnings
                  </h1>
                  <span className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                    <DoodleSparkle className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track your progress towards your earning goals
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full rounded-full bg-foreground px-6 text-background hover:bg-foreground/90 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
              <EmptyState
                title="Select a Date Range"
                description="Choose your start and end dates to view earnings data"
              />
            ) : !earningsData?.goalAmount ? (
              <EmptyState
                title="Get Started with Your Earnings Goals"
                description="Set your earning goal to start tracking your progress"
              />
            ) : null}

            {dateRange.from && dateRange.to && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main content area */}
                <div className="space-y-6 lg:col-span-2">
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
                    <section className="sticky top-6 rounded-[var(--radius-soft)] border border-foreground/10 bg-pastel-mint/40 p-8 text-center shadow-[var(--shadow-soft)]">
                      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/70 bg-card text-foreground">
                        <DoodleCircle className="h-6 w-6" />
                      </span>
                      <p className="font-heading text-lg font-bold text-foreground">
                        Set a goal to see your progress wheel
                      </p>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
