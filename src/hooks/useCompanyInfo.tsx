
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
        // Fetch company name using the security definer function
        const {
          data: companyMember, error: memberError
        } = await supabase.from('company_members').select('company_id').eq('user_id', userId).single();
        
        if (memberError) throw memberError;
        
        if (companyMember) {
          setCompanyId(companyMember.company_id);
          
          const {
            data: company, error: companyError
          } = await supabase.from('companies').select('name').eq('id', companyMember.company_id).single();
          
          if (companyError) throw companyError;
          
          if (company) {
            setCompanyName(company.name);
          }
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
