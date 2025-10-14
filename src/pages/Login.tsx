
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { user, isPlatformAdmin, isAdmin, isAdminLoading } = useAuth();
  
  useEffect(() => {
    // If user is already logged in, check their role and redirect accordingly
    if (user && !isAdminLoading) {
      console.log("User is already logged in, redirecting based on role");
      
      // Priority: Platform admin > Company admin > Team member
      if (isPlatformAdmin) {
        console.log("Redirecting platform admin to platform dashboard");
        navigate("/platform-admin");
      } else if (isAdmin) {
        console.log("Redirecting company admin to admin dashboard");
        navigate("/dashboard");
      } else {
        console.log("Redirecting team member to team dashboard");
        navigate("/dashboard-team");
      }
    }
  }, [user, isPlatformAdmin, isAdmin, isAdminLoading, navigate]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        // Check if the error is because the user doesn't exist
        if (error.message.includes('Signups not allowed') || error.message.includes('otp_disabled')) {
          toast.error("We can't find an account with this email address");
          setIsSendingOtp(false);
          return;
        }
        throw error;
      }

      setUserEmail(data.email);
      setIsOtpSent(true);
      toast.success("Check your email for the login code!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send login code");
      console.error("OTP send error:", error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otp,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      // Check user status immediately after OTP verification
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error("Error checking user status:", profileError);
          throw profileError;
        }

        // Block deactivated users
        if (profileData?.status === 'deactivated') {
          console.log("Deactivated user attempted to login, signing out");
          await supabase.auth.signOut();
          toast.error("Your account has been deactivated. Please contact your administrator.");
          setOtp("");
          setIsVerifying(false);
          return;
        }
      }

      toast.success("Login successful!");
      // Auth state change will handle redirection based on user role
    } catch (error: any) {
      toast.error(error.message || "Invalid code. Please try again.");
      console.error("OTP verification error:", error);
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0F0533' }}>
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-300 text-lg">
              {isOtpSent ? "Enter the code sent to your email" : "Sign in to your account to continue"}
            </p>
          </div>
          
          <div className="mt-10">
            {!isOtpSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Work Email</FormLabel>
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
                    disabled={isSendingOtp}
                    className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
                  >
                    {isSendingOtp ? "Sending code..." : "Continue"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-400">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/signup")}
                        className="text-[#F572FF] hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white text-center block">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={isVerifying}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                        <InputOTPSlot index={1} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                        <InputOTPSlot index={2} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                        <InputOTPSlot index={3} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                        <InputOTPSlot index={4} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                        <InputOTPSlot index={5} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Code sent to {userEmail}
                  </p>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtp("");
                      setUserEmail("");
                    }}
                    className="text-sm text-[#F572FF] hover:underline"
                  >
                    Use a different email
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="text-[#F572FF] hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
