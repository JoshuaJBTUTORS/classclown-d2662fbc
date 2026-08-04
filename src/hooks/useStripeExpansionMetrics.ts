import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ExpansionAccount = 'main' | 'proposal' | 'both';

export interface ExpansionMonth {
  month: string;
  startingRevenue: number;
  expansion: number;
  contraction: number;
  churn: number;
  newRevenue: number;
  totalRevenue: number;
  nrr: number | null;
  grr: number | null;
  customerCount: number;
}

export interface ExpansionMover {
  key: string;
  account: string;
  email: string | null;
  name: string | null;
  previous: number;
  current: number;
  delta: number;
  percentChange: number | null;
  status: 'expansion' | 'contraction' | 'churned' | 'new';
}

export interface ExpansionResponse {
  account: ExpansionAccount;
  months: number;
  currency: string;
  mixedCurrency: boolean;
  series: ExpansionMonth[];
  moverMonth: string;
  movers: ExpansionMover[];
  generatedAt: string;
}

export const useStripeExpansionMetrics = (
  account: ExpansionAccount,
  months: number,
  month?: string,
) => {
  return useQuery({
    queryKey: ['stripe-expansion-metrics', account, months, month ?? 'latest'],
    queryFn: async (): Promise<ExpansionResponse> => {
      const { data, error } = await supabase.functions.invoke('get-stripe-expansion-metrics', {
        body: { account, months, month },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as ExpansionResponse;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
