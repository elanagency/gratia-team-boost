
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
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormValues = { fullName: string; companyName: string; email: string };

const SignUpForm = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [signupData, setSignupData] = useState<FormValues | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", companyName: "", email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSendingOtp(true);
    try {
      setSignupData(data);
      const nameParts = data.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: { firstName, lastName, companyName: data.companyName },
        },
      });
      if (error) throw error;

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
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: signupData.email, token: otp, type: 'email',
      });
      if (verifyError) throw verifyError;

      // PartnerStack (non-blocking)
      try {
        if (typeof growsumo !== 'undefined' && growsumo) {
          growsumo.data.name = signupData.fullName;
          growsumo.data.email = signupData.email;
          growsumo.data.customer_key = verifyData.user?.id || signupData.email;
          growsumo.createSignup((error, result) => {
            if (error) console.error("PartnerStack signup tracking error:", error);
          });
        }
      } catch (psError) {
        console.error("PartnerStack error:", psError);
      }

      // Welcome email
      try {
        const firstName = signupData.fullName.split(" ")[0] || signupData.fullName;
        await supabase.functions.invoke('send-welcome-email', {
          body: { email: signupData.email, firstName, companyName: signupData.companyName },
        });
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
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

  useEffect(() => {
    if (otp.length === 6) handleVerifyOtp();
  }, [otp]);

  const inputClass = "bg-white border-gray-300 text-gray-900 h-12 placeholder:text-gray-400";
  const labelClass = "text-gray-700 uppercase text-xs font-semibold tracking-wider";
  const otpSlotClass = "bg-white border-gray-300 text-gray-900 h-14 w-12 text-lg";

  return (
    <div className="mt-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isOtpSent ? "Check your email" : "Create your account"}
        </h1>
        {isOtpSent && (
          <p className="text-gray-500 text-lg">
            We sent a 6-digit code to {signupData?.email}
          </p>
        )}
      </div>

      {!isOtpSent ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Company Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <Button
              type="submit"
              className="w-full h-12 text-base rounded-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] hover:opacity-90 text-white shadow-lg"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? "Sending Code..." : "Continue"}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mt-6">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-[#F572FF] hover:underline">Terms of Service</Link>{" "}and{" "}
                <Link to="/privacy" className="text-[#F572FF] hover:underline">Privacy Policy</Link>
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")} className="text-[#F572FF] hover:underline font-medium">
                  Log in
                </button>
              </p>
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isVerifying}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <InputOTPSlot key={i} index={i} className={otpSlotClass} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isVerifying && <p className="text-center text-gray-400 text-sm">Verifying your code...</p>}

          <div className="text-center">
            <button type="button" onClick={() => { setIsOtpSent(false); setOtp(""); setSignupData(null); }} className="text-[#F572FF] hover:underline text-sm" disabled={isVerifying}>
              Use a different email
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-[#F572FF] hover:underline font-medium">
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
