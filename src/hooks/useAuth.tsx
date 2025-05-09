
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuthSession } from "./useAuthSession";
import { useUserProfile } from "./useUserProfile";
import { useCompanyInfo } from "./useCompanyInfo";
import { toast } from "sonner";

export const useAuth = () => {
  const { user, session, isLoading: isSessionLoading, handleLogout } = useAuthSession();
  const { firstName, lastName, userName, isLoading: isProfileLoading } = useUserProfile(user?.id);
  const { companyName, companyId, isLoading: isCompanyLoading, error: companyError } = useCompanyInfo(user?.id);
  
  const isLoading = isSessionLoading || isProfileLoading || isCompanyLoading;

  // Add debug logging to trace auth state
  useEffect(() => {
    if (user?.id) {
      console.log("Auth state:", { 
        userId: user?.id,
        isAuthenticated: !!session,
        companyId,
        isLoading,
        companyLoading: isCompanyLoading,
        companyError
      });
    }
  }, [user?.id, session, companyId, isLoading, isCompanyLoading, companyError]);

  // Display toast message if there's a company error
  useEffect(() => {
    if (companyError && !isCompanyLoading && user) {
      toast.error(`Company error: ${companyError}`);
      
      // If the user doesn't have a company, they should sign up again or contact support
      if (companyError.includes("not a member of any company")) {
        toast.error("Please contact support to associate your account with a company");
      }
    }
  }, [companyError, isCompanyLoading, user]);

  if (isLoading) {
    return { 
      user: null, 
      session: null,
      companyName: "", 
      companyId: null,
      userName: "", 
      firstName: "", 
      lastName: "", 
      isLoading: true, 
      handleLogout, 
      LoadingComponent: <LoadingSpinner /> 
    };
  }

  return {
    user,
    session,
    companyName,
    companyId,
    userName,
    firstName,
    lastName,
    isLoading,
    handleLogout,
    LoadingComponent: null
  };
};
