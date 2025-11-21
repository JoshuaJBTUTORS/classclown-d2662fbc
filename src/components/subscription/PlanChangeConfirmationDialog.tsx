import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Plan {
  id: string;
  name: string;
  voice_minutes_per_month: number;
  price_monthly_pence: number;
  price_annual_pence: number;
}

interface PlanChangeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
  newPlan: Plan;
  billingInterval: 'monthly' | 'yearly';
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export function PlanChangeConfirmationDialog({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  billingInterval,
  onConfirm,
  isProcessing
}: PlanChangeConfirmationDialogProps) {
  const getCurrentPrice = () => {
    const price = billingInterval === 'yearly' 
      ? currentPlan.price_annual_pence 
      : currentPlan.price_monthly_pence;
    return (price / 100).toFixed(2);
  };

  const getNewPrice = () => {
    const price = billingInterval === 'yearly' 
      ? newPlan.price_annual_pence 
      : newPlan.price_monthly_pence;
    return (price / 100).toFixed(2);
  };

  const isUpgrade = newPlan.voice_minutes_per_month > currentPlan.voice_minutes_per_month;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Plan Change
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Plan</span>
              <span className="font-semibold">{currentPlan.name} - £{getCurrentPrice()}/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
            </div>
            
            <div className="flex justify-center">
              <span className="text-2xl">↓</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-mint-50 border border-mint-200 rounded-lg">
              <span className="text-sm text-muted-foreground">New Plan</span>
              <span className="font-semibold">{newPlan.name} - £{getNewPrice()}/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>⚠️ Important:</strong> Your card will be charged immediately. 
              {isUpgrade ? ' You will be charged the prorated difference for the remainder of your billing period.' : ' You will receive a prorated credit for the remainder of your billing period.'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
