import type { ApiErrorBody } from "@/lib/api/types";

/**
 * Where the API lives. "/api" is this app's own origin: today the mock backend
 * answers there (app/api/[...path]/route.ts); later the same path proxies to
 * the Express server, or this points straight at it. Nothing else changes.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

/**
 * A failed request, with what the server said about it.
 *
 * `status` 0 means the request never got a response (offline, DNS, CORS), so
 * there's no HTTP status to report.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** A 4xx: the request itself was wrong, so sending it again won't help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Becomes the query string; null and undefined entries are left out. */
  query?: Record<string, QueryValue>;
  /** Sent as JSON. */
  body?: unknown;
  /** From TanStack Query, so leaving a page cancels its requests. */
  signal?: AbortSignal;
}

function toQueryString(query: ApiRequest["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

/**
 * The one place the app talks HTTP. Every function in lib/api/ goes through
 * here, so the base URL, JSON handling and error shape live in one spot, and
 * authentication will too when it arrives.
 *
 * Resolves with the parsed JSON body, typed as `T`. That type is a promise
 * the server has to keep, not a check: nothing validates the body at runtime
 * yet. Whether to (with zod, say) is a decision for when the backend is real.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", query, body, signal }: ApiRequest = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}${toQueryString(query)}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // A cancelled request isn't a failure; let the caller see the abort as-is.
    if (signal?.aborted) throw error;
    throw new ApiError(
      0,
      "network_error",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null;
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "http_error",
      payload?.error?.message ?? `The server couldn't complete that (${response.status}).`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
