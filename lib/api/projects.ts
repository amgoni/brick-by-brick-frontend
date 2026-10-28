import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type {
  BudgetLine,
  Decision,
  Milestone,
  Project,
  ProjectDetail,
  ProjectIssue,
  ProjectPhase,
  ProjectStatus,
  ProjectTeam,
  SiteReport,
  VariationOrder,
} from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

export interface ListProjectsParams {
  status?: ProjectStatus;
}

/** GET /projects?status= */
export function listProjects(params: ListProjectsParams = {}, options?: Options) {
  return apiFetch<Project[]>("/projects", { ...options, query: { ...params } });
}

/** GET /projects/:id → 404 if there's no such project. */
export function getProject(id: string, options?: Options) {
  return apiFetch<ProjectDetail>(`/projects/${encodeURIComponent(id)}`, options);
}

/** GET /projects/:id/phases: in programme order. */
export function listProjectPhases(id: string, options?: Options) {
  return apiFetch<ProjectPhase[]>(`/projects/${encodeURIComponent(id)}/phases`, options);
}

/** GET /projects/:id/issues: open ones, most severe first. */
export function listProjectIssues(id: string, options?: Options) {
  return apiFetch<ProjectIssue[]>(`/projects/${encodeURIComponent(id)}/issues`, options);
}

/** GET /projects/:id/budget: by cost code. */
export function getProjectBudget(id: string, options?: Options) {
  return apiFetch<BudgetLine[]>(`/projects/${encodeURIComponent(id)}/budget`, options);
}

/** GET /projects/:id/team */
export function getProjectTeam(id: string, options?: Options) {
  return apiFetch<ProjectTeam>(`/projects/${encodeURIComponent(id)}/team`, options);
}

export interface ListMilestonesParams {
  projectId?: string;
  /** Only milestones due within this many days from today. */
  dueWithinDays?: number;
}

/** GET /milestones?projectId=&dueWithinDays= : soonest first. */
export function listMilestones(params: ListMilestonesParams = {}, options?: Options) {
  return apiFetch<Milestone[]>("/milestones", { ...options, query: { ...params } });
}

export interface ListSiteReportsParams {
  projectId?: string;
  limit?: number;
}

/** GET /site-reports?projectId=&limit= : newest first. */
export function listSiteReports(params: ListSiteReportsParams = {}, options?: Options) {
  return apiFetch<SiteReport[]>("/site-reports", { ...options, query: { ...params } });
}

export interface ListVariationOrdersParams {
  projectId?: string;
}

/** GET /variation-orders?projectId= : newest first. */
export function listVariationOrders(params: ListVariationOrdersParams = {}, options?: Options) {
  return apiFetch<VariationOrder[]>("/variation-orders", { ...options, query: { ...params } });
}

/**
 * POST /variation-orders/:id/approve (or /reject) → the updated order.
 * 409 if someone decided it first.
 */
export function decideVariationOrder(id: string, decision: Decision) {
  return apiFetch<VariationOrder>(`/variation-orders/${encodeURIComponent(id)}/${decision}`, {
    method: "POST",
  });
}
