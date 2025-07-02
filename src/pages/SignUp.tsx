
import React from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SignUp = () => {
  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0F0533' }}>
      <Navbar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <SignUpForm />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SignUp;
