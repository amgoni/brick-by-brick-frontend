/**
 * The API contract: every shape the backend sends this app.
 *
 * It's written here first, while the backend doesn't exist yet. The mock API
 * in mocks/ serves exactly these shapes, and the Express backend will be built
 * to the same contract, so swapping one for the other changes nothing on
 * screen. Change a shape here and TypeScript points at every screen and every
 * mock route it touches.
 *
 * Conventions, all of which follow from the data travelling as JSON:
 *
 * - Dates are ISO 8601 strings, never Date objects (JSON has no date type).
 *   `ISODateTime` is an instant, `ISODate` a calendar day in Lagos.
 * - Money is naira as a plain number for now. Whether it becomes integer kobo
 *   or a decimal string is one of the backend decisions still to make.
 * - Ids are opaque strings. The codes people read and say out loud
 *   (INV-2026-0149, EQ-004) are separate fields.
 * - A reference to another record carries what a screen shows of it
 *   (`{ id, name }`), so a list doesn't need a second request per row.
 * - Facts, not phrasing: the API sends a due date, and the screen decides to
 *   say "12 days overdue".
 */

/** An instant: "2026-10-26T15:52:00.000Z". */
export type ISODateTime = string;
/** A calendar day in Lagos: "2026-10-28". */
export type ISODate = string;
/** A calendar month: "2026-10". */
export type ISOMonth = string;
/** An amount in naira (see the note above). */
export type Naira = number;

export interface Ref {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// The signed-in user
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  /** Job title, as shown under the name: "Operations Director". */
  role: string;
}

/** The numbers in the navigation: what's waiting for this user, by area. */
export interface WorkspaceCounts {
  /** Material requests and purchase orders waiting for approval. */
  inventory: number;
  /** Timesheets waiting for approval. */
  staff: number;
  unreadNotifications: number;
}

export interface Notification {
  id: string;
  title: string;
  createdAt: ISODateTime;
  read: boolean;
  /** Where in the app it points. */
  href: string;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/** Where a project is in its life. */
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

/** How an active project is doing against its programme. */
export type ScheduleHealth = "on_track" | "at_risk" | "delayed";

export type ProjectType = "residential" | "mixed_use" | "retail" | "commercial" | "fit_out";

/** A project as lists show it: GET /projects. */
export interface Project {
  id: string;
  /** Short code that prefixes the project's documents: LPR, ICT. */
  code: string;
  name: string;
  type: ProjectType;
  /** Neighbourhood: "Lekki Phase 1". */
  area: string;
  city: string;
  /** Null when it's the company's own development. */
  client: Ref | null;
  status: ProjectStatus;
  /** Set while the project is active; null otherwise. */
  health: ScheduleHealth | null;
  /** The phase of the works under way: "Superstructure". Null before work starts and after handover. */
  stage: string | null;
  /** Share of the works complete, 0–1. */
  progress: number;
  budget: Naira;
  /** Cost to date. */
  spent: Naira;
  /** Invoiced to the client to date. */
  billed: Naira;
  startDate: ISODate;
  /** Planned completion. */
  targetDate: ISODate;
  /** When it went on hold; null unless it's on hold. */
  pausedDate: ISODate | null;
  /** Actual handover; null until it's completed. */
  completedDate: ISODate | null;
  manager: Ref;
  /** Today's attendance. Null when nobody's rostered (planning, on hold, done). */
  crew: { onSite: number; rostered: number } | null;
}

/**
 * One project, with what only its own page shows: GET /projects/:id. Lists
 * leave these fields out so they stay small.
 */
export interface ProjectDetail extends Project {
  /** Street address of the site. */
  address: string;
  /** What's being built: "24 apartments, 6 floors + penthouse". */
  scope: string;
  /** "Design & build, fixed price". */
  contractType: string;
  /** Null until one is issued, or where none is needed. */
  permitNumber: string | null;
  siteEngineer: Ref | null;
  /** The store on site that materials are issued from. */
  store: Ref | null;
  /** Ordered or contracted so far, whether paid yet or not. Always at least `spent`. */
  committed: Naira;
  /** Today's attendance by employer. Null when `crew` is. */
  crewSplit: { direct: number; subcontract: number } | null;
}

export type PhaseStatus = "not_started" | "on_track" | "slipping" | "done";

/** A phase of the works on the programme: GET /projects/:id/phases, in programme order. */
export interface ProjectPhase {
  id: string;
  name: string;
  plannedStart: ISODate;
  plannedFinish: ISODate;
  /** Share complete, 0–1. */
  progress: number;
  /** The site team's call, not a formula: a phase can be on track at 10%. */
  status: PhaseStatus;
}

export type MilestoneStatus = "planned" | "on_track" | "at_risk" | "missed" | "done";

export interface Milestone {
  id: string;
  project: Ref;
  title: string;
  dueDate: ISODate;
  status: MilestoneStatus;
}

/** A daily site report, filed from the field app. */
export interface SiteReport {
  id: string;
  project: Ref;
  author: Ref;
  submittedAt: ISODateTime;
  /** What the day was about: "Level 6 slab formwork". */
  title: string;
  crewOnSite: number;
  /** As the site team wrote it: "Rain from 2 PM". */
  weather: string;
  /** Working hours lost to weather, deliveries or anything else. */
  hoursLost: number;
  photoCount: number;
  summary: string;
}

export type IssueSeverity = "high" | "medium" | "low";

/** Something wrong on site that someone has to deal with: GET /projects/:id/issues (open ones). */
export interface ProjectIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string | null;
  assignee: Ref | null;
  raisedAt: ISODateTime;
}

/** One cost code of a project's budget: GET /projects/:id/budget. */
export interface BudgetLine {
  /** "03" */
  code: string;
  name: string;
  budget: Naira;
  /** Ordered or contracted, paid or not. */
  committed: Naira;
  spent: Naira;
}

export type VariationOrderStatus = "pending" | "approved" | "rejected";

/** A change to a project's scope or price that needs sign-off: GET /variation-orders. */
export interface VariationOrder {
  id: string;
  /** "VO-007" */
  code: string;
  project: Ref;
  title: string;
  /** What it adds to the contract sum (negative if it saves money). */
  amount: Naira;
  /** Days it adds to the programme; 0 if none. */
  timeImpactDays: number;
  status: VariationOrderStatus;
  raisedBy: Ref;
  raisedAt: ISODateTime;
  /** Who approved or rejected it, and when; null while it's pending. */
  decidedBy: Ref | null;
  decidedAt: ISODateTime | null;
}

export interface TeamMember {
  person: Ref;
  /** Their role on this project, which can differ from their job title. */
  role: string;
  /** For a foreman: how many labourers they lead. */
  leads: number | null;
  onSiteToday: boolean;
}

export interface Subcontractor {
  id: string;
  name: string;
  /** "Plumbing & electrical" */
  trade: string;
  contractValue: Naira;
  /** From today's gate log. */
  crewToday: number;
}

/** GET /projects/:id/team */
export interface ProjectTeam {
  members: TeamMember[];
  subcontractors: Subcontractor[];
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

/** How much of one item is at one store: GET /stock?locationId= */
export interface StockLevel {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: Ref;
  quantity: number;
  /** "bags", "t", "pcs" */
  unit: string;
  /** Below this, it's time to reorder. */
  reorderLevel: number;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type ApprovalKind = "material_request" | "timesheet" | "purchase_order" | "variation_order";

export type UnitStatus = "sold" | "reserved" | "leased" | "available";

/**
 * Something that needs someone's attention. A discriminated union: `kind`
 * says which, and TypeScript narrows the rest of the fields from it.
 */
export type AttentionItem =
  | {
      kind: "low_stock";
      id: string;
      item: Ref;
      location: Ref;
      quantity: number;
      unit: string;
      reorderLevel: number;
      /** How many other items are also below their reorder level. */
      othersLow: number;
    }
  | {
      kind: "overdue_invoice";
      id: string;
      invoice: { id: string; number: string };
      client: Ref;
      balance: Naira;
      dueDate: ISODate;
    }
  | {
      kind: "service_due";
      id: string;
      equipment: { id: string; code: string; name: string };
      service: string;
      dueDate: ISODate;
    }
  | {
      kind: "certifications_expiring";
      id: string;
      certification: string;
      count: number;
      /** The last of them to expire. */
      latestExpiry: ISODate;
    };

export interface DashboardSummary {
  sites: { active: number; behindSchedule: number };
  /** Across active projects. */
  contracts: { inProgress: Naira; billed: Naira };
  receivables: { outstanding: Naira; overdue: Naira; overdueInvoices: number };
  crew: { onSite: number; rostered: number };
  /** Most urgent first. */
  attention: AttentionItem[];
  approvals: Record<ApprovalKind, number>;
  sales: { developments: number; units: Record<UnitStatus, number> };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface CashFlowMonth {
  month: ISOMonth;
  invoiced: Naira;
  collected: Naira;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type SearchResultKind = "project" | "invoice" | "equipment" | "stock_item" | "person";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  /** A second line that tells two similar results apart. */
  subtitle: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** The body of every non-2xx response. */
export interface ApiErrorBody {
  error: {
    /** Stable and machine-readable: "not_found", "validation_failed". */
    code: string;
    /** Human-readable, safe to show. */
    message: string;
  };
}
