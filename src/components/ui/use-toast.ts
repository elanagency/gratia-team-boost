
import { useToast as useHookToast, toast as hookToast } from "@/hooks/use-toast";

export const toast = {
  ...hookToast,
  success: (message: string) => {
    hookToast({
      title: "Success",
      description: message,
      variant: "default"
    });
  },
  error: (message: string) => {
    hookToast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }
};

export const useToast = useHookToast;
