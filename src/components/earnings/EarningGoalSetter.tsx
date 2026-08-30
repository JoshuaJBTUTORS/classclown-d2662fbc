import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { DoodleCircle } from '@/components/calendar/LessonDoodles';
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
    <section className="animate-fade-in rounded-[var(--radius-soft)] bg-pastel-butter/50 p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 bg-card text-foreground">
          <DoodleCircle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Set Earning Goal
          </h2>
          <p className="text-xs text-muted-foreground">
            Set a target amount to track your progress and stay motivated
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target Amount (£)
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-full border-2 border-foreground/10 bg-card pl-7 pr-4 focus-visible:ring-1 focus-visible:ring-foreground/20"
                disabled={isLoading}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="period" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Period
            </Label>
            <Select value={period} onValueChange={(value: 'weekly' | 'monthly') => setPeriod(value)}>
              <SelectTrigger className="h-11 rounded-full border-2 border-foreground/10 bg-card px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[1.25rem] border-2 border-foreground/10 bg-card">
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {currentGoal ? 'Update Goal' : 'Set Goal'}
        </Button>
      </form>
    </section>
  );
};
