import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
type FormValues = z.infer<typeof formSchema>;
const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
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
  return <div className="min-h-screen bg-black text-white flex">
      {/* Left sidebar */}
      <div className="hidden lg:block w-[580px] bg-[#1A1A2E] p-12 relative px-[48px]">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="mb-16">
            <img src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png" alt="Grattia Logo" className="h-10 w-auto" />
          </div>
          
          {/* Main sidebar content */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">Sign up and come on in.</h1>
            <p className="text-gray-300 text-lg mb-8">
              Sign up is simple, free and fast. One place to manage everything, and everyone.
            </p>
            
            {/* Feature highlights */}
            <div className="mt-12 space-y-8">
              <div className="flex items-start">
                <div className="bg-[#F572FF]/20 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F572FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Manage teams</h3>
                  <p className="text-gray-400">Everyone in your company, in one place</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-[#F572FF]/20 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F572FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Recognize excellence</h3>
                  <p className="text-gray-400">Reward your team's achievements instantly</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative image/element at the bottom */}
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-60">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#F572FF" d="M37.9,-65.5C47.4,-56.3,52,-42.4,58.9,-29.8C65.8,-17.2,74.9,-5.8,75.7,6.3C76.5,18.4,68.9,31.4,58.7,39.4C48.5,47.5,35.7,50.6,23.5,56.2C11.4,61.8,-0.1,69.8,-12.2,70.7C-24.3,71.6,-37,65.3,-48.9,56.7C-60.8,48.1,-71.9,37.2,-74.5,24.5C-77.2,11.8,-71.4,-2.7,-67.5,-17.7C-63.5,-32.7,-61.4,-48.1,-52.3,-57.3C-43.2,-66.6,-27.1,-69.8,-12.4,-68.6C2.3,-67.5,17,-67,27.5,-65C38,-63,28.4,-74.7,37.9,-65.5Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Right content area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile view only: back button and logo */}
          <div className="lg:hidden">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => navigate("/")} className="inline-flex items-center text-[#F572FF] hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </button>
              
              <img src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png" alt="Grattia Logo" className="h-8 w-auto" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Sign up and come on in
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Sign up is simple, free and fast
            </p>
          </div>
          
          {/* Desktop view header */}
          <div className="hidden lg:block text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to Grattia <span role="img" aria-label="wave">👋</span>
            </h2>
            <p className="mt-2 text-lg text-gray-300">
              Building a culture of appreciation made easy.
            </p>
          </div>
          
          {/* Form */}
          <div className="mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="fullName" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">Full legal name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" {...field} />
                      </FormControl>
                      <p className="text-xs text-gray-400">Full name as it appears on identification document</p>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="companyName" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">Company name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">Company email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@company.com" className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-12" {...field} />
                      </FormControl>
                      <p className="text-xs text-gray-400">For example "you@companyname.com"</p>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="password" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-white">Create password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••••••" className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white pr-10 h-12" {...field} />
                          <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
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
                
                <Button type="submit" className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white h-12 text-base" disabled={isLoading}>
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
                    <button type="button" onClick={() => navigate("/login")} className="text-[#F572FF] hover:underline">
                      Log in
                    </button>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>;
};
export default SignUp;