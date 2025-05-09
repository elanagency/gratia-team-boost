
import React from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  isVisible: boolean;
}

interface RequirementItemProps {
  isMet: boolean;
  text: string;
}

const RequirementItem = ({ isMet, text }: RequirementItemProps) => (
  <div className="flex items-center">
    {isMet ? (
      <Check size={16} className="text-green-500 mr-2" />
    ) : (
      <X size={16} className="text-gray-500 mr-2" />
    )}
    <span className={`${isMet ? 'text-gray-300' : 'text-gray-500'}`}>{text}</span>
  </div>
);

const PasswordRequirements = ({ password, isVisible }: PasswordRequirementsProps) => {
  // Only show requirements when the component is visible
  if (!isVisible) return null;

  // Check password requirements
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  return (
    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
      <RequirementItem isMet={hasLowerCase} text="Lowercase characters" />
      <RequirementItem isMet={hasUpperCase} text="Uppercase characters" />
      <RequirementItem isMet={hasNumber} text="Numbers" />
      <RequirementItem isMet={hasMinLength} text="8 characters minimum" />
    </div>
  );
};

export default PasswordRequirements;
