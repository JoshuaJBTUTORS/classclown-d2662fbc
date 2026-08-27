import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Settings as SettingsIcon, Server, BadgeCheck, Clock3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { AppVersionControl } from '@/components/admin/AppVersionControl';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { cn } from '@/lib/utils';

const tabTriggerClass = cn(
  'flex items-center gap-2 rounded-full px-4 py-2 font-heading text-sm font-bold transition-all duration-200',
  'data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[var(--shadow-soft)]',
  'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
);

const Settings = () => {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="min-h-screen bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">

            {/* Pastel hero band */}
            <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-pastel-lilac px-6 py-6 shadow-[var(--shadow-soft)] sm:px-10 sm:py-7">
              <ScribbleStroke className="pointer-events-none absolute -right-6 -top-10 h-48 w-72 text-foreground/15" />
              <div className="relative space-y-2">
                <span className="font-handwriting text-xl text-pastel-lilac-foreground/80">
                  your account
                </span>
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-pastel-lilac-foreground sm:text-4xl">
                  Account Settings
                </h1>
                <p className="max-w-xl text-sm text-pastel-lilac-foreground/75 sm:text-base">
                  Manage your account information and security preferences.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList
                  className={cn(
                    'inline-flex h-auto w-auto gap-1 rounded-full bg-muted/70 p-1.5 shadow-[var(--shadow-soft)]'
                  )}
                >
                  <TabsTrigger value="profile" className={tabTriggerClass}>
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="security" className={tabTriggerClass}>
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="system" className={tabTriggerClass}>
                      <Server className="h-4 w-4" />
                      System
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="profile">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfileSettings />
                  </motion.div>
                </TabsContent>

                <TabsContent value="security">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SecuritySettings />
                  </motion.div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="system">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AppVersionControl />
                    </motion.div>
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>

            {/* Account Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-[1.5rem] border border-border/60 shadow-[var(--shadow-soft)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pastel-sky text-pastel-sky-foreground">
                      <SettingsIcon className="h-4 w-4" />
                    </span>
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account ID</span>
                      <p className="mt-1 font-mono text-xs text-foreground break-all">{user?.id}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
                      <p className="mt-1 text-foreground">{user?.email}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email Confirmed</span>
                      <p className="mt-2">
                        {user?.email_confirmed_at ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-mint px-3 py-1 text-xs font-bold text-pastel-mint-foreground">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-butter px-3 py-1 text-xs font-bold text-pastel-butter-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account Created</span>
                      <p className="mt-1 text-foreground">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
