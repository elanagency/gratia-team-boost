
// Direct Sonner integration - no legacy hook needed
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

// Dummy useToast for legacy compatibility
export const useToast = () => ({
  toast: () => {},
  toasts: []
});
