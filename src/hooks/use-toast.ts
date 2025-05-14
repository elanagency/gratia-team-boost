
import { toast as sonnerToast } from "sonner";

// Export the sonner toast directly
export const toast = sonnerToast;

// No need to import useToast from toast.tsx as sonner doesn't use it
// Instead we'll create a dummy implementation that does nothing
export const useToast = () => {
  return {
    toast: () => {},
    toasts: []
  };
};
