import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, ArrowLeft } from 'lucide-react';
import AddParentOnlyForm from '@/components/parents/AddParentOnlyForm';
import { useAuth } from '@/contexts/AuthContext';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isOwner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parentOnlyOpen, setParentOnlyOpen] = useState(false);

  if (!isAdmin && !isOwner) {
    navigate('/unauthorized');
    return null;
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <PageTitle
            title="Onboarding"
            subtitle="Start a new onboarding flow"
            className="mb-6"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  Parent Only
                </CardTitle>
                <CardDescription>
                  Create a standalone parent account without any students. Students can be added later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setParentOnlyOpen(true)} className="w-full">
                  Start
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AddParentOnlyForm
        isOpen={parentOnlyOpen}
        onClose={() => setParentOnlyOpen(false)}
      />
    </>
  );
};

export default Onboarding;
