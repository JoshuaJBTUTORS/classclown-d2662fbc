import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
}

interface AdminSelectorProps {
  availableAdmins: Admin[];
  selectedAdmin?: string;
  onAdminSelect: (adminId: string) => void;
  isLoading?: boolean;
}

const AdminSelector: React.FC<AdminSelectorProps> = ({
  availableAdmins,
  selectedAdmin,
  onAdminSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableAdmins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No admins available</h3>
            <p className="text-gray-500">
              No administrators are available for the selected date and time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Select Admin for Demo Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {availableAdmins.map((admin) => (
            <Button
              key={admin.id}
              variant={selectedAdmin === admin.id ? "default" : "outline"}
              onClick={() => onAdminSelect(admin.id)}
              className={`flex items-center justify-start gap-3 p-4 h-auto ${
                selectedAdmin === admin.id 
                  ? "bg-[#e94b7f] hover:bg-[#d63d6f] text-white" 
                  : "hover:border-[#e94b7f] hover:text-[#e94b7f]"
              }`}
            >
              <User className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">
                  {admin.first_name} {admin.last_name}
                </div>
                <div className="text-sm opacity-75">
                  Demo Session Leader
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSelector;