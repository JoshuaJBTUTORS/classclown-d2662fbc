
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string | null;
  status: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setOrganization(null);
        return;
      }

      // In the single organization model, we'll just fetch the first organization
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No organization found. This is expected for first-time setup.');
          setOrganization(null);
        } else {
          console.error('Error fetching organization:', fetchError);
          setError(new Error(fetchError.message));
        }
      } else {
        setOrganization(data);
      }
    } catch (err) {
      console.error('Error in fetchOrganization:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organization when user changes
  useEffect(() => {
    fetchOrganization();
  }, [user]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  const value = {
    organization,
    isLoading,
    error,
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
