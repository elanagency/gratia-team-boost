
import React, { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Control } from "react-hook-form";
import PasswordRequirements from "./PasswordRequirements";

interface PasswordFieldProps {
  control: Control<any>;
}

const PasswordField = ({ control }: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Create password</FormLabel>
          <FormControl>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white pr-10 h-12" 
                {...field}
                onFocus={() => setShowRequirements(true)}
                onChange={(e) => {
                  field.onChange(e);
                  setShowRequirements(true);
                }}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
          <PasswordRequirements password={field.value || ''} isVisible={showRequirements} />
        </FormItem>
      )}
    />
  );
};

export default PasswordField;
