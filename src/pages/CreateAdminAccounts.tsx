import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, User, Clock } from 'lucide-react';
import { createAdminAccounts } from '@/utils/createAdminAccounts';
import { toast } from 'sonner';

interface AdminResult {
  email: string;
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

const CreateAdminAccounts: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<AdminResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleCreateAccounts = async () => {
    setIsCreating(true);
    setResults([]);
    
    try {
      const response = await createAdminAccounts();
      
      if (response.success) {
        setResults(response.results);
        setHasRun(true);
        
        const successCount = response.results.filter((r: AdminResult) => r.success).length;
        const failCount = response.results.filter((r: AdminResult) => !r.success).length;
        
        if (failCount === 0) {
          toast.success(`Successfully created ${successCount} admin accounts!`);
        } else {
          toast.warning(`Created ${successCount} accounts, ${failCount} failed. Check details below.`);
        }
      } else {
        toast.error('Failed to create admin accounts');
        console.error('Creation failed:', response);
      }
    } catch (error: any) {
      console.error('Error creating admin accounts:', error);
      toast.error(`Error: ${error.message || 'Failed to create admin accounts'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const adminsToCreate = [
    {
      email: 'Joshua@classbeyondacademy.io',
      firstName: 'Joshua',
      lastName: 'Ekundayo',
      availability: '9am - 8pm GMT, Monday to Sunday'
    },
    {
      email: 'Britney@classbeyondacademy.io', 
      firstName: 'Britney',
      lastName: 'Lawrence',
      availability: '9am - 8pm GMT, Monday to Sunday'
    },
    {
      email: 'Musa@classbeyondacademy.io',
      firstName: 'Musa',
      lastName: 'Thulubona', 
      availability: '12pm - 8pm GMT, Monday to Friday'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Admin Accounts</h1>
        <p className="text-muted-foreground">
          Create admin accounts for the JB Tutors platform with their availability schedules.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Accounts to Create
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminsToCreate.map((admin, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{admin.firstName} {admin.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-4">Admin</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{admin.availability}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mb-6">
        <Button 
          onClick={handleCreateAccounts}
          disabled={isCreating}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Admin Accounts...
            </>
          ) : (
            'Create Admin Accounts'
          )}
        </Button>
      </div>

      {hasRun && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Creation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.email}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.success ? result.message : result.error}
                    </p>
                    {result.userId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        User ID: {result.userId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {results.some(r => r.success) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> The admin accounts have been created with temporary passwords (TempPassword123!). 
                  Each admin should reset their password on first login for security.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateAdminAccounts;