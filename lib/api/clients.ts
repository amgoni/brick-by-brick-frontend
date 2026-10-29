import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { Client } from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

/** GET /clients: by name. */
export function listClients(options?: Options) {
  return apiFetch<Client[]>("/clients", options);
}
