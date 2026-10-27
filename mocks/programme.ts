import type { BudgetLine, PhaseStatus, ProjectPhase } from "@/lib/api/types";
import type { ProjectRecord } from "./seed";
import { dayDiff, shiftDay } from "./time";

/*
 * A plausible programme and budget for any project, so every project's page
 * has something on it. Lekki Palms doesn't use this: its figures come straight
 * from the design board. The real backend stores what the site team enters
 * and generates nothing.
 */

/** A phase as a share of the programme: it runs from `from` to `to` (0–1). */
interface PhaseShape {
  name: string;
  from: number;
  to: number;
}

/**
 * A cost code's share of the budget, and what its spending keeps pace with:
 * one phase, the whole programme ("programme"), or nothing (contingency).
 */
interface CostShape {
  code: string;
  name: string;
  share: number;
  follows: string | null;
}

interface Template {
  phases: PhaseShape[];
  costs: CostShape[];
}

/** A new building, in the proportions of the Lekki Palms programme. */
const BUILD: Template = {
  phases: [
    { name: "Mobilisation", from: 0.02, to: 0.08 },
    { name: "Substructure", from: 0.06, to: 0.28 },
    { name: "Superstructure", from: 0.17, to: 0.72 },
    { name: "Blockwork", from: 0.28, to: 0.78 },
    { name: "Roofing", from: 0.5, to: 0.72 },
    { name: "MEP services", from: 0.39, to: 0.89 },
    { name: "Finishes", from: 0.67, to: 0.97 },
    { name: "External works", from: 0.78, to: 1 },
  ],
  costs: [
    { code: "01", name: "Preliminaries", share: 0.075, follows: "programme" },
    { code: "02", name: "Substructure", share: 0.142, follows: "Substructure" },
    { code: "03", name: "Superstructure", share: 0.264, follows: "Superstructure" },
    { code: "04", name: "Blockwork & masonry", share: 0.08, follows: "Blockwork" },
    { code: "05", name: "Roofing", share: 0.052, follows: "Roofing" },
    { code: "06", name: "MEP services", share: 0.151, follows: "MEP services" },
    { code: "07", name: "Finishes", share: 0.138, follows: "Finishes" },
    { code: "08", name: "External works", share: 0.048, follows: "External works" },
    { code: "09", name: "Contingency", share: 0.05, follows: null },
  ],
};

/** An office fit-out inside an existing building. */
const FIT_OUT: Template = {
  phases: [
    { name: "Strip-out & enabling", from: 0, to: 0.12 },
    { name: "MEP first fix", from: 0.08, to: 0.45 },
    { name: "Partitions & ceilings", from: 0.3, to: 0.7 },
    { name: "MEP second fix", from: 0.55, to: 0.85 },
    { name: "Finishes", from: 0.65, to: 0.95 },
    { name: "Commissioning & handover", from: 0.9, to: 1 },
  ],
  costs: [
    { code: "01", name: "Preliminaries", share: 0.08, follows: "programme" },
    { code: "02", name: "Strip-out & enabling", share: 0.05, follows: "Strip-out & enabling" },
    { code: "03", name: "MEP first fix", share: 0.18, follows: "MEP first fix" },
    { code: "04", name: "Partitions & ceilings", share: 0.2, follows: "Partitions & ceilings" },
    { code: "05", name: "MEP second fix", share: 0.16, follows: "MEP second fix" },
    { code: "06", name: "Finishes & joinery", share: 0.22, follows: "Finishes" },
    { code: "07", name: "Commissioning", share: 0.04, follows: "Commissioning & handover" },
    { code: "08", name: "Contingency", share: 0.07, follows: null },
  ],
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** How far through the works the project is, as the programme measures it. */
const worksDone = (project: ProjectRecord) =>
  project.status === "planning" ? 0 : project.progress;

export function generatePhases(project: ProjectRecord): ProjectPhase[] {
  const { phases } = project.type === "fit_out" ? FIT_OUT : BUILD;
  const length = dayDiff(project.startDate, project.targetDate);
  const done = worksDone(project);

  const generated = phases.map((phase, index): ProjectPhase => {
    const progress = Math.round(clamp01((done - phase.from) / (phase.to - phase.from)) * 100) / 100;
    let status: PhaseStatus = "on_track";
    if (progress >= 1) status = "done";
    else if (progress === 0) status = "not_started";
    // Delayed, or on hold: whatever is under way has stalled.
    else if (project.health !== "on_track" && project.health !== "at_risk") status = "slipping";
    return {
      id: `${project.id}_ph${index + 1}`,
      name: phase.name,
      plannedStart: shiftDay(project.startDate, Math.round(phase.from * length)),
      plannedFinish: shiftDay(project.startDate, Math.round(phase.to * length)),
      progress,
      status,
    };
  });

  // At risk: the phase furthest behind is the one slipping.
  if (project.health === "at_risk") {
    const underway = generated.filter((phase) => phase.status === "on_track" && phase.progress > 0);
    const furthestBehind = underway.sort((a, b) => a.progress - b.progress)[0];
    if (furthestBehind) furthestBehind.status = "slipping";
  }
  return generated;
}

/**
 * Splits the project's budget across cost codes, and its cost to date across
 * them in step with each phase's progress. Commitments run ahead of spending,
 * because orders and subcontracts are let before the work is done.
 */
export function generateBudget(project: ProjectRecord, phases: ProjectPhase[]): BudgetLine[] {
  const { costs } = project.type === "fit_out" ? FIT_OUT : BUILD;
  const done = worksDone(project);
  const progressOf = (follows: string | null) => {
    if (follows === null) return 0;
    if (follows === "programme") return done;
    return phases.find((phase) => phase.name === follows)?.progress ?? 0;
  };

  const budgets = costs.map((cost) => Math.round(project.budget * cost.share));
  // Contingency, last, absorbs the rounding.
  budgets[budgets.length - 1]! += project.budget - sum(budgets);

  const progress = costs.map((cost) => progressOf(cost.follows));
  // What each line would have cost by now if money went out exactly as work got done.
  const earned = budgets.map((budget, index) => budget * progress[index]!);
  const totalEarned = sum(earned);
  const contingency = costs.length - 1;

  let spent: number[];
  if (totalEarned === 0) {
    // Nothing built yet: what's been spent so far is fees, on preliminaries.
    spent = budgets.map((_, index) => (index === 0 ? project.spent : 0));
  } else if (totalEarned >= project.spent) {
    // Spending behind the work: every line in proportion.
    spent = earned.map((value) => (value * project.spent) / totalEarned);
  } else {
    // Spending ahead of the work, which is usual: materials bought and stages
    // paid before they're done. The excess goes on lines still under way (a
    // little on those about to start), never past a line's budget; anything
    // left over draws down the contingency.
    const room = budgets.map((budget, index) =>
      index === contingency ? 0 : (budget - earned[index]!) * (progress[index]! > 0 ? 1 : 0.25),
    );
    const totalRoom = sum(room);
    const excess = project.spent - totalEarned;
    const share = totalRoom > 0 ? Math.min(1, excess / totalRoom) : 0;
    spent = earned.map((value, index) => value + room[index]! * share);
    spent[contingency]! += project.spent - sum(spent);
  }
  spent = spent.map(Math.round);
  // Whatever rounding left over goes on the largest line.
  spent[spent.indexOf(Math.max(...spent))]! += project.spent - sum(spent);

  return costs.map((cost, index) => {
    const ahead = progress[index]! > 0 ? Math.min(1, progress[index]! + 0.3) : 0;
    return {
      code: cost.code,
      name: cost.name,
      budget: budgets[index]!,
      committed: Math.max(spent[index]!, Math.round(budgets[index]! * ahead)),
      spent: spent[index]!,
    };
  });
}
