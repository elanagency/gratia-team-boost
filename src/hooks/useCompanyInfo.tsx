
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCompanyInfo = (userId: string | undefined) => {
  const [companyName, setCompanyName] = useState<string>("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
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
          throw memberError;
        }
        
        if (companyMember) {
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
            throw companyError;
          }
          
          if (company) {
            setCompanyName(company.name);
          } else {
            console.log("Company not found for ID:", companyMember.company_id);
          }
        } else {
          console.log("User is not a member of any company");
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
    isLoading
  };
};
