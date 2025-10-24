import { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';

interface UrgencyPriceDisplayProps {
  price: number;
  createdAt: string;
}

export default function UrgencyPriceDisplay({ price, createdAt }: UrgencyPriceDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const createdTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const deadline = createdTime + twentyFourHours;
      const remaining = deadline - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
      } else {
        setIsExpired(false);
        setTimeRemaining(remaining);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const originalPrice = price * 1.15;

  if (isExpired) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">💰 Price Per Lesson</p>
        <p className="text-2xl font-bold text-primary">£{price.toFixed(2)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">💰 Price Per Lesson</p>
        <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
      </div>
      
      <div className="space-y-1">
        <p className="text-lg text-muted-foreground line-through opacity-60">
          £{originalPrice.toFixed(2)}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-primary">£{price.toFixed(2)}</p>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
            24HR SPECIAL
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mt-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="font-medium text-amber-700 dark:text-amber-400">
          Offer ends in: <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
        </span>
      </div>
    </div>
  );
}
