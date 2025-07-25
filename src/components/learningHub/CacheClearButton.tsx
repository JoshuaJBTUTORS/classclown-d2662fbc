import { Button } from '@/components/ui/button';
import { clearCourseCache } from '@/utils/userDataReset';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CacheClearButtonProps {
  courseId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

export const CacheClearButton = ({ courseId, variant = 'outline' }: CacheClearButtonProps) => {
  const { toast } = useToast();

  const handleClearCache = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to clear cache",
          variant: "destructive"
        });
        return;
      }

      await clearCourseCache(user.id, courseId);
      
      toast({
        title: "Cache Cleared",
        description: "Learning path cache has been cleared. Page will reload.",
      });

      // Force page reload to ensure fresh state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleClearCache}
      size="sm"
    >
      Clear Learning Cache
    </Button>
  );
};