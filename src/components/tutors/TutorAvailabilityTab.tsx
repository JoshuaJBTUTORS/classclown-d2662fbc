
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tutor } from '@/types/tutor';
import AvailabilityManager from './AvailabilityManager';
import TimeOffRequestForm from './TimeOffRequestForm';
import TimeOffRequestsList from './TimeOffRequestsList';

interface TutorAvailabilityTabProps {
  tutor: Tutor;
  isEditable?: boolean;
  isAdmin?: boolean;
}

const TutorAvailabilityTab: React.FC<TutorAvailabilityTabProps> = ({ 
  tutor, 
  isEditable = true,
  isAdmin = false
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRequestChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
        <TabsTrigger value="time-off">Time Off Requests</TabsTrigger>
      </TabsList>
      
      <TabsContent value="weekly">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Weekly Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityManager tutor={tutor} isEditable={isEditable} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="time-off">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Time Off Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditable && !isAdmin && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Request Time Off</h3>
                <TimeOffRequestForm 
                  tutor={tutor} 
                  onRequestSubmitted={handleRequestChange} 
                />
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-3">Time Off History</h3>
              <TimeOffRequestsList 
                key={refreshKey}
                tutor={tutor} 
                isAdmin={isAdmin}
                onRequestUpdated={handleRequestChange}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TutorAvailabilityTab;
