import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, User, GraduationCap, UserCheck, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/contexts/DemoContext';
import { demoAccountService } from '@/services/demoAccountService';
import { useToast } from '@/hooks/use-toast';
import { initializeDemoData } from '@/utils/initializeDemoData';

const DemoLogin: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setDemoMode } = useDemoMode();
  const { toast } = useToast();

  const demoRoles = [
    {
      role: 'owner',
      title: 'Platform Owner',
      description: 'Full access to all features and admin capabilities',
      icon: <Crown className="h-5 w-5" />,
      email: 'demo.owner@jb-tutors.com',
      features: ['Full Admin Access', 'Financial Reports', 'User Management', 'System Settings']
    },
    {
      role: 'admin', 
      title: 'Administrator',
      description: 'Administrative access to manage tutors, students, and lessons',
      icon: <Shield className="h-5 w-5" />,
      email: 'demo.admin@jb-tutors.com',
      features: ['User Management', 'Lesson Scheduling', 'Progress Tracking', 'Reports']
    },
    {
      role: 'tutor',
      title: 'Tutor Account',
      description: 'Tutor perspective with lesson management and student progress',
      icon: <GraduationCap className="h-5 w-5" />,
      email: 'demo.tutor1@jb-tutors.com',
      features: ['Lesson Management', 'Student Progress', 'Homework Assignment', 'Calendar']
    },
    {
      role: 'parent',
      title: 'Parent Account', 
      description: 'Parent portal with child progress and communication',
      icon: <User className="h-5 w-5" />,
      email: 'demo.parent1@email.com',
      features: ['Child Progress', 'Lesson History', 'Communication', 'Booking']
    },
    {
      role: 'student',
      title: 'Student Account',
      description: 'Student learning hub with courses and assessments',
      icon: <UserCheck className="h-5 w-5" />,
      email: 'oliver.brown@student.com',
      features: ['Learning Hub', 'Homework', 'Assessments', 'Progress Tracking']
    }
  ];

  const handleStartDemo = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose a demo account type to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const roleData = demoRoles.find(r => r.role === selectedRole);
      if (!roleData) return;

      // Sign in with demo credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: roleData.email,
        password: 'demo123!', // Standard demo password that matches edge function
      });

      if (authError) {
        console.log('Demo user not found, attempting to create demo users...');
        
        // Try to create demo users first
        toast({
          title: "Setting up demo...",
          description: "Creating demo accounts and data. This may take a moment.",
        });

        const demoInitialized = await initializeDemoData();
        
        if (demoInitialized) {
          // Retry login after creating demo users
          const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
            email: roleData.email,
            password: 'demo123!',
          });

          if (retryAuthError) {
            // If still fails, fall back to local demo mode
            console.log('Demo auth still failed, using local demo mode');
            localStorage.setItem('demo_user_email', roleData.email);
            setDemoMode(true, 'demo-session-' + Date.now());
          } else {
            console.log('Demo auth successful after initialization!');
            localStorage.setItem('demo_user_email', roleData.email);
            setDemoMode(true, 'demo-session-' + Date.now());
          }
          
          toast({
            title: "Demo Mode Activated",
            description: `Signed in as ${roleData.title}`,
          });

          // Navigate based on role
          switch (selectedRole) {
            case 'owner':
            case 'admin':
              navigate('/calendar');
              break;
            case 'tutor':
              navigate('/lessons');
              break;
            case 'parent':
              navigate('/progress');
              break;
            case 'student':
              navigate('/learning-hub');
              break;
            default:
              navigate('/');
          }
        } else {
          throw new Error('Failed to initialize demo data');
        }
      } else {
        // Successfully authenticated
        localStorage.setItem('demo_user_email', roleData.email);
        setDemoMode(true, 'demo-session-' + Date.now());
        
        toast({
          title: "Demo Mode Activated",
          description: `Signed in as ${roleData.title}`,
        });

        // Navigate based on role  
        switch (selectedRole) {
          case 'owner':
          case 'admin':
            navigate('/calendar');
            break;
          case 'tutor':
            navigate('/lessons');
            break;
          case 'parent':
            navigate('/progress');
            break;
          case 'student':
            navigate('/learning-hub');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo Login Failed",
        description: "There was an error starting the demo session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PlayCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Platform Demo</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            Experience our tutoring management platform from different perspectives
          </p>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Demo Environment - No Real Data Affected
          </Badge>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {demoRoles.map((role) => (
            <Card 
              key={role.role}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.role 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole(role.role)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {role.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Demo Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button 
            onClick={handleStartDemo}
            disabled={!selectedRole || isLoading}
            size="lg"
            className="min-w-48"
          >
            {isLoading ? (
              <>Loading Demo...</>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Demo Experience
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/auth')}
              className="text-muted-foreground"
            >
              Back to Regular Login
            </Button>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This demo showcases platform capabilities with pre-populated data.
            <br />
            Demo sessions are temporary and do not affect real accounts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;