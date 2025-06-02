
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { AvailabilityCheckResult } from '@/services/availabilityCheckService';

interface AvailabilityStatusProps {
  isChecking: boolean;
  checkResult: AvailabilityCheckResult | null;
  className?: string;
}

const AvailabilityStatus: React.FC<AvailabilityStatusProps> = ({
  isChecking,
  checkResult,
  className = ""
}) => {
  if (isChecking) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          Checking availability...
        </AlertDescription>
      </Alert>
    );
  }

  if (!checkResult) {
    return null;
  }

  if (checkResult.isAvailable) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Available
            </Badge>
            <span>No conflicts found - time slot is available!</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <XCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              {checkResult.conflicts.length} Conflict{checkResult.conflicts.length !== 1 ? 's' : ''}
            </Badge>
            <span className="font-medium">Scheduling conflicts detected:</span>
          </div>
          
          <ul className="space-y-1 text-sm">
            {checkResult.conflicts.map((conflict, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{conflict.message}</span>
              </li>
            ))}
          </ul>

          {checkResult.suggestions && checkResult.suggestions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-red-200">
              <p className="text-sm font-medium mb-1">Suggestions:</p>
              <ul className="space-y-1 text-sm">
                {checkResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AvailabilityStatus;
