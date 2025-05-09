
// This hook is deprecated and replaced by the consolidated AuthContext
// Import from "@/context/AuthContext" instead
import { useAuth } from "@/context/AuthContext";

export const useCompanyInfo = () => {
  const { companyId, companyName, isLoading } = useAuth();
  return { companyId, companyName, isLoading, error: null };
};
