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
import Header from "@/components/Header";
import AuthFooter from "@/components/auth/AuthFooter";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address."
  })
});

type FormValues = z.infer<typeof formSchema>;

const getRedirectUrl = () => {
  const redirectUrl = "https://grattia.com/reset-password";
  console.log("Redirect URL will be:", redirectUrl);
  return redirectUrl;
};

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const redirectUrl = getRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl
      });
      if (error) throw error;
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
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto' }}>Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to your email address. Click the link in the email to reset your password.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full rounded-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] text-white hover:opacity-90"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Roboto' }}>Reset Your Password</h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-semibold tracking-wider text-gray-700">Work Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="bg-white border-gray-300 text-gray-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] text-white hover:opacity-90"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <div className="text-center">
                  <button type="button" onClick={() => navigate("/login")} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default ForgotPassword;
