"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest ?? "");
  }, [error]);

  const digest = error.digest;

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans antialiased">
        <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            An unexpected error occurred. Please try reloading the page.
          </p>

          {digest && (
            <p className="mt-2 text-xs text-gray-400">
              Error ID: {digest}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Reload
            </button>
            <a
              href="/login"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
