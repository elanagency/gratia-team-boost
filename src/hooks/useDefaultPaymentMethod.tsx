
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDefaultPaymentMethod = () => {
  const { data: hasDefaultPaymentMethod, isLoading } = useQuery({
    queryKey: ['default-payment-method'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('spreedly-payment-method', {
        method: 'GET',
      });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return false;
      }

      const paymentMethods = data.paymentMethods || [];
      return paymentMethods.some((method: any) => method.is_default);
    },
  });

  return {
    hasDefaultPaymentMethod: hasDefaultPaymentMethod || false,
    isLoading
  };
};
