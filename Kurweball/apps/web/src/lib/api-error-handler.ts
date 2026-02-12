import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/**
 * Handles API errors by displaying appropriate toast notifications.
 * Can be called from anywhere (inside or outside React components)
 * because it accesses the Zustand store directly via getState().
 */
export function handleApiError(error: unknown): void {
  const { toast } = useToast.getState();

  if (!(error instanceof ApiError)) {
    console.error("[ApiErrorHandler] Non-API error:", error);
    toast({ title: "An unexpected error occurred", variant: "error" });
    return;
  }

  switch (error.status) {
    case 0:
      // Network error
      toast({
        title: "Can't reach server",
        description: "Check your connection and try again.",
        variant: "error",
      });
      break;

    case 401:
      // Already handled by apiFetch redirect, but just in case
      break;

    case 403:
      toast({
        title: "Permission denied",
        description: "You don't have access to perform this action.",
        variant: "error",
      });
      break;

    case 404:
      toast({
        title: "Not found",
        description: error.message,
        variant: "error",
      });
      break;

    case 409:
      toast({
        title: "Conflict",
        description: error.message,
        variant: "warning",
      });
      break;

    case 422:
      // Validation errors — return details for form-level handling, don't toast
      break;

    case 429:
      toast({
        title: "Too many requests",
        description: "Please slow down and try again.",
        variant: "warning",
      });
      break;

    case 500:
    default: {
      const refMsg = error.referenceId
        ? ` Reference: ${error.referenceId}`
        : "";
      toast({
        title: "Something went wrong",
        description: `Please try again later.${refMsg}`,
        variant: "error",
      });
      break;
    }
  }
}

/**
 * Convenience wrapper that executes an async function and
 * automatically handles any errors via toast notifications.
 *
 * Returns the result on success, or undefined if an error occurred.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error);
    return undefined;
  }
}
