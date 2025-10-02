import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const emailSchema = z.string().email("Invalid email address");

const LoginTest = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, isPlatformAdmin, isAdmin, isAdminLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect based on role
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setIsOtpSent(true);
      toast.success("OTP sent! Check your email for the 6-digit code");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      toast.success("Login successful!");
      // Auth state change will handle redirection based on user role
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0F0533' }}>
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Roboto' }}>
              {!isOtpSent ? "Welcome back" : "Enter your code"}
            </h1>
            <p className="text-gray-300 text-lg">
              {!isOtpSent ? "Sign in with OTP to continue" : `We sent a code to ${email}`}
            </p>
          </div>
          
          <div className="mt-10">
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Work Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? "Sending..." : "Login"}
                </Button>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">
                    Prefer password login?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-[#F572FF] hover:underline"
                    >
                      Sign in with password
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center mb-6">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                        <InputOTPSlot index={1} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                        <InputOTPSlot index={2} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                        <InputOTPSlot index={3} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                        <InputOTPSlot index={4} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                        <InputOTPSlot index={5} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white w-12 h-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Code expires after 60 seconds
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? "Verifying..." : "Verify & Login"}
                </Button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtp("");
                    }}
                    className="text-sm text-[#F572FF] hover:underline"
                  >
                    Use different email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LoginTest;
