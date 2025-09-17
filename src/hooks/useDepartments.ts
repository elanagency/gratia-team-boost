import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchCompanyId(): Promise<string | null> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  return profile?.company_id ?? null;
}

async function fetchDepartments(): Promise<string[]> {
  const companyId = await fetchCompanyId();
  if (!companyId) return [];

  // Fetch from the new departments table
  const { data, error } = await supabase
    .from("departments")
    .select("name")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Failed to load departments", error);
    return [];
  }

  return data.map(dept => dept.name);
}

export function useDepartments() {
  const query = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    departments: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
