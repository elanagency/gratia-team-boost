
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDefaultPaymentMethod = () => {
  const { data: hasDefaultPaymentMethod, isLoading } = useQuery({
    queryKey: ['default-payment-method'],
    queryFn: async () => {
      console.log('Checking for default payment method in database...');
      
      const { data, error } = await supabase
        .from('platform_payment_methods')
        .select('id')
        .eq('status', 'active')
        .eq('is_default', true)
        .limit(1);

      if (error) {
        console.error('Error fetching default payment method:', error);
        return false;
      }

      const hasDefault = data && data.length > 0;
      console.log('Default payment method found:', hasDefault);
      return hasDefault;
    },
  });

  return {
    hasDefaultPaymentMethod: hasDefaultPaymentMethod || false,
    isLoading
  };
};
