
import React from "react";
import { Check } from "lucide-react";

const PasswordRequirements = () => {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
      <div className="flex items-center">
        <Check size={16} className="text-green-500 mr-2" />
        <span className="text-gray-300">Lowercase characters</span>
      </div>
      <div className="flex items-center">
        <Check size={16} className="text-green-500 mr-2" />
        <span className="text-gray-300">Uppercase characters</span>
      </div>
      <div className="flex items-center">
        <Check size={16} className="text-green-500 mr-2" />
        <span className="text-gray-300">Numbers</span>
      </div>
      <div className="flex items-center">
        <Check size={16} className="text-green-500 mr-2" />
        <span className="text-gray-300">8 characters minimum</span>
      </div>
    </div>
  );
};

export default PasswordRequirements;
