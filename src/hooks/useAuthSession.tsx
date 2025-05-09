
// This hook is deprecated and replaced by the consolidated AuthContext
// Import from "@/context/AuthContext" instead
import { useAuth } from "@/context/AuthContext";

export const useAuthSession = () => {
  const { user, session, isLoading, signOut } = useAuth();
  return { user, session, isLoading, handleLogout: signOut };
};
