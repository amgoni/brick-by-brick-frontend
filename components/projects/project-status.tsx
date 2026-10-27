import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  IssueSeverity,
  ISODate,
  MilestoneStatus,
  PhaseStatus,
  Project,
  ProjectStatus,
  ProjectType,
  ScheduleHealth,
  VariationOrderStatus,
} from "@/lib/api/types";
import { daysBetween, formatDate, formatNumber, type DateInput } from "@/lib/format";

/*
 * The projects module's vocabulary: what each state is called on screen and
 * which badge tone it takes. The API sends the states; the words live here.
 */

export interface StatusView {
  label: string;
  tone: BadgeTone;
}

const HEALTH: Record<ScheduleHealth, StatusView> = {
  on_track: { label: "On track", tone: "success" },
  at_risk: { label: "At risk", tone: "warning" },
  delayed: { label: "Delayed", tone: "danger" },
};

const STATUS: Record<Exclude<ProjectStatus, "active">, StatusView> = {
  planning: { label: "Planning", tone: "info" },
  on_hold: { label: "On hold", tone: "neutral" },
  completed: { label: "Completed", tone: "neutral" },
};

/**
 * One status for a project, as the design shows it: how it's doing against
 * its programme while it's active, and where it is in its life otherwise.
 */
export function projectStatus(project: Pick<Project, "status" | "health">): StatusView {
  if (project.status !== "active") return STATUS[project.status];
  return HEALTH[project.health ?? "on_track"];
}

export function ProjectStatusBadge({ project }: { project: Pick<Project, "status" | "health"> }) {
  const { label, tone } = projectStatus(project);
  return <Badge tone={tone}>{label}</Badge>;
}

/** The status filter's options, in the design's order. */
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export const PROJECT_TYPES: Record<ProjectType, string> = {
  residential: "Residential",
  mixed_use: "Mixed-use",
  retail: "Retail",
  commercial: "Commercial",
  fit_out: "Fit-out",
};

/** "Residential · Own development" */
export function describeProjectKind(project: Pick<Project, "type" | "client">): string {
  return `${PROJECT_TYPES[project.type]} · ${project.client?.name ?? "Own development"}`;
}

/** "Lekki Phase 1, Lagos" */
export const projectPlace = (project: Pick<Project, "area" | "city">) =>
  `${project.area}, ${project.city}`;

/**
 * The one date a list shows for a project, and what it means at this point
 * in the project's life: when it starts, when it's due, when it stopped.
 */
export function projectKeyDate(
  project: Pick<Project, "status" | "startDate" | "targetDate" | "pausedDate" | "completedDate">,
): { label: string; date: ISODate; text: string } {
  switch (project.status) {
    case "planning":
      return {
        label: "Starts",
        date: project.startDate,
        text: formatDate(project.startDate, "medium"),
      };
    case "active":
      return {
        label: "Due",
        date: project.targetDate,
        text: formatDate(project.targetDate, "month"),
      };
    case "on_hold": {
      const date = project.pausedDate ?? project.startDate;
      return { label: "Paused", date, text: formatDate(date, "month") };
    }
    case "completed": {
      const date = project.completedDate ?? project.targetDate;
      return { label: "Handed over", date, text: formatDate(date, "month") };
    }
  }
}

/** A year after handover, defects the contractor must fix are still its problem. */
const DEFECTS_PERIOD_DAYS = 365;

/** "48 on site", or why nobody is: "Not mobilised", "Site secured". */
export function crewLabel(
  project: Pick<Project, "status" | "crew" | "completedDate">,
  now: DateInput,
): string {
  if (project.crew) return `${formatNumber(project.crew.onSite)} on site`;
  switch (project.status) {
    case "planning":
      return "Not mobilised";
    case "on_hold":
      return "Site secured";
    case "completed":
      return project.completedDate && daysBetween(project.completedDate, now) <= DEFECTS_PERIOD_DAYS
        ? "Defects period"
        : "Closed out";
    case "active":
      return "Nobody rostered";
  }
}

export const MILESTONE_STATUS: Record<MilestoneStatus, StatusView> = {
  planned: { label: "Planned", tone: "neutral" },
  on_track: { label: "On track", tone: "success" },
  at_risk: { label: "At risk", tone: "warning" },
  missed: { label: "Missed", tone: "danger" },
  done: { label: "Done", tone: "success" },
};

export const PHASE_STATUS: Record<PhaseStatus, StatusView> = {
  not_started: { label: "Not started", tone: "neutral" },
  on_track: { label: "On track", tone: "success" },
  slipping: { label: "Slipping", tone: "warning" },
  done: { label: "Done", tone: "neutral" },
};

export const ISSUE_SEVERITY: Record<IssueSeverity, StatusView> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
};

export const VARIATION_STATUS: Record<VariationOrderStatus, StatusView> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};
