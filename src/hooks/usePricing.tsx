import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePricing = () => {
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('monthly_price_per_team_member_in_cents')
        .eq('key', 'platform_settings')
        .single();

      if (error) {
        console.error('Error fetching pricing:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw error;
      }

      if (!data?.monthly_price_per_team_member_in_cents) {
        throw new Error('Pricing configuration not found in platform settings');
      }

      return data.monthly_price_per_team_member_in_cents;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    pricePerMemberCents: pricing,
    pricePerMember: pricing ? (pricing / 100).toFixed(2) : undefined,
    isLoading,
  };
};