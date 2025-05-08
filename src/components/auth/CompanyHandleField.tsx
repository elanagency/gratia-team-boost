
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { Control } from "react-hook-form";

interface CompanyHandleFieldProps {
  control: Control<any>;
  isCheckingHandle: boolean;
  isHandleAvailable: boolean | null;
}

const CompanyHandleField = ({ 
  control, 
  isCheckingHandle, 
  isHandleAvailable 
}: CompanyHandleFieldProps) => {
  return (
    <FormField
      control={control}
      name="companyHandle"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Company handle</FormLabel>
          <FormControl>
            <div className="relative">
              <Input 
                placeholder="acme" 
                className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white pr-10 h-12" 
                {...field} 
              />
              {isCheckingHandle ? (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : isHandleAvailable === true ? (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500">
                  <Check className="h-5 w-5" />
                </div>
              ) : isHandleAvailable === false ? (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                  <X className="h-5 w-5" />
                </div>
              ) : null}
            </div>
          </FormControl>
          <p className="text-xs text-gray-400">Your team URL: grattia.com/{field.value || 'your-handle'}</p>
          {isHandleAvailable === false && (
            <p className="text-xs text-red-500 mt-1">This handle is already taken</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CompanyHandleField;
