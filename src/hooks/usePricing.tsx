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
        .single();

      if (error) {
        console.error('Error fetching pricing:', error);
        return 299; // Default fallback
      }

      return data?.value ? parseInt(JSON.parse(data.value.toString())) : 299;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    pricePerMemberCents: pricing || 299,
    pricePerMember: ((pricing || 299) / 100).toFixed(2),
    isLoading,
  };
};