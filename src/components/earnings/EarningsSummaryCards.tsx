import { CalendarDays, Clock, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

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
      surface: 'bg-pastel-mint/60'
    },
    {
      title: 'Lessons Completed',
      description: 'In selected period',
      value: completedLessons.toString(),
      icon: Target,
      surface: 'bg-pastel-butter/60'
    },
    {
      title: 'Days Remaining',
      description: remainingAmount > 0 
        ? `£${dailyTargetRemaining.toLocaleString('en-GB', { minimumFractionDigits: 2 })} needed daily`
        : 'Goal achieved!',
      value: daysRemaining.toString(),
      icon: Clock,
      surface: daysRemaining <= 7 ? 'bg-pastel-blush/60' : 'bg-pastel-lilac/50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <section
          key={card.title}
          className={`animate-fade-in rounded-[var(--radius-soft)] border border-foreground/15 p-4 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)] sm:p-5 ${card.surface}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.title}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/70 bg-card text-foreground">
              <card.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground">
            {card.value}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {card.description}
          </p>
        </section>
      ))}
    </div>
  );
};
