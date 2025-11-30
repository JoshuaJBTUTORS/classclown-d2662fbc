
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
  // We'll provide a simplified organization object for backwards compatibility
const defaultOrganization: Organization = {
  id: '1',
  name: 'Class Beyond',
  subdomain: 'classbeyond',
    logo_url: '/class-beyond-logo.png',
    primary_color: '#E91E63',
    status: 'active'
  };

  const refreshOrganization = async () => {
    // No-op function in simplified version
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
