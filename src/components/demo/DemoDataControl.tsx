import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface DemoDataControlProps {
  userRole: string;
}

export const DemoDataControl: React.FC<DemoDataControlProps> = ({ userRole }) => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleCleanupDemoData = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL demo data? This action cannot be undone.')) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-demo-data');
      
      if (error) {
        throw error;
      }

      toast.success('Demo data cleaned up successfully!');
      
      // Refresh the page to update the calendar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error cleaning up demo data:', error);
      toast.error('Failed to clean up demo data. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Only show to admin and owner roles
  if (userRole !== 'admin' && userRole !== 'owner') {
    return null;
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Demo Data Management
        </CardTitle>
        <CardDescription>
          Permanently remove all demonstration data from the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will permanently delete all demo lessons, students, tutors, and related data. 
            This action cannot be undone and will prevent demo lessons from reappearing.
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="destructive" 
          onClick={handleCleanupDemoData}
          disabled={isCleaningUp}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isCleaningUp ? 'Cleaning up demo data...' : 'Permanently Delete All Demo Data'}
        </Button>
      </CardContent>
    </Card>
  );
};