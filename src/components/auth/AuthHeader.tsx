
import React from "react";

const AuthHeader = () => {
  return (
    <div className="text-center">
      <div className="mb-6">
        <img 
          alt="Grattia Logo" 
          className="h-12 w-auto mx-auto mb-4" 
          src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
        />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Roboto' }}>
        Welcome back
      </h1>
      <p className="text-gray-300 text-lg">
        Sign in to your account to continue
      </p>
    </div>
  );
};

export default AuthHeader;
