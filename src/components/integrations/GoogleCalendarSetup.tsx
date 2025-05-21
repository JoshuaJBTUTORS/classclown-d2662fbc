
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

const GoogleCalendarSetup: React.FC = () => {
  const { toast } = useToast();
  const { organization, refreshOrganization } = useOrganization();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isCreatingTable, setIsCreatingTable] = useState<boolean>(false);

  useEffect(() => {
    if (organization) {
      setIsConnected(!!organization.google_calendar_enabled);
      setCalendarId(organization.google_calendar_id);
      setIsSyncEnabled(!!organization.google_calendar_sync_enabled);
    }
  }, [organization]);

  const createOAuthStatesTable = async () => {
    if (!organization?.id) return;
    
    setIsCreatingTable(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const token = userData.session?.access_token;
      
      if (!token) {
        throw new Error("No auth token available");
      }
      
      const { data, error } = await supabase.functions.invoke('create-oauth-states-table', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (error) throw error;
      console.log("OAuth states table created:", data);
      return true;
    } catch (error) {
      console.error("Error creating OAuth states table:", error);
      toast({
        title: "Error Setting Up Google Calendar",
        description: "Could not create necessary database tables. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleConnect = async () => {
    if (!organization?.id) {
      toast({
        title: "Setup Required",
        description: "Please complete organization setup before connecting Google Calendar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAuthorizing(true);
    
    try {
      // First ensure the OAuth states table exists
      const tableCreated = await createOAuthStatesTable();
      if (!tableCreated) return;
      
      // Get the current user session
      const { data: userData } = await supabase.auth.getUser();
      const token = userData.session?.access_token;
      
      if (!token) {
        throw new Error("No auth token available");
      }
      
      // Call the edge function to start OAuth flow
      const { data, error } = await supabase.functions.invoke('google-oauth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          action: 'authorize',
          organization_id: organization.id
        }
      });
      
      if (error) throw error;
      
      // Redirect to Google OAuth page
      if (data?.url) {
        // Open in a popup window
        const width = 600;
        const height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        
        const popup = window.open(
          data.url,
          'googleOAuthPopup',
          `width=${width},height=${height},top=${top},left=${left}`
        );
        
        // Poll to check if the popup is closed
        const pollInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollInterval);
            setIsAuthorizing(false);
            refreshOrganization();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Calendar. Please try again.",
        variant: "destructive"
      });
      setIsAuthorizing(false);
    }
  };

  const handleToggleSync = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ google_calendar_sync_enabled: !isSyncEnabled })
        .eq('id', organization.id);
      
      if (error) throw error;
      
      setIsSyncEnabled(!isSyncEnabled);
      toast({
        title: `Calendar Sync ${!isSyncEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Automatic calendar sync has been ${!isSyncEnabled ? 'enabled' : 'disabled'}.`
      });
      
      refreshOrganization();
    } catch (error) {
      console.error("Error toggling sync:", error);
      toast({
        title: "Update Failed",
        description: "Could not update calendar sync settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      // Delete the credentials
      const { error: credError } = await supabase
        .from('google_calendar_credentials')
        .delete()
        .eq('organization_id', organization.id);
      
      if (credError) throw credError;
      
      // Update organization settings
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          google_calendar_enabled: false,
          google_calendar_id: null,
          google_calendar_sync_enabled: false
        })
        .eq('id', organization.id);
      
      if (orgError) throw orgError;
      
      // Clear existing Google Calendar data from lessons
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({
          google_event_id: null,
          video_conference_link: null,
          video_conference_provider: null
        })
        .eq('organization_id', organization.id);
      
      if (lessonError) throw lessonError;
      
      setIsConnected(false);
      setCalendarId(null);
      setIsSyncEnabled(false);
      
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar integration has been removed."
      });
      
      refreshOrganization();
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect from Google Calendar.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Integration
            </CardTitle>
            <CardDescription>
              Sync your lessons with Google Calendar and create Google Meet links automatically
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <h4 className="text-sm font-medium">Calendar ID</h4>
                <p className="text-xs text-muted-foreground">{calendarId}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-medium">Automatic Calendar Sync</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically create Google Calendar events for new lessons
                </p>
              </div>
              <Switch 
                checked={isSyncEnabled} 
                onCheckedChange={handleToggleSync}
                disabled={isLoading} 
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Not Connected</h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Connect with Google Calendar to automatically create events and Google Meet links for your lessons.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
            Disconnect Google Calendar
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isAuthorizing || isCreatingTable} className="w-full">
            {isAuthorizing || isCreatingTable ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Connect Google Calendar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoogleCalendarSetup;
