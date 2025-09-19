import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePricing = () => {
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'member_monthly_price_cents')
        .maybeSingle();

      if (error) {
        console.error('Error fetching pricing:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw error;
      }

      if (!data?.value) {
        throw new Error('Pricing configuration not found in platform settings');
      }

      return parseInt(JSON.parse(data.value.toString()));
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    pricePerMemberCents: pricing,
    pricePerMember: pricing ? (pricing / 100).toFixed(2) : undefined,
    isLoading,
  };
};