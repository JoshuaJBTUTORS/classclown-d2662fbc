import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EarningGoalSetterProps {
  currentGoal?: { amount: number; period: 'weekly' | 'monthly' };
  onGoalSet: (amount: number, period: 'weekly' | 'monthly') => Promise<void>;
  isLoading?: boolean;
}

export const EarningGoalSetter = ({ currentGoal, onGoalSet, isLoading }: EarningGoalSetterProps) => {
  const [amount, setAmount] = useState(currentGoal?.amount?.toString() || '');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>(currentGoal?.period || 'monthly');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalAmount = parseFloat(amount);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid earning goal amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onGoalSet(goalAmount, period);
      toast({
        title: "Goal Set Successfully",
        description: `Your ${period} earning goal of £${goalAmount} has been set.`,
      });
    } catch (error) {
      toast({
        title: "Error Setting Goal",
        description: "Failed to set your earning goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Set Earning Goal
        </CardTitle>
        <CardDescription>
          Set a target amount to track your progress and stay motivated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Target Amount (£)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-6"
                  disabled={isLoading}
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={period} onValueChange={(value: 'weekly' | 'monthly') => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            {currentGoal ? 'Update Goal' : 'Set Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};