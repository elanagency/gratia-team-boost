
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import AuthHeader from "@/components/auth/AuthHeader";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setIsEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0F0533' }}>
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <AuthHeader />
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                <p className="text-gray-300 mb-6">
                  We've sent a password reset link to your email address. Click the link in the email to reset your password.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => setIsEmailSent(false)}
                    variant="outline"
                    className="w-full border-grattia-purple-light/20 text-white hover:bg-grattia-purple-dark/40"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0F0533' }}>
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <AuthHeader />
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
              <p className="text-gray-300">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>
          </div>
          
          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword;
