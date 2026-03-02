
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
import Header from "@/components/Header";
import AuthFooter from "@/components/auth/AuthFooter";
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
    if (user && !isAdminLoading) {
      if (isPlatformAdmin) {
        navigate("/platform-admin");
      } else if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard-team");
      }
    }
  }, [user, isPlatformAdmin, isAdmin, isAdminLoading, navigate]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: { shouldCreateUser: false },
      });

      if (error) {
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
        email: userEmail, token: otp, type: 'email',
      });
      if (error) throw error;

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('status').eq('id', authData.user.id).single();
        if (profileError) throw profileError;

        if (profileData?.status === 'deactivated') {
          await supabase.auth.signOut();
          toast.error("Your account has been deactivated. Please contact your administrator.");
          setOtp("");
          setIsVerifying(false);
          return;
        }
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles').select('company_id').eq('id', authData.user.id).single();
        if (profile?.company_id) {
          await supabase.from('login_events').insert({
            user_id: authData.user.id, company_id: profile.company_id,
          });
        }
      }

      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message || "Invalid code. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6 && !isVerifying) handleVerifyOtp();
  }, [otp]);

  const otpSlotClass = "bg-white border-gray-300 text-gray-900";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isOtpSent ? "Check your email" : "Welcome back!"}
            </h1>
            {isOtpSent && (
              <p className="text-gray-500 text-lg">
                Enter the code sent to your email
              </p>
            )}
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
                        <FormLabel className="text-gray-700 uppercase text-xs font-semibold tracking-wider">Work Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="john@example.com" 
                            className="bg-white border-gray-300 text-gray-900 h-12 placeholder:text-gray-400" 
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
                    className="w-full h-12 text-base rounded-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] hover:opacity-90 text-white shadow-lg"
                  >
                    {isSendingOtp ? "Sending code..." : "Continue"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      Don't have an account?{" "}
                      <button type="button" onClick={() => navigate("/signup")} className="text-[#F572FF] hover:underline font-medium">
                        Sign up
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 text-center block uppercase tracking-wider">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} disabled={isVerifying}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <InputOTPSlot key={i} index={i} className={otpSlotClass} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Code sent to {userEmail}
                  </p>
                </div>

                <div className="text-center">
                  <button type="button" onClick={() => { setIsOtpSent(false); setOtp(""); setUserEmail(""); }} className="text-sm text-[#F572FF] hover:underline">
                    Use a different email
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => navigate("/signup")} className="text-[#F572FF] hover:underline font-medium">
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AuthFooter />
    </div>
  );
};

export default Login;
