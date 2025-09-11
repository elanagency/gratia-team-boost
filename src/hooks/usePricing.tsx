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
        // Return default fallback for permission errors or missing data
        return 299; // Default fallback ($2.99)
      }

      return data?.value ? parseInt(JSON.parse(data.value.toString())) : 299;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    pricePerMemberCents: pricing || 299,
    pricePerMember: ((pricing || 299) / 100).toFixed(2),
    isLoading,
  };
};