import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const AdminVoiceMinutes = () => {
  const [email, setEmail] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !minutes || parseInt(minutes) <= 0) {
      toast.error('Please enter a valid email and positive number of minutes');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-add-bonus-minutes', {
        body: {
          email,
          minutes: parseInt(minutes),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`✅ ${data.message}`);
      setEmail('');
      setMinutes('');
    } catch (error: any) {
      console.error('Error adding minutes:', error);
      toast.error(error.message || 'Failed to add bonus minutes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Voice Minutes Management</h1>
        <p className="text-muted-foreground">Add bonus Cleo voice minutes to user accounts</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Add Bonus Minutes</CardTitle>
          <CardDescription>
            Grant additional voice session time to any user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMinutes} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes to Add</Label>
              <Input
                id="minutes"
                type="number"
                placeholder="50"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                'Adding Minutes...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bonus Minutes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVoiceMinutes;
