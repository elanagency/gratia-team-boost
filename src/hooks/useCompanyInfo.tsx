
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
          throw memberError;
        }
        
        if (companyMember?.company_id) {
          console.log("Found company membership:", companyMember);
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
          
          if (company?.name) {
            console.log("Found company:", company.name);
            setCompanyName(company.name);
          } else {
            console.log("Company not found for ID:", companyMember.company_id);
            setError(`Company not found for ID: ${companyMember.company_id}`);
          }
        } else {
          console.log("User is not a member of any company");
          setError("User is not a member of any company");
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
        toast.error("Failed to load company information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [userId]);

  return {
    companyName,
    companyId,
    isLoading,
    error
  };
};
