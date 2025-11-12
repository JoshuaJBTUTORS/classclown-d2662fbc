import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReconnectionDialogProps {
  open: boolean;
  onReconnect: () => void;
  onEndSession: () => void;
  attemptCount: number;
  maxAttempts: number;
  isReconnecting: boolean;
}

export const ReconnectionDialog: React.FC<ReconnectionDialogProps> = ({
  open,
  onReconnect,
  onEndSession,
  attemptCount,
  maxAttempts,
  isReconnecting,
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onEndSession()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Connection Lost</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {isReconnecting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4 text-primary" />
                </motion.div>
                <span>
                  Attempting to reconnect... (Attempt {attemptCount} of {maxAttempts})
                </span>
              </div>
            ) : (
              "Your voice session was interrupted. Would you like to reconnect and continue where you left off?"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>✓ Your progress is saved</p>
          <p>✓ Session will resume from where you left off</p>
          <p>✓ No session time was lost during disconnection</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onEndSession}
            disabled={isReconnecting}
            className="w-full sm:w-auto"
          >
            End Session
          </Button>
          <Button
            onClick={onReconnect}
            disabled={isReconnecting || attemptCount >= maxAttempts}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80"
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reconnect Now
              </>
            )}
          </Button>
        </DialogFooter>

        {attemptCount >= maxAttempts && (
          <div className="text-sm text-destructive text-center">
            Maximum reconnection attempts reached. Please end the session and try again later.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
