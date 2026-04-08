import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type CompanyValue = {
  id: string;
  company_id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
};

export function useCompanyValues() {
  const { companyId } = useAuth();
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchValues = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_values')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setValues((data as CompanyValue[]) || []);
    } catch (error) {
      console.error("Error fetching company values:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValues();
  }, [companyId]);

  const addValue = async (name: string, color: string) => {
    if (!companyId) return null;
    try {
      const { data, error } = await supabase
        .from('company_values')
        .insert({ company_id: companyId, name, color })
        .select()
        .single();

      if (error) throw error;
      const newValue = data as CompanyValue;
      setValues(prev => [...prev, newValue]);
      toast.success(`Added "${name}" as a company value`);
      return newValue;
    } catch (error) {
      console.error("Error adding company value:", error);
      toast.error("Failed to add company value");
      return null;
    }
  };

  const updateValue = async (id: string, name: string, color: string) => {
    try {
      const { error } = await supabase
        .from('company_values')
        .update({ name, color })
        .eq('id', id);

      if (error) throw error;
      setValues(prev => prev.map(v => v.id === id ? { ...v, name, color } : v));
      toast.success("Company value updated");
    } catch (error) {
      console.error("Error updating company value:", error);
      toast.error("Failed to update company value");
    }
  };

  const deleteValue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_values')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setValues(prev => prev.filter(v => v.id !== id));
      toast.success("Company value removed");
    } catch (error) {
      console.error("Error deleting company value:", error);
      toast.error("Failed to remove company value");
    }
  };

  return { values, isLoading, addValue, updateValue, deleteValue, refetch: fetchValues };
}
