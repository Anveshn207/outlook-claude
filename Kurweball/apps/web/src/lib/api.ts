const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, string[]> | unknown,
    public referenceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth: _skipAuth = false, headers: customHeaders, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      credentials: "include",
      ...rest,
    });
  } catch (err) {
    console.error("[API] Network error", method, path, err);
    throw new ApiError(
      0,
      "Unable to reach server. Please check your connection.",
    );
  }

  if (response.status === 401) {
    if (typeof window !== "undefined" && !path.startsWith("/auth/")) {
      // Clear local user state and redirect
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let message: string = errorBody;
    let code: string | undefined;
    let details: unknown | undefined;
    let referenceId: string | undefined;

    try {
      const parsed = JSON.parse(errorBody);

      if (parsed.error && typeof parsed.error === "object") {
        const err = parsed.error;
        message = err.message || parsed.message || errorBody;
        code = err.code;
        details = err.details;
        referenceId = err.referenceId;
      } else {
        message = parsed.message || parsed.error || errorBody;
        code = parsed.code;
        details = parsed.details;
        referenceId = parsed.referenceId;
      }
    } catch {
      // Response body was not JSON
    }

    if (response.status >= 500 && referenceId) {
      console.error(
        "[API]",
        response.status,
        method,
        path,
        message,
        `ref=${referenceId}`,
      );
    } else {
      console.error("[API]", response.status, method, path, message);
    }

    throw new ApiError(response.status, message, code, details, referenceId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
