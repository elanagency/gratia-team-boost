
import React from "react";

export const LoadingSpinner = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f7f8fa]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#F572FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
};
