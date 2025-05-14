
import { useToast as useHookToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

// Export a correctly typed toast object
export const toast = {
  ...sonnerToast,
  success: (message: string) => {
    sonnerToast.success(message);
  },
  error: (message: string) => {
    sonnerToast.error(message);
  }
};

export const useToast = useHookToast;
