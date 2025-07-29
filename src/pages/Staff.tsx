import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import CreateAdminDialog from '@/components/staff/CreateAdminDialog';
import AdminList from '@/components/staff/AdminList';

const Staff: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar toggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-6">
          <PageTitle 
            title="Staff Management" 
            subtitle="Manage administrative staff and permissions"
          />
          
          <div className="grid gap-6">
            <AdminList />
            
            <Card>
              <CardHeader>
                <CardTitle>Administrative Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Create and manage administrative staff accounts with elevated permissions.
                  </p>
                  
                  <Button 
                    onClick={() => setIsCreateAdminOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create Admin Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateAdminDialog 
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
      />
    </div>
  );
};

export default Staff;