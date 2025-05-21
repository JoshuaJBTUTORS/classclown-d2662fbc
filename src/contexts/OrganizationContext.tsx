
import React, { createContext, useContext } from 'react';
import { Organization } from '@/types/organization';

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We'll provide a simplified organization object to ensure backward compatibility
  const defaultOrganization: Organization = {
    id: '1',
    name: 'JB Tutors',
    subdomain: 'jbtutors',
    logo_url: null,
    primary_color: '#4f46e5',
    status: 'active'
  };

  const refreshOrganization = async () => {
    // This is a no-op function in the simplified version
    console.log('Organization refresh requested (no-op in simplified version)');
  };

  const value = {
    organization: defaultOrganization,
    isLoading: false,
    error: null,
    refreshOrganization
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
