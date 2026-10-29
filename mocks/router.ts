import type { ApiErrorBody } from "@/lib/api/types";
import { getDb } from "./db";
import type { Db } from "./seed";

/**
 * A small router with Express's shape, on purpose:
 *
 *   router.get("/projects/:id", ({ params, db }) => …)
 *
 * When we write the real backend in Express, each route here becomes one
 * there, with the same path, the same query parameters and the same response
 * shape. These files are the spec.
 */

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface MockRequest {
  /** Path parameters: `{ id: "prj_lekki" }` for "/projects/:id". */
  params: Record<string, string>;
  query: URLSearchParams;
  /** Parsed JSON body, for anything but GET. */
  body: unknown;
  db: Db;
  now: Date;
}

/**
 * Return a value and it's sent as JSON with a 200. Return nothing and it's an
 * empty 204. Return a Response (see `created`) to choose the status yourself.
 * Throw an HttpError for anything else.
 */
type Handler = (request: MockRequest) => unknown;

/**
 * 201 Created: the new record as JSON, and in the Location header the URL it
 * can be fetched from from now on.
 */
export function created(body: unknown, location: string): Response {
  return Response.json(body, {
    status: 201,
    headers: { Location: `/api${location}`, "Cache-Control": "no-store" },
  });
}

/** A deliberate error response: `throw new HttpError(404, "not_found", "…")`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Rejects the request with a 400 the form can show as it is. */
export function invalid(message: string): never {
  throw new HttpError(400, "validation_failed", message);
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** "2026-10-30", and a real day: not "2026-02-30". */
export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

interface Route {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Latency and failures, so loading and error states get designed now instead
 * of discovered in production. Set in .env.local:
 *   MOCK_LATENCY_MS=400     average delay per request (±50%)
 *   MOCK_FAILURE_RATE=0.2   share of requests that fail with a 503
 */
function simulatedDelay(): Promise<void> {
  const average = Number(process.env.MOCK_LATENCY_MS ?? 400);
  const ms = average * (0.5 + Math.random());
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldFail(): boolean {
  return Math.random() < Number(process.env.MOCK_FAILURE_RATE ?? 0);
}

export function createRouter() {
  const routes: Route[] = [];

  const register = (method: Method) => (path: string, handler: Handler) => {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return "([^/]+)";
    });
    routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
  };

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "") || "/";

    await simulatedDelay();
    if (shouldFail()) {
      return errorResponse(503, "mock_failure", "The server is busy. Try again in a moment.");
    }

    const matches = routes.filter((route) => route.pattern.test(path));
    const route = matches.find((candidate) => candidate.method === request.method);
    if (!route) {
      return matches.length > 0
        ? errorResponse(405, "method_not_allowed", `${request.method} isn't supported on ${path}.`)
        : errorResponse(404, "not_found", `Nothing at ${path}.`);
    }

    const values = route.pattern.exec(path)!.slice(1);
    const params = Object.fromEntries(
      route.keys.map((key, index) => [key, decodeURIComponent(values[index] ?? "")]),
    );
    const body = request.method === "GET" ? undefined : await request.json().catch(() => undefined);
    const now = new Date();

    try {
      const result = await route.handler({
        params,
        query: url.searchParams,
        body,
        db: getDb(now),
        now,
      });
      if (result instanceof Response) return result;
      if (result === undefined) {
        return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
      }
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error.status, error.code, error.message);
      console.error(`[mock api] ${request.method} ${path} failed`, error);
      return errorResponse(500, "internal_error", "Something went wrong on the server.");
    }
  }

  return {
    get: register("GET"),
    post: register("POST"),
    patch: register("PATCH"),
    put: register("PUT"),
    delete: register("DELETE"),
    handle,
  };
}

export type Router = ReturnType<typeof createRouter>;

/**
 * A whole number from the query string, within bounds; a 400 otherwise.
 * Validating input at the edge is the backend's job; the mock does it too so
 * the frontend learns to cope with the rejections.
 */
export function intParam(
  query: URLSearchParams,
  name: string,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number {
  const raw = query.get(name);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(
      400,
      "validation_failed",
      `${name} must be a whole number from ${min} to ${max}.`,
    );
  }
  return value;
}

/** One of a fixed set of strings from the query string; a 400 otherwise. */
export function enumParam<T extends string>(
  query: URLSearchParams,
  name: string,
  allowed: readonly T[],
): T | undefined {
  const raw = query.get(name);
  if (raw === null || raw === "") return undefined;
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new HttpError(400, "validation_failed", `${name} must be one of: ${allowed.join(", ")}.`);
  }
  return raw as T;
}
