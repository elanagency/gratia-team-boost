import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyRegion {
  id: string;
  company_id: string;
  region_code: string;
  created_at: string;
}

export const useCompanyRegions = (companyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: companyRegions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['company-regions', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_regions')
        .select('*')
        .eq('company_id', companyId)
        .order('region_code');

      if (error) {
        console.error('Error fetching company regions:', error);
        throw error;
      }

      return data as CompanyRegion[];
    },
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const updateRegionsMutation = useMutation({
    mutationFn: async ({ companyId, regionCodes }: { companyId: string; regionCodes: string[] }) => {
      // First, delete all existing regions for this company
      const { error: deleteError } = await supabase
        .from('company_regions')
        .delete()
        .eq('company_id', companyId);

      if (deleteError) {
        console.error('Error deleting existing regions:', deleteError);
        throw deleteError;
      }

      // If no regions to add, we're done
      if (regionCodes.length === 0) {
        return [];
      }

      // Insert new regions
      const regionsToInsert = regionCodes.map(region_code => ({
        company_id: companyId,
        region_code
      }));

      const { data, error: insertError } = await supabase
        .from('company_regions')
        .insert(regionsToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting regions:', insertError);
        throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-regions', companyId] });
      toast.success('Company regions updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating company regions:', error);
      toast.error('Failed to update company regions');
    }
  });

  const addRegionMutation = useMutation({
    mutationFn: async ({ companyId, regionCode }: { companyId: string; regionCode: string }) => {
      const { data, error } = await supabase
        .from('company_regions')
        .insert({ company_id: companyId, region_code: regionCode })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Region already assigned to this company');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-regions', companyId] });
      toast.success('Region added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding region:', error);
      toast.error(error.message || 'Failed to add region');
    }
  });

  const removeRegionMutation = useMutation({
    mutationFn: async ({ companyId, regionCode }: { companyId: string; regionCode: string }) => {
      const { error } = await supabase
        .from('company_regions')
        .delete()
        .eq('company_id', companyId)
        .eq('region_code', regionCode);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-regions', companyId] });
      toast.success('Region removed successfully');
    },
    onError: (error: any) => {
      console.error('Error removing region:', error);
      toast.error('Failed to remove region');
    }
  });

  const regionCodes = companyRegions.map(r => r.region_code);

  return {
    companyRegions,
    regionCodes,
    isLoading,
    error,
    refetch,
    updateRegions: updateRegionsMutation.mutate,
    addRegion: addRegionMutation.mutate,
    removeRegion: removeRegionMutation.mutate,
    isUpdating: updateRegionsMutation.isPending || addRegionMutation.isPending || removeRegionMutation.isPending
  };
};
