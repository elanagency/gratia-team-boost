
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AuthHeader from "./AuthHeader";
import PasswordField from "./PasswordField";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters."
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters."
  }),
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters."
  })
});

// Define type explicitly to avoid deep instantiation errors
type FormValues = {
  fullName: string;
  companyName: string;
  email: string;
  password: string;
};

const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
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
            companyName: data.companyName
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
          
          <PasswordField control={form.control} />
          
          <Button 
            type="submit" 
            className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white h-12 text-base" 
            disabled={isLoading}
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
  );
};

export default SignUpForm;
