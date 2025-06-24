
import React from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthHeader from "@/components/auth/AuthHeader";
import { Link } from "react-router-dom";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Centered logo */}
      <div className="flex justify-center pt-8 pb-4">
        <Link to="/">
          <img 
            src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png" 
            alt="Grattia Logo" 
            className="h-12 w-auto cursor-pointer"
          />
        </Link>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <AuthHeader />
          <SignUpForm />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
