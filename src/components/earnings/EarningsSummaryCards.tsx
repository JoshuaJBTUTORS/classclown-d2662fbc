import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getNextPaymentDate } from '@/utils/earningsPeriodUtils';

interface EarningsSummaryCardsProps {
  currentEarnings: number;
  goalAmount: number;
  completedLessons: number;
  remainingAmount: number;
  periodStart: Date;
  periodEnd: Date;
}

export const EarningsSummaryCards = ({
  currentEarnings,
  goalAmount,
  completedLessons,
  remainingAmount,
  periodStart,
  periodEnd
}: EarningsSummaryCardsProps) => {
  const daysRemaining = Math.max(differenceInDays(periodEnd, new Date()), 0);
  const dailyTargetRemaining = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

  const cards = [
    {
      title: 'Current Period Earnings',
      description: `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`,
      value: `£${currentEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CalendarDays,
      color: 'text-primary'
    },
    {
      title: 'Lessons Completed',
      description: 'In selected period',
      value: completedLessons.toString(),
      icon: Target,
      color: 'text-success'
    },
    {
      title: 'Days Remaining',
      description: remainingAmount > 0 
        ? `£${dailyTargetRemaining.toLocaleString('en-GB', { minimumFractionDigits: 2 })} needed daily`
        : 'Goal achieved!',
      value: daysRemaining.toString(),
      icon: Clock,
      color: daysRemaining <= 7 ? 'text-destructive' : 'text-muted-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={card.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <CardDescription className="text-xs">
              {card.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};