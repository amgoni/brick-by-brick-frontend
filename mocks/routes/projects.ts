import type {
  IssueSeverity,
  Project,
  ProjectDetail,
  ProjectStatus,
  VariationOrder,
} from "@/lib/api/types";
import { enumParam, HttpError, intParam, type Router } from "../router";
import type { Db, ProjectRecord } from "../seed";
import { lagosDay } from "../time";

const STATUSES = [
  "planning",
  "active",
  "on_hold",
  "completed",
] as const satisfies readonly ProjectStatus[];

const SEVERITY_ORDER: Record<IssueSeverity, number> = { high: 0, medium: 1, low: 2 };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** The project, or a 404 for the whole request. */
function findProject(db: Db, id: string | undefined): ProjectRecord {
  const project = db.projects.find((candidate) => candidate.id === id);
  if (!project) throw new HttpError(404, "not_found", "There's no project with that id.");
  return project;
}

/**
 * What a list sends for each project: the fields every row needs and none
 * that only the project's own page uses. Picked out one by one, so a field
 * added to the record doesn't leak into lists by accident.
 */
function toListItem(project: ProjectRecord): Project {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    type: project.type,
    area: project.area,
    city: project.city,
    client: project.client,
    status: project.status,
    health: project.health,
    stage: project.stage,
    progress: project.progress,
    budget: project.budget,
    spent: project.spent,
    billed: project.billed,
    startDate: project.startDate,
    targetDate: project.targetDate,
    pausedDate: project.pausedDate,
    completedDate: project.completedDate,
    manager: project.manager,
    crew: project.crew,
  };
}

/** The record plus the two figures worked out from elsewhere. */
function toDetail(db: Db, project: ProjectRecord): ProjectDetail {
  const lines = db.budgets[project.id] ?? [];
  const subcontractors = db.teams[project.id]?.subcontractors ?? [];
  const subcontract = sum(subcontractors.map((subcontractor) => subcontractor.crewToday));
  return {
    ...project,
    committed: Math.max(project.spent, sum(lines.map((line) => line.committed))),
    crewSplit: project.crew ? { direct: project.crew.onSite - subcontract, subcontract } : null,
  };
}

/**
 * Approving or rejecting is a one-way move out of "pending", so each is its
 * own action (POST …/approve) rather than a PATCH that could set any status.
 * Deciding twice is a 409 Conflict: the request is fine, but the order has
 * moved on since the screen showed it.
 */
function decide(
  db: Db,
  id: string | undefined,
  status: "approved" | "rejected",
  now: Date,
): VariationOrder {
  const order = db.variationOrders.find((candidate) => candidate.id === id);
  if (!order) throw new HttpError(404, "not_found", "There's no variation order with that id.");
  if (order.status !== "pending") {
    throw new HttpError(409, "already_decided", `${order.code} has already been ${order.status}.`);
  }
  order.status = status;
  order.decidedBy = { id: db.currentUser.id, name: db.currentUser.name };
  order.decidedAt = now.toISOString();
  return order;
}

export function registerProjectRoutes(router: Router) {
  router.get("/projects", ({ db, query }) => {
    const status = enumParam(query, "status", STATUSES);
    return db.projects.filter((project) => !status || project.status === status).map(toListItem);
  });

  router.get("/projects/:id", ({ db, params }) => toDetail(db, findProject(db, params.id)));

  router.get("/projects/:id/phases", ({ db, params }) => {
    const project = findProject(db, params.id);
    return db.phases[project.id] ?? [];
  });

  // Open issues, most severe first, then newest.
  router.get("/projects/:id/issues", ({ db, params }) => {
    const project = findProject(db, params.id);
    return [...(db.issues[project.id] ?? [])].sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.raisedAt.localeCompare(a.raisedAt),
    );
  });

  router.get("/projects/:id/budget", ({ db, params }) => {
    const project = findProject(db, params.id);
    return db.budgets[project.id] ?? [];
  });

  router.get("/projects/:id/team", ({ db, params }) => {
    const project = findProject(db, params.id);
    return db.teams[project.id] ?? { members: [], subcontractors: [] };
  });

  // Soonest first. Filters combine: one project's, and/or due within N days.
  router.get("/milestones", ({ db, query, now }) => {
    const projectId = query.get("projectId");
    let milestones = db.milestones.filter(
      (milestone) => !projectId || milestone.project.id === projectId,
    );
    if (query.has("dueWithinDays")) {
      const days = intParam(query, "dueWithinDays", { fallback: 365, min: 1, max: 365 });
      const from = lagosDay(now);
      const to = lagosDay(now, days);
      milestones = milestones.filter(
        (milestone) => milestone.dueDate >= from && milestone.dueDate <= to,
      );
    }
    return milestones.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  });

  // Newest first.
  router.get("/site-reports", ({ db, query }) => {
    const projectId = query.get("projectId");
    const limit = intParam(query, "limit", { fallback: 10, min: 1, max: 50 });
    return db.siteReports
      .filter((report) => !projectId || report.project.id === projectId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, limit);
  });

  // Newest first.
  router.get("/variation-orders", ({ db, query }) => {
    const projectId = query.get("projectId");
    return db.variationOrders
      .filter((order) => !projectId || order.project.id === projectId)
      .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
  });

  router.post("/variation-orders/:id/approve", ({ db, params, now }) =>
    decide(db, params.id, "approved", now),
  );

  router.post("/variation-orders/:id/reject", ({ db, params, now }) =>
    decide(db, params.id, "rejected", now),
  );
}
