import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StripeWindow = '7d' | '30d' | '90d' | 'mtd' | 'all';
export type StripeAccount = 'main' | 'proposal' | 'both';

export interface StripeAccountMetrics {
  account: 'main' | 'proposal';
  churnRate: number;
  canceledCount: number;
  activeAtStart: number;
  activeNow: number;
  totalRevenue: number;
  payingCustomers: number;
  arpu: number;
  currency: string;
  topCustomers: Array<{ id: string; email: string | null; name: string | null; totalSpent: number; currency: string }>;
  truncated: boolean;
}

export interface StripeMetricsResponse {
  window: StripeWindow;
  account: StripeAccount;
  results: Array<StripeAccountMetrics | { error: string }>;
  generatedAt: string;
}

export const useStripeAdminMetrics = (account: StripeAccount, window: StripeWindow) => {
  return useQuery({
    queryKey: ['stripe-admin-metrics', account, window],
    queryFn: async (): Promise<StripeMetricsResponse> => {
      const { data, error } = await supabase.functions.invoke('get-stripe-admin-metrics', {
        body: { account, window },
      });
      if (error) throw error;
      return data as StripeMetricsResponse;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
