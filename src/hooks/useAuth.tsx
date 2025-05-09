
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuthSession } from "./useAuthSession";
import { useUserProfile } from "./useUserProfile";
import { useCompanyInfo } from "./useCompanyInfo";

export const useAuth = () => {
  const { user, isLoading: isSessionLoading, handleLogout } = useAuthSession();
  const { firstName, lastName, userName, isLoading: isProfileLoading } = useUserProfile(user?.id);
  const { companyName, companyId, isLoading: isCompanyLoading } = useCompanyInfo(user?.id);
  
  const isLoading = isSessionLoading || isProfileLoading || isCompanyLoading;

  if (isLoading) {
    return { 
      user: null, 
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
