
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const IntegrationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external services to enhance your tutoring platform
        </p>
      </div>
      
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle>No integrations available</CardTitle>
          <CardDescription>
            New integrations will be added here in the future.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check back later for new integration options for JB Tutors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsTab;
