
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters."
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters."
  }),
  companyHandle: z.string().min(3, {
    message: "Company handle must be at least 3 characters."
  }).regex(/^[a-z0-9-]+$/, {
    message: "Only lowercase letters, numbers, and hyphens are allowed."
  }),
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters."
  })
});

// Define the type explicitly to avoid deep instantiation errors
type FormValues = {
  fullName: string;
  companyName: string;
  companyHandle: string;
  email: string;
  password: string;
};

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      companyHandle: "",
      email: "",
      password: ""
    }
  });

  const companyHandle = form.watch("companyHandle");
  
  useEffect(() => {
    // Debounce the handle checking
    const timer = setTimeout(async () => {
      if (companyHandle && companyHandle.length >= 3) {
        setIsCheckingHandle(true);
        try {
          // Check if handle exists in companies table
          const { data, error } = await supabase
            .from('companies')
            .select('id')
            .eq('handle', companyHandle)
            .maybeSingle();

          if (error) throw error;
          setIsHandleAvailable(data === null);
        } catch (error) {
          console.error("Error checking handle availability:", error);
          setIsHandleAvailable(null);
        } finally {
          setIsCheckingHandle(false);
        }
      } else {
        setIsHandleAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [companyHandle]);

  const onSubmit = async (data: FormValues) => {
    // Prevent submission if handle is being used
    if (isHandleAvailable === false) {
      toast.error("Company handle is already taken. Please choose another.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = data.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      const {
        data: authData,
        error
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: firstName,
            lastName: lastName,
            companyName: data.companyName,
            companyHandle: data.companyHandle
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Account created successfully!");
      
      // Redirect to admin dashboard after successful signup
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Centered logo */}
      <div className="flex justify-center pt-8 pb-4">
        <img 
          src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png" 
          alt="Grattia Logo" 
          className="h-12 w-auto"
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Back button for mobile */}
          <div>
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
          </div>
          
          {/* Form */}
          <div className="mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Full legal name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Jane Doe" 
                          className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-gray-400">Full name as it appears on identification document</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Company name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Inc." 
                          className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Company email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@company.com" 
                          className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-gray-400">For example "you@companyname.com"</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                    </FormItem>
                  )}
                />
                
                {/* Password requirements */}
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
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white h-12 text-base" 
                  disabled={isLoading || isHandleAvailable === false}
                >
                  {isLoading ? "Creating Account..." : "Sign up for free"}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mt-6">
                    By signing up, you agree to our{" "}
                    <Link to="/terms" className="text-[#F572FF] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-[#F572FF] hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                  
                  <p className="text-sm text-gray-400 mt-4">
                    Already have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => navigate("/login")} 
                      className="text-[#F572FF] hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
