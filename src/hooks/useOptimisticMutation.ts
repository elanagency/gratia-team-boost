import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onOptimisticUpdate?: (variables: TVariables) => void;
  onRollback?: (variables: TVariables) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useOptimisticMutation = <TData, TVariables>({
  mutationFn,
  onOptimisticUpdate,
  onRollback,
  onSuccess,
  onError,
  successMessage,
  errorMessage = "Something went wrong. Please try again."
}: OptimisticMutationOptions<TData, TVariables>) => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    
    // Apply optimistic update immediately
    onOptimisticUpdate?.(variables);
    
    try {
      const data = await mutationFn(variables);
      
      // Confirm the optimistic update was successful
      onSuccess?.(data, variables);
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      return data;
    } catch (error) {
      // Rollback optimistic update
      onRollback?.(variables);
      
      const errorObj = error as Error;
      onError?.(errorObj, variables);
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onOptimisticUpdate, onRollback, onSuccess, onError, successMessage, errorMessage]);

  return { mutate, isLoading };
};