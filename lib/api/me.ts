import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { CurrentUser, Notification, WorkspaceCounts } from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

/** GET /me */
export function getCurrentUser(options?: Options) {
  return apiFetch<CurrentUser>("/me", options);
}

/** GET /me/counts */
export function getWorkspaceCounts(options?: Options) {
  return apiFetch<WorkspaceCounts>("/me/counts", options);
}

/** GET /me/notifications: newest first. */
export function listNotifications(options?: Options) {
  return apiFetch<Notification[]>("/me/notifications", options);
}

/** POST /me/notifications/read-all → 204 */
export function markAllNotificationsRead() {
  return apiFetch<void>("/me/notifications/read-all", { method: "POST" });
}
