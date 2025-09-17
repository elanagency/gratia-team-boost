import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Department {
  id: string;
  name: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDepartmentManagement() {
  const queryClient = useQueryClient();

  // Fetch departments for the current company
  const { data: departments = [], isLoading, refetch } = useQuery({
    queryKey: ["company-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Failed to load departments", error);
        throw error;
      }

      return data as Department[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create department mutation
  const createDepartment = useMutation({
    mutationFn: async (name: string) => {
      // Get current user's company ID
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .single();

      if (!profile?.company_id) throw new Error("Company ID not found");

      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: name.trim(),
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("A department with this name already exists");
        }
        throw error;
      }

      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create department");
    },
  });

  // Update department mutation
  const updateDepartment = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("departments")
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("A department with this name already exists");
        }
        throw error;
      }

      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update department");
    },
  });

  // Delete department mutation (soft delete)
  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      // First, check if any users are assigned to this department
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("department_id", id)
        .eq("is_active", true);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        const userNames = users.map(u => `${u.first_name} ${u.last_name}`).join(", ");
        throw new Error(`Cannot delete department. The following users are still assigned to it: ${userNames}`);
      }

      // Soft delete the department
      const { error } = await supabase
        .from("departments")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete department");
    },
  });

  return {
    departments,
    isLoading,
    refetch,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}