import React, { useState } from 'react';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import CreateAdminDialog from '@/components/staff/CreateAdminDialog';
import AdminList from '@/components/staff/AdminList';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleUserPlus: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M9.6 4.3c2.2-.2 3.8 1.2 3.7 3.2-.1 1.9-1.6 3.2-3.6 3.1-2-.1-3.3-1.4-3.2-3.3.1-1.8 1.4-2.9 3.1-3z" />
    <path d="M3.4 19.4c.3-3.3 2.8-5.3 6.1-5.3 1.3 0 2.5.3 3.5.9" />
    <path d="M15.6 17.4c2 .2 3.9.2 5.9 0" />
    <path d="M18.5 14.5c.2 2 .2 3.9 0 5.9" />
  </svg>
);

const Staff: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  return (
    <div className="flex min-h-screen min-w-0 w-full flex-1 bg-background">
      <MobileMenuButton toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-w-0 w-full flex-1 flex-col">
        <main className="flex-1 p-4 md:p-8">
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Staff
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage administrative staff and permissions
              </p>
            </div>

            <div className="mt-8 grid gap-6">
              <AdminList />

              <div className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
                <h2 className="font-heading text-xl font-extrabold text-foreground">
                  Administrative Accounts
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create and manage administrative staff accounts with elevated permissions.
                </p>

                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-butter"
                >
                  <DoodleUserPlus className="h-4 w-4" />
                  Create Admin Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateAdminDialog
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
      />
    </div>
  );
};

export default Staff;
