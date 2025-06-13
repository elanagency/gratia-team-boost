
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
      console.log('Fetching payment methods from database...');
      const { data, error } = await supabase
        .from('platform_payment_methods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      console.log('Successfully fetched payment methods:', data);
      return data as PaymentMethod[];
    },
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentData: PaymentMethodForm) => {
      console.log('Adding payment method...');
      const { data, error } = await supabase.functions.invoke('add-payment-method', {
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
      
      // If setting as default, first unset all other defaults
      if (isDefault) {
        await supabase
          .from('platform_payment_methods')
          .update({ is_default: false })
          .eq('status', 'active')
          .neq('id', id);
      }

      // Update the payment method's default status
      const { error } = await supabase
        .from('platform_payment_methods')
        .update({ is_default: isDefault, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating payment method:', error);
        throw error;
      }

      console.log('Successfully updated payment method');
      return { success: true };
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
      console.log('=== STARTING PAYMENT METHOD REMOVAL ===');
      console.log('Payment Method ID:', paymentMethodId);
      
      try {
        console.log('About to call remove-payment-method function...');
        
        const { data, error } = await supabase.functions.invoke('remove-payment-method', {
          body: { id: paymentMethodId },
        });

        console.log('Raw response data:', data);
        console.log('Raw response error:', error);

        if (error) {
          console.error('=== SUPABASE FUNCTION ERROR ===');
          console.error('Error object:', error);
          throw new Error(`Edge Function error: ${error.message || 'Unknown error'}`);
        }

        console.log('=== SUCCESSFUL RESPONSE ===');
        console.log('Response data:', data);
        return data;
      } catch (error) {
        console.error('=== CAUGHT ERROR IN MUTATION ===');
        console.error('Error:', error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to remove payment method: ${errorMessage}`);
      }
    },
    onSuccess: (data) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Success data:', data);
      queryClient.invalidateQueries({ queryKey: ['platform-payment-methods'] });
      toast.success('Payment method removed successfully');
    },
    onError: (error: any) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Error in onError:', error);
      toast.error(`Failed to remove payment method: ${error?.message || 'Unknown error'}`);
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
