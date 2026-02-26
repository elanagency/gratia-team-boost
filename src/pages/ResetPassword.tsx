import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import AuthFooter from "@/components/auth/AuthFooter";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long."
  }).regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter."
  }).regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter."
  }).regex(/[0-9]/, {
    message: "Password must contain at least one number."
  }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof formSchema>;

const parseHashParams = (hash: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const hashString = hash.replace(/^#/, '');
  if (!hashString) return params;
  const pairs = hashString.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  useEffect(() => {
    console.log("Current URL:", window.location.href);
    console.log("Hash:", window.location.hash);
    const hashParams = parseHashParams(window.location.hash);
    console.log("Parsed hash params:", hashParams);
    const accessToken = hashParams.access_token;
    const refreshToken = hashParams.refresh_token;
    const type = hashParams.type;

    if (!accessToken || !refreshToken || type !== 'recovery') {
      console.log("Missing required tokens or invalid type");
      setIsValidToken(false);
      toast.error("Invalid or expired password reset link");
      return;
    }

    const setSession = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          console.error("Session error:", error);
          setIsValidToken(false);
          toast.error("Invalid or expired password reset link");
        } else {
          console.log("Session set successfully");
          setIsValidToken(true);
        }
      } catch (error) {
        console.error("Exception setting session:", error);
        setIsValidToken(false);
        toast.error("Invalid or expired password reset link");
      }
    };
    setSession();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const gradientBtnClass = "w-full rounded-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] text-white hover:opacity-90";

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F572FF] mx-auto"></div>
            <p className="mt-4 text-gray-500">Verifying reset link...</p>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto' }}>Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => navigate("/forgot-password")} className={gradientBtnClass}>
              Request New Reset Link
            </Button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Roboto' }}>Set New Password</h2>
            <p className="text-gray-600">Enter your new password below.</p>
          </div>
          
          <div className="mt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-semibold tracking-wider text-gray-700">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="bg-white border-gray-300 text-gray-900 pr-10"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-semibold tracking-wider text-gray-700">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="bg-white border-gray-300 text-gray-900 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading} className={gradientBtnClass}>
                  {isLoading ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default ResetPassword;
