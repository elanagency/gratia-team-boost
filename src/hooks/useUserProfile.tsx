
// This hook is deprecated and replaced by the consolidated AuthContext
// Import from "@/context/AuthContext" instead
import { useAuth } from "@/context/AuthContext";

export const useUserProfile = () => {
  const { firstName, lastName, userName, isLoading } = useAuth();
  return { firstName, lastName, userName, isLoading };
};
