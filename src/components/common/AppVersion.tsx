import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AppVersion = () => {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    const fetchVersion = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_version')
        .single();

      if (data?.value) {
        setVersion(data.value);
        console.log('🚀 App version:', data.value);
      }
    };

    fetchVersion();
  }, []);

  if (!version) return null;

  return (
    <div className="text-xs text-muted-foreground">
      v{version}
    </div>
  );
};
