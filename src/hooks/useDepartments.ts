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

  const { data, error } = await supabase
    .from("profiles")
    .select("department, is_active")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .not("department", "is", null);

  if (error) {
    console.error("Failed to load departments", error);
    return [];
  }

  const unique = new Set<string>();
  for (const row of data || []) {
    const dep = (row as { department: string | null }).department?.trim();
    if (dep) unique.add(dep);
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
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
