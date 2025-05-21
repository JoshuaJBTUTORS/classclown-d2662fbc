import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import GoogleCalendarSetup from '@/components/integrations/GoogleCalendarSetup';

const IntegrationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external services to enhance your tutoring platform
        </p>
      </div>

      <GoogleCalendarSetup />
      
      {/* Other future integrations would go here */}
    </div>
  );
};

export default IntegrationsTab;
