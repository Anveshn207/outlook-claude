"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, LogIn, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error.message, error.digest ?? "");
  }, [error]);

  const isApiError = error instanceof ApiError;
  const isSessionExpired = isApiError && error.status === 401;
  const referenceId = isApiError ? error.referenceId : undefined;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-foreground">
        {isSessionExpired ? "Session expired" : "Something went wrong"}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isSessionExpired
          ? "Your session has expired. Please log in again to continue."
          : "An unexpected error occurred. Please try again or return to the dashboard."}
      </p>

      {referenceId && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Reference: {referenceId}
        </p>
      )}

      {error.digest && !referenceId && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        {isSessionExpired ? (
          <Button asChild size="sm">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Link>
          </Button>
        ) : (
          <>
            <Button onClick={reset} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
