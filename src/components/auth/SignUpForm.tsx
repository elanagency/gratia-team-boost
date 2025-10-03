
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters."
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters."
  }),
  email: z.string().email({
    message: "Please enter a valid email address."
  })
});

// Define type explicitly to avoid deep instantiation errors
type FormValues = {
  fullName: string;
  companyName: string;
  email: string;
};

const SignUpForm = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [signupData, setSignupData] = useState<{ fullName: string; companyName: string; email: string } | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSendingOtp(true);
    try {
      setSignupData(data);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        throw error;
      }

      setIsOtpSent(true);
      toast.success("We've sent a 6-digit code to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!signupData || otp.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: signupData.email,
        token: otp,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Split full name into first and last name
      const nameParts = signupData.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          firstName: firstName,
          lastName: lastName,
          companyName: signupData.companyName
        }
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Account created successfully!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handleUseDifferentEmail = () => {
    setIsOtpSent(false);
    setOtp("");
    setSignupData(null);
  };

  return (
    <div className="mt-8">
      {/* Header for Sign Up */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Roboto' }}>
          {isOtpSent ? "Check your email" : "Create your account"}
        </h1>
        <p className="text-gray-300 text-lg">
          {isOtpSent ? `We sent a 6-digit code to ${signupData?.email}` : "Join us and start recognizing your team"}
        </p>
      </div>

      {!isOtpSent ? (
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white h-12 text-base"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? "Sending Code..." : "Continue"}
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
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
                <InputOTPSlot index={1} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
                <InputOTPSlot index={2} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
                <InputOTPSlot index={3} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
                <InputOTPSlot index={4} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
                <InputOTPSlot index={5} className="bg-grattia-purple-dark/40 border-grattia-purple-light/20 text-white h-14 w-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isVerifying && (
            <p className="text-center text-gray-400 text-sm">
              Verifying your code...
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className="text-[#F572FF] hover:underline text-sm"
              disabled={isVerifying}
            >
              Use a different email
            </button>
          </div>

          <div className="text-center">
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
        </div>
      )}
    </div>
  );
};

export default SignUpForm;
