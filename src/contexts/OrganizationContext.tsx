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
  currentSubdomain: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);

  // Extract subdomain from the current hostname
  useEffect(() => {
    const hostname = window.location.hostname;
    // Skip for localhost or direct IP access during development
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      setCurrentSubdomain(null);
      return;
    }

    // Extract subdomain from hostname (e.g., 'school' from 'school.example.com')
    const parts = hostname.split('.');
    if (parts.length > 2) {
      setCurrentSubdomain(parts[0]);
    } else {
      setCurrentSubdomain(null);
    }
  }, []);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setOrganization(null);
        return;
      }

      let query = supabase.from('organizations').select('*');
      
      // If profile has organization_id, use that first
      if (profile?.organization_id) {
        query = query.eq('id', profile.organization_id);
      } 
      // If not, but we have a subdomain, try to find by subdomain
      else if (currentSubdomain) {
        query = query.eq('subdomain', currentSubdomain);
      }
      // Otherwise, try to find through user_roles table
      else {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
          
        if (roleData?.organization_id) {
          query = query.eq('id', roleData.organization_id);
        } else {
          setOrganization(null);
          setIsLoading(false);
          return;
        }
      }
      
      const { data, error: fetchError } = await query.single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No organization found - this is fine, just set to null
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

  // Fetch organization when user or subdomain changes
  useEffect(() => {
    fetchOrganization();
  }, [user, profile, currentSubdomain]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  const value = {
    organization,
    isLoading,
    error,
    refreshOrganization,
    currentSubdomain
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
