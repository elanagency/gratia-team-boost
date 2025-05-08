
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <>
      <button 
        onClick={() => navigate("/")} 
        className="inline-flex items-center text-[#F572FF] hover:underline mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to home
      </button>
      
      <h2 className="text-3xl font-bold text-white mb-2">
        Welcome to Grattia <span role="img" aria-label="wave">👋</span>
      </h2>
      <p className="text-lg text-gray-300">
        Building a culture of appreciation made easy.
      </p>
    </>
  );
};

export default AuthHeader;
