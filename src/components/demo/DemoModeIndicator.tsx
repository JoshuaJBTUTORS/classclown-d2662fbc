import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface DemoModeIndicatorProps {
  className?: string;
  variant?: 'default' | 'prominent';
}

export const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({ 
  className = '',
  variant = 'default' 
}) => {
  if (variant === 'prominent') {
    return (
      <div className={`bg-warning/10 border border-warning/20 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-warning">
            Demo Mode Active
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          You are viewing demonstration data. This does not affect real accounts.
        </p>
      </div>
    );
  }

  return (
    <Badge variant="outline" className={`bg-warning/10 text-warning border-warning/20 ${className}`}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      Demo Mode
    </Badge>
  );
};