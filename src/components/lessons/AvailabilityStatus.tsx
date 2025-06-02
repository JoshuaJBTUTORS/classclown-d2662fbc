
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, Loader2, User } from 'lucide-react';
import { AvailabilityCheckResult } from '@/services/availabilityCheckService';

interface AvailabilityStatusProps {
  isChecking: boolean;
  checkResult: AvailabilityCheckResult | null;
  className?: string;
  onSelectAlternativeTutor?: (tutorId: string, tutorName: string) => void;
}

const AvailabilityStatus: React.FC<AvailabilityStatusProps> = ({
  isChecking,
  checkResult,
  className = "",
  onSelectAlternativeTutor
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
        <div className="space-y-3">
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

          {checkResult.hasAlternatives && checkResult.alternativeTutors && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {checkResult.alternativeTutors.length} Alternative Tutor{checkResult.alternativeTutors.length !== 1 ? 's' : ''} Available
                </span>
              </div>
              
              <div className="space-y-2">
                {checkResult.alternativeTutors.slice(0, 3).map((tutor) => (
                  <div key={tutor.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {tutor.first_name} {tutor.last_name}
                        </span>
                        {!tutor.hasConflict && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            No conflicts
                          </Badge>
                        )}
                        {tutor.hasConflict && (
                          <Badge variant="outline" className="text-xs">
                            Has conflicts
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Available: {tutor.availableSlots.join(', ')}
                      </div>
                    </div>
                    
                    {onSelectAlternativeTutor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectAlternativeTutor(tutor.id, `${tutor.first_name} ${tutor.last_name}`)}
                        className="ml-2"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                ))}
                
                {checkResult.alternativeTutors.length > 3 && (
                  <div className="text-xs text-blue-600 mt-2">
                    +{checkResult.alternativeTutors.length - 3} more tutors available
                  </div>
                )}
              </div>
            </div>
          )}

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
