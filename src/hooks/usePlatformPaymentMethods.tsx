
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  spreedly_token: string;
  card_last_four: string;
  card_type: string | null;
  expiry_month: string;
  expiry_year: string;
  cardholder_name: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

interface PaymentMethodForm {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
  isDefault?: boolean;
}

export const usePlatformPaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['platform-payment-methods'],
    queryFn: async () => {
      console.log('Fetching payment methods...');
      const { data, error } = await supabase.functions.invoke('spreedly-payment-method', {
        method: 'GET',
      });

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      console.log('Successfully fetched payment methods:', data);
      return data.paymentMethods as PaymentMethod[];
    },
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentData: PaymentMethodForm) => {
      console.log('Adding payment method...');
      const { data, error } = await supabase.functions.invoke('spreedly-payment-method', {
        method: 'POST',
        body: paymentData,
      });

      if (error) {
        console.error('Error adding payment method:', error);
        throw error;
      }

      console.log('Successfully added payment method');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-payment-methods'] });
      toast.success('Payment method added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to add payment method:', error);
      toast.error('Failed to add payment method');
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      console.log('Updating payment method:', id, 'isDefault:', isDefault);
      const { data, error } = await supabase.functions.invoke('spreedly-payment-method', {
        method: 'PATCH',
        body: { id, isDefault },
      });

      if (error) {
        console.error('Error updating payment method:', error);
        throw error;
      }

      console.log('Successfully updated payment method');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-payment-methods'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update payment method:', error);
      toast.error('Failed to update payment method');
    },
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      console.log('Attempting to remove payment method with ID:', paymentMethodId);
      
      try {
        const { data, error } = await supabase.functions.invoke('spreedly-payment-method', {
          method: 'DELETE',
          body: { id: paymentMethodId },
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        console.log('Successfully removed payment method from server:', data);
        return data;
      } catch (error) {
        console.error('Failed to call remove payment method function:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Payment method removed successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['platform-payment-methods'] });
      toast.success('Payment method removed successfully');
    },
    onError: (error: any) => {
      console.error('Remove payment method mutation failed:', error);
      toast.error(`Failed to remove payment method: ${error.message || 'Unknown error'}`);
    },
  });

  return {
    paymentMethods: paymentMethods || [],
    isLoading,
    addPaymentMethod: addPaymentMethodMutation.mutate,
    updatePaymentMethod: updatePaymentMethodMutation.mutate,
    removePaymentMethod: removePaymentMethodMutation.mutate,
    isAdding: addPaymentMethodMutation.isPending,
    isUpdating: updatePaymentMethodMutation.isPending,
    isRemoving: removePaymentMethodMutation.isPending,
  };
};
