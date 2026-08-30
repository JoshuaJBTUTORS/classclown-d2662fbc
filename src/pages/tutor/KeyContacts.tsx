import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { DoodleSpeech, DoodlePerson } from '@/components/navigation/SidebarDoodles';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyContact {
  name: string;
  role: string;
  email: string;
  availability: string;
  tone: string;
}

const CONTACTS: KeyContact[] = [
  {
    name: 'Hannah Murray',
    role: 'Customer Success Specialist',
    email: 'hannah@classbeyondacademy.io',
    availability: 'Monday to Friday',
    tone: 'bg-pastel-mint',
  },
  {
    name: 'Britney Lawrence',
    role: 'Head of Growth',
    email: 'britney@classbeyondacademy.io',
    availability: 'Monday to Sunday',
    tone: 'bg-pastel-lilac',
  },
  {
    name: 'Joshua Ekundayo',
    role: 'CEO',
    email: 'joshua@classbeyondacademy.io',
    availability: 'Monday to Sunday',
    tone: 'bg-pastel-sky',
  },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const KeyContacts = () => {
  const { isTutor } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  if (!isTutor) {
    return (
      <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          <div className="min-w-0 w-full flex-1">
            <div className="px-4 py-16 text-center sm:px-6">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">Access Denied</h1>
              <p className="mt-2 text-muted-foreground">This page is only accessible to tutors.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="min-w-0 w-full flex-1">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Your Key Contacts
              </h1>
              <span className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                <DoodleSpeech className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-8 space-y-4">
              {CONTACTS.map((contact, index) => (
                <section
                  key={contact.email}
                  className={cn(
                    'rounded-[var(--radius-soft)] border border-foreground/15 p-4 shadow-[var(--shadow-soft)] sm:p-6',
                    contact.tone,
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-foreground/70 bg-card font-heading text-lg font-extrabold text-foreground">
                        {initials(contact.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-foreground/70 bg-card px-2.5 py-0.5 text-xs font-bold text-foreground">
                            Contact {index + 1}
                          </span>
                          <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                            {contact.name}
                          </h2>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold text-foreground">
                            <DoodlePerson className="h-3.5 w-3.5" />
                            {contact.role}
                          </span>
                          <span className="rounded-full bg-card/80 px-3 py-1 text-xs font-semibold text-foreground">
                            Available {contact.availability}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:w-auto"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyContacts;
