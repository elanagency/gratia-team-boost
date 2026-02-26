
import React from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import Header from "@/components/Header";
import AuthFooter from "@/components/auth/AuthFooter";

const SignUp = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <SignUpForm />
        </div>
      </div>
      
      <AuthFooter />
    </div>
  );
};

export default SignUp;
