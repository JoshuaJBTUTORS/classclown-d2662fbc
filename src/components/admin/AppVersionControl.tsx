import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const AppVersionControl = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: versionData, refetch } = useQuery({
    queryKey: ['app-version'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value, updated_at')
        .eq('key', 'app_version')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0');
    return `${parts[0]}.${parts[1]}.${patch + 1}`;
  };

  const handlePushUpdate = async () => {
    if (!versionData?.value) return;

    setIsUpdating(true);
    try {
      const newVersion = incrementVersion(versionData.value);

      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: newVersion,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'app_version');

      if (error) throw error;

      toast({
        title: "Update pushed",
        description: `All users will reload to version ${newVersion}`,
      });

      refetch();
    } catch (error) {
      console.error('Error pushing update:', error);
      toast({
        title: "Error",
        description: "Failed to push update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Version Control</CardTitle>
        <CardDescription>
          Force all users to refresh and load the latest version of the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Version</p>
            <p className="text-2xl font-bold text-foreground">
              {versionData?.value || '1.0.0'}
            </p>
            {versionData?.updated_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(versionData.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              className="w-full"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pushing Update...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Push Update to All Users
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Push app update?</AlertDialogTitle>
              <AlertDialogDescription>
                This will increment the version to <strong>{versionData?.value ? incrementVersion(versionData.value) : '1.0.1'}</strong> and 
                force all active users to refresh their browser within 2 seconds.
                <br /><br />
                This should be used after deploying code changes to ensure users load the latest version.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePushUpdate}>
                Yes, Push Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 <strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All users monitor the version in real-time</li>
            <li>When you push an update, their apps detect the change</li>
            <li>They see a toast notification and auto-refresh after 2 seconds</li>
            <li>This ensures everyone loads the latest deployed code</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
