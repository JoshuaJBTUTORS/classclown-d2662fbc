import React from 'react';
import { motion } from 'framer-motion';
import { Accordion } from '@/components/ui/accordion';
import { BadgeCheck, Clock3 } from 'lucide-react';
import {
  DoodleSmiley,
  DoodlePerson,
  DoodleLock,
  DoodleIdCard,
  DoodleServer,
} from '@/components/settings/DoodleIcons';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import ProfileIconSettings from '@/components/settings/ProfileIconSettings';
import SettingsSection from '@/components/settings/SettingsSection';
import { AppVersionControl } from '@/components/admin/AppVersionControl';

const Settings = () => {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="min-h-screen bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 basis-0">
          <div className="w-full space-y-8 px-4 py-8 sm:px-8 lg:px-12">

            {/* Plain header */}
            <header className="w-full border-b border-border/60 pb-6">
              <span className="font-handwriting text-xl text-muted-foreground">your account</span>
              <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Account Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Manage your profile icon, personal information and security preferences.
              </p>
            </header>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Accordion
                type="multiple"
                defaultValue={['icon', 'profile']}
                className="w-full space-y-4"
              >
                <SettingsSection
                  value="icon"
                  title="Profile Icon"
                  description="Choose your initials or a Cleo avatar"
                  icon={<DoodleSmiley />}
                  iconClassName="bg-pastel-butter text-pastel-butter-foreground"
                >
                  <ProfileIconSettings />
                </SettingsSection>

                <SettingsSection
                  value="profile"
                  title="Profile Information"
                  description="Update your personal information and contact details"
                  icon={<DoodlePerson />}
                  iconClassName="bg-pastel-mint text-pastel-mint-foreground"
                >
                  <ProfileSettings />
                </SettingsSection>

                <SettingsSection
                  value="security"
                  title="Security"
                  description="Update your password to keep your account secure"
                  icon={<DoodleLock />}
                  iconClassName="bg-pastel-blush text-pastel-blush-foreground"
                >
                  <SecuritySettings />
                </SettingsSection>

                <SettingsSection
                  value="account"
                  title="Account Information"
                  description="Your account details and current status"
                  icon={<DoodleIdCard />}
                  iconClassName="bg-pastel-sky text-pastel-sky-foreground"
                >
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account ID</span>
                      <p className="mt-1 break-all font-mono text-xs text-foreground">{user?.id}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
                      <p className="mt-1 break-all text-foreground">{user?.email}</p>
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
                </SettingsSection>

                {isAdmin && (
                  <SettingsSection
                    value="system"
                    title="System"
                    description="App version and platform controls"
                    icon={<DoodleServer />}
                    iconClassName="bg-pastel-lilac text-pastel-lilac-foreground"
                  >
                    <AppVersionControl />
                  </SettingsSection>
                )}
              </Accordion>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
