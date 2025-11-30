import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus } from 'lucide-react';
import { addVoiceMinutes } from '@/services/adminVoiceQuota';

export function VoiceMinutesManager() {
  const [userEmail, setUserEmail] = useState('');
  const [minutesToAdd, setMinutesToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail || !minutesToAdd) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and minutes',
        variant: 'destructive',
      });
      return;
    }

    const minutes = parseInt(minutesToAdd);
    if (isNaN(minutes) || minutes <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Minutes must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await addVoiceMinutes(userEmail, minutes);
      
      toast({
        title: 'Success',
        description: `Added ${minutes} minutes to ${userEmail}`,
      });
      
      // Clear form
      setUserEmail('');
      setMinutesToAdd('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add voice minutes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="md:col-span-2 lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Add Voice Minutes
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddMinutes} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="userEmail" className="text-xs">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={isLoading}
              className="h-8"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="minutes" className="text-xs">Minutes to Add</Label>
            <Input
              id="minutes"
              type="number"
              placeholder="15"
              value={minutesToAdd}
              onChange={(e) => setMinutesToAdd(e.target.value)}
              disabled={isLoading}
              min="1"
              className="h-8"
            />
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full h-8"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Minutes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
