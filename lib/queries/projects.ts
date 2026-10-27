import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  decideVariationOrder,
  getProject,
  getProjectBudget,
  getProjectTeam,
  listMilestones,
  listProjectIssues,
  listProjectPhases,
  listProjects,
  listSiteReports,
  listVariationOrders,
  type ListMilestonesParams,
  type ListProjectsParams,
  type ListSiteReportsParams,
  type ListVariationOrdersParams,
  type VariationOrderDecision,
} from "@/lib/api/projects";
import type { VariationOrder } from "@/lib/api/types";
import { dashboardQueries } from "@/lib/queries/dashboard";

/**
 * Keys nest, so one call can invalidate a whole family:
 *
 *   ["projects", "list", { status: "active" }]     one filtered list
 *   ["projects", "detail", "prj_lekki"]            one project
 *   ["projects", "detail", "prj_lekki", "budget"]  …and what hangs off it
 *
 * `invalidateQueries({ queryKey: ["projects", "detail", id] })` refreshes a
 * project and everything under it; `["projects"]` refreshes the lot.
 */
export const projectQueries = {
  all: () => ["projects"] as const,
  list: (params: ListProjectsParams = {}) =>
    queryOptions({
      queryKey: [...projectQueries.all(), "list", params],
      queryFn: ({ signal }) => listProjects(params, { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.all(), "detail", id],
      queryFn: ({ signal }) => getProject(id, { signal }),
    }),
  phases: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, "phases"],
      queryFn: ({ signal }) => listProjectPhases(id, { signal }),
    }),
  issues: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, "issues"],
      queryFn: ({ signal }) => listProjectIssues(id, { signal }),
    }),
  budget: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, "budget"],
      queryFn: ({ signal }) => getProjectBudget(id, { signal }),
    }),
  team: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, "team"],
      queryFn: ({ signal }) => getProjectTeam(id, { signal }),
    }),
  milestones: (params: ListMilestonesParams = {}) =>
    queryOptions({
      queryKey: [...projectQueries.all(), "milestones", params],
      queryFn: ({ signal }) => listMilestones(params, { signal }),
    }),
  siteReports: (params: ListSiteReportsParams = {}) =>
    queryOptions({
      queryKey: [...projectQueries.all(), "site-reports", params],
      queryFn: ({ signal }) => listSiteReports(params, { signal }),
    }),
  /** Every variation-order list, whatever its filter. */
  variationOrderLists: () => [...projectQueries.all(), "variation-orders"] as const,
  variationOrders: (params: ListVariationOrdersParams = {}) =>
    queryOptions({
      queryKey: [...projectQueries.variationOrderLists(), params],
      queryFn: ({ signal }) => listVariationOrders(params, { signal }),
    }),
};

export const useProjects = (params?: ListProjectsParams) =>
  useSuspenseQuery(projectQueries.list(params));

export const useProject = (id: string) => useSuspenseQuery(projectQueries.detail(id));

export const useProjectPhases = (id: string) => useSuspenseQuery(projectQueries.phases(id));

export const useProjectIssues = (id: string) => useSuspenseQuery(projectQueries.issues(id));

export const useProjectBudget = (id: string) => useSuspenseQuery(projectQueries.budget(id));

export const useProjectTeam = (id: string) => useSuspenseQuery(projectQueries.team(id));

export const useMilestones = (params?: ListMilestonesParams) =>
  useSuspenseQuery(projectQueries.milestones(params));

export const useSiteReports = (params?: ListSiteReportsParams) =>
  useSuspenseQuery(projectQueries.siteReports(params));

export const useVariationOrders = (params?: ListVariationOrdersParams) =>
  useSuspenseQuery(projectQueries.variationOrders(params));

/**
 * Approve or reject a variation order.
 *
 * Not optimistic, unlike marking notifications read: this commits money, so
 * the screen waits for the server to agree before it says the order is
 * approved. On success the answer goes straight into every cached list that
 * holds the order; then those lists and the dashboard's approval counts are
 * refetched, success or not, so the screen ends up showing what the server has.
 */
export function useDecideVariationOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: VariationOrderDecision }) =>
      decideVariationOrder(id, decision),
    onSuccess: (order) => {
      queryClient.setQueriesData<VariationOrder[]>(
        { queryKey: projectQueries.variationOrderLists() },
        (orders) => orders?.map((candidate) => (candidate.id === order.id ? order : candidate)),
      );
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueries.variationOrderLists() }),
        queryClient.invalidateQueries({ queryKey: dashboardQueries.all() }),
      ]),
  });
}
