
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCompanyInfo = (userId: string | undefined) => {
  const [companyName, setCompanyName] = useState<string>("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!userId) {
        setIsLoading(false);
        setError("User ID is not available");
        setCompanyId(null);
        setCompanyName("");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching company info for user:", userId);
        
        // Fetch company member info first
        const {
          data: companyMember, error: memberError
        } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (memberError) {
          console.error("Error fetching company member:", memberError);
          setError("Failed to fetch company membership");
          setCompanyId(null);
          throw memberError;
        }
        
        console.log("Company member query result:", companyMember);
        
        if (companyMember?.company_id) {
          console.log("Found company membership, ID:", companyMember.company_id);
          setCompanyId(companyMember.company_id);
          
          // Now fetch company details
          const {
            data: company, error: companyError
          } = await supabase
            .from('companies')
            .select('name')
            .eq('id', companyMember.company_id)
            .maybeSingle();
          
          if (companyError) {
            console.error("Error fetching company:", companyError);
            setError("Failed to fetch company details");
            throw companyError;
          }
          
          console.log("Company query result:", company);
          
          if (company?.name) {
            console.log("Found company name:", company.name);
            setCompanyName(company.name);
          } else {
            console.log("Company not found for ID:", companyMember.company_id);
            setError(`Company not found for ID: ${companyMember.company_id}`);
          }
        } else {
          console.log("User is not a member of any company");
          setError("User is not a member of any company");
          setCompanyId(null);
          
          // Create a new company for the user if they don't belong to any
          await createDefaultCompanyForUser(userId);
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
        setCompanyId(null);
        setCompanyName("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [userId]);
  
  // New function to create a default company for users who don't have one
  const createDefaultCompanyForUser = async (userId: string) => {
    try {
      console.log("Creating default company for user:", userId);
      
      // Create a new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'My Company',
          handle: `company-${Date.now()}`  // Using timestamp to ensure uniqueness
        })
        .select()
        .single();
        
      if (companyError) {
        console.error("Error creating company:", companyError);
        toast.error("Failed to create default company");
        return;
      }
      
      console.log("Created new company:", newCompany);
      
      // Add user as admin of the new company
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: newCompany.id,
          user_id: userId,
          is_admin: true,
          role: 'admin'
        });
        
      if (memberError) {
        console.error("Error adding user as company admin:", memberError);
        toast.error("Failed to add you as company admin");
        return;
      }
      
      // Update state with new company info
      setCompanyId(newCompany.id);
      setCompanyName(newCompany.name);
      setError(null);
      
      toast.success("Default company created for you");
      
      // Refresh the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error creating default company:", error);
      toast.error("Failed to create default company");
    }
  };

  return {
    companyName,
    companyId,
    isLoading,
    error
  };
};
