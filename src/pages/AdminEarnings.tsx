import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAdminEarningsData, setAdminEarningGoal } from '@/services/adminEarningsService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, Target, Users, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AdminEarningsData {
  currentEarnings: number;
  goalAmount: number;
  progressPercentage: number;
  uniqueBookingsCount: number;
  totalBookingsCount: number;
  period: 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
}

const AdminEarnings: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [earningsData, setEarningsData] = useState<AdminEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const loadEarningsData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getAdminEarningsData(user.id, period);
      setEarningsData(data);
      setGoalAmount((data.goalAmount / 100).toString()); // Convert from cents to rands
    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load earnings data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    
    setIsRefreshing(true);
    try {
      const data = await getAdminEarningsData(user.id, period);
      setEarningsData(data);
      toast({
        title: "Refreshed",
        description: "Earnings data has been updated"
      });
    } catch (error) {
      console.error('Error refreshing earnings data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoalSet = async () => {
    if (!user?.id || !goalAmount) return;
    
    const goalInCents = Math.round(parseFloat(goalAmount) * 100);
    
    setIsSettingGoal(true);
    try {
      await setAdminEarningGoal(user.id, goalInCents, period);
      await loadEarningsData(); // Reload data to show updated goal
      toast({
        title: "Goal Updated",
        description: `Your ${period} earning goal has been set to R${goalAmount}`
      });
    } catch (error) {
      console.error('Error setting goal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update earning goal"
      });
    } finally {
      setIsSettingGoal(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly') => {
    setPeriod(newPeriod);
  };

  useEffect(() => {
    loadEarningsData();
  }, [user?.id, period]);

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your Musa trial booking performance</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      <Tabs value={period} onValueChange={handlePeriodChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          {/* Goal Setting Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set {period.charAt(0).toUpperCase() + period.slice(1)} Goal
              </CardTitle>
              <CardDescription>
                Set your earning target for {period === 'weekly' ? 'this week' : 'this month'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="goalAmount">Target Amount (R)</Label>
                <Input
                  id="goalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="Enter target amount"
                />
              </div>
              <Button 
                onClick={handleGoalSet} 
                disabled={isSettingGoal || !goalAmount}
              >
                {isSettingGoal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting...
                  </>
                ) : (
                  'Set Goal'
                )}
              </Button>
            </CardContent>
          </Card>

          {earningsData && (
            <>
              {/* Progress Wheel */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Award className="h-5 w-5" />
                      Progress to Goal
                    </CardTitle>
                    <CardDescription>
                      {format(earningsData.periodStart, 'MMM d')} - {format(earningsData.periodEnd, 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    {/* SVG Progress Circle */}
                    <div className="relative w-48 h-48">
                      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2} // 2 * π * 40
                          strokeDashoffset={251.2 - (251.2 * earningsData.progressPercentage) / 100}
                          className={getProgressColor(earningsData.progressPercentage)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-3xl font-bold ${getProgressColor(earningsData.progressPercentage)}`}>
                          {Math.round(earningsData.progressPercentage)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Complete</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(earningsData.currentEarnings)} / {formatCurrency(earningsData.goalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Earnings / Goal
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unique Bookings</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{earningsData.uniqueBookingsCount}</div>
                      <p className="text-xs text-muted-foreground">
                        Bookings that count towards earnings
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{earningsData.totalBookingsCount}</div>
                      <p className="text-xs text-muted-foreground">
                        All Musa bookings received
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Duplicate Rate</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {earningsData.totalBookingsCount > 0 
                          ? Math.round(((earningsData.totalBookingsCount - earningsData.uniqueBookingsCount) / earningsData.totalBookingsCount) * 100)
                          : 0}%
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {earningsData.totalBookingsCount - earningsData.uniqueBookingsCount}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Duplicate contact bookings
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEarnings;