import type {
  ApprovalKind,
  BudgetLine,
  CashFlowMonth,
  CurrentUser,
  ISODate,
  ISODateTime,
  Milestone,
  Naira,
  Notification,
  ProjectDetail,
  ProjectIssue,
  ProjectPhase,
  ProjectTeam,
  Ref,
  SiteReport,
  UnitStatus,
  VariationOrder,
} from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { generateBudget, generatePhases } from "./programme";
import { lagosAt, lagosDay, lagosMonth } from "./time";

/*
 * The mock dataset, taken from the Claude Design boards so every screen built
 * from them agrees: the six unpaid invoices here total the dashboard's ₦412.6m
 * of receivables, the five active sites its 186 crew on site, Lekki Palms'
 * cost codes its ₦1.07bn spent, and so on.
 *
 * Records the API already has a type for are stored in that shape. The rest
 * are rough stand-ins for tables the backend will design properly, kept only
 * as detailed as the screens built so far need. When the real database
 * exists, this file becomes its seed script.
 */

/**
 * A project as stored. The two fields of ProjectDetail that aren't here are
 * worked out from other records when it's read: `committed` from the budget,
 * `crewSplit` from the subcontractors' crews.
 */
export type ProjectRecord = Omit<ProjectDetail, "committed" | "crewSplit">;

export interface InvoiceRecord {
  id: string;
  number: string;
  client: Ref;
  project: Ref | null;
  reference: string;
  /** Null while it's a draft. */
  issuedOn: ISODate | null;
  dueOn: ISODate | null;
  amount: Naira;
  paid: Naira;
  status: "draft" | "issued" | "void";
}

export interface StockRecord {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: Ref;
  quantity: number;
  reorderLevel: number;
  unit: string;
  unitPrice: Naira;
}

export interface EquipmentRecord {
  id: string;
  code: string;
  name: string;
  status: "in_use" | "available" | "maintenance";
  location: string;
  nextService: { dueOn: ISODate; description: string } | null;
}

export interface ApprovalRecord {
  /** The code of the thing waiting: MR-0412, VO-007. */
  id: string;
  kind: ApprovalKind;
  title: string;
  requestedBy: Ref;
  requestedAt: ISODateTime;
}

export interface CertificationRecord {
  id: string;
  person: Ref;
  name: string;
  expiresOn: ISODate;
}

export interface DevelopmentRecord {
  id: string;
  name: string;
  units: Record<UnitStatus, number>;
}

export interface PersonRecord extends Ref {
  role: string;
}

export interface Db {
  /** The Lagos day this seed was built for (see db.ts). */
  day: ISODate;
  currentUser: CurrentUser;
  people: PersonRecord[];
  projects: ProjectRecord[];
  /*
   * What belongs to one project, keyed by its id. In the database each of
   * these is a table with a project_id column.
   */
  phases: Record<string, ProjectPhase[]>;
  budgets: Record<string, BudgetLine[]>;
  issues: Record<string, ProjectIssue[]>;
  teams: Record<string, ProjectTeam>;
  milestones: Milestone[];
  siteReports: SiteReport[];
  variationOrders: VariationOrder[];
  invoices: InvoiceRecord[];
  stock: StockRecord[];
  equipment: EquipmentRecord[];
  approvals: ApprovalRecord[];
  certifications: CertificationRecord[];
  developments: DevelopmentRecord[];
  cashFlow: CashFlowMonth[];
  notifications: Notification[];
}

const ref = ({ id, name }: Ref): Ref => ({ id, name });
const MILLION = 1_000_000;

export function createSeed(now: Date): Db {
  const day = (offset: number) => lagosDay(now, offset);
  const at = (offset: number, time: string) => lagosAt(now, offset, time);

  const person = {
    adaeze: { id: "usr_adaeze", name: "Adaeze Okafor", role: "Operations Director" },
    chinedu: { id: "per_chinedu", name: "Chinedu Eze", role: "Project manager" },
    folake: { id: "per_folake", name: "Folake Adeyemi", role: "Project manager" },
    ibrahim: { id: "per_ibrahim", name: "Ibrahim Musa", role: "Site manager" },
    kunle: { id: "per_kunle", name: "Kunle Ajayi", role: "Project manager" },
    zainab: { id: "per_zainab", name: "Zainab Bello", role: "Fit-out lead" },
    tolu: { id: "per_tolu", name: "Tolu Adebayo", role: "Site engineer" },
    ifeanyi: { id: "per_ifeanyi", name: "Ifeanyi Okeke", role: "Site engineer" },
    hauwa: { id: "per_hauwa", name: "Hauwa Lawal", role: "Site engineer" },
    ngozi: { id: "per_ngozi", name: "Ngozi Ume", role: "Quantity surveyor" },
    musa: { id: "per_musa", name: "Musa Danladi", role: "HSE officer" },
    bisi: { id: "per_bisi", name: "Bisi Alade", role: "Procurement officer" },
    sunday: { id: "per_sunday", name: "Sunday Okon", role: "Foreman" },
    emeka: { id: "per_emeka", name: "Emeka Obi", role: "Crane operator" },
    yakubu: { id: "per_yakubu", name: "Yakubu Garba", role: "Plant operator" },
  } satisfies Record<string, PersonRecord>;

  const client = {
    crestview: { id: "cli_crestview", name: "Crestview Holdings Ltd" },
    oyo: { id: "cli_oyo", name: "Oyo Retail Ventures Ltd" },
    yabaLabs: { id: "cli_yabalabs", name: "Yaba Labs Ltd" },
    harbourline: { id: "cli_harbourline", name: "Harbourline Partners" },
    arewa: { id: "cli_arewa", name: "Arewa Capital Partners" },
    ngoziOkonkwo: { id: "cli_nokonkwo", name: "Ngozi Okonkwo" },
    ifeoma: { id: "cli_ichukwu", name: "Ifeoma Chukwu" },
    emekaNwosu: { id: "cli_enwosu", name: "Emeka Nwosu" },
  } satisfies Record<string, Ref>;

  /** Stores: one on each site with materials, and the central yard. */
  const store = {
    lekki: { id: "loc_lpr", name: "Lekki Palms store" },
    ikoyi: { id: "loc_ict", name: "Ikoyi Crest store" },
    maitama: { id: "loc_mtc", name: "Maitama Court store" },
    ibadan: { id: "loc_irp", name: "Ring Road site store" },
    yaba: { id: "loc_yth", name: "Yaba Tech Hub store" },
    yard: { id: "loc_yard", name: "Central yard, Ikeja" },
  } satisfies Record<string, Ref>;

  const projects: ProjectRecord[] = [
    {
      id: "prj_lekki",
      code: "LPR",
      name: "Lekki Palms Residences",
      type: "residential",
      area: "Lekki Phase 1",
      city: "Lagos",
      client: null,
      status: "active",
      health: "on_track",
      stage: "Superstructure",
      progress: 0.62,
      budget: 1_840_000_000,
      spent: 1_070_000_000,
      billed: 1_100_000_000,
      startDate: day(-288),
      targetDate: day(246),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.chinedu),
      crew: { onSite: 48, rostered: 55 },
      address: "Plot 14, Admiralty Way, Lekki Phase 1",
      scope: "24 apartments, 6 floors + penthouse",
      contractType: "Design & build, fixed price",
      permitNumber: "BP-2025-0471",
      siteEngineer: ref(person.tolu),
      store: store.lekki,
    },
    {
      id: "prj_ikoyi",
      code: "ICT",
      name: "Ikoyi Crest Towers",
      type: "mixed_use",
      area: "Ikoyi",
      city: "Lagos",
      client: ref(client.crestview),
      status: "active",
      health: "at_risk",
      stage: "Superstructure",
      progress: 0.38,
      budget: 4_200_000_000,
      spent: 1_720_000_000,
      billed: 1_680_000_000,
      startDate: day(-380),
      targetDate: day(520),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.folake),
      crew: { onSite: 71, rostered: 82 },
      address: "Plot 3, Bourdillon Road, Ikoyi",
      scope: "22-storey tower: retail podium, 9 office floors, 40 apartments",
      contractType: "Build only, remeasured",
      permitNumber: "BP-2025-0219",
      siteEngineer: ref(person.ifeanyi),
      store: store.ikoyi,
    },
    {
      id: "prj_maitama",
      code: "MTC",
      name: "Maitama Court",
      type: "residential",
      area: "Maitama",
      city: "Abuja",
      client: null,
      status: "active",
      health: "on_track",
      stage: "Finishes",
      progress: 0.81,
      budget: 960_000_000,
      spent: 806_000_000,
      billed: 816_000_000,
      startDate: day(-610),
      targetDate: day(65),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.ibrahim),
      crew: { onSite: 26, rostered: 30 },
      address: "Plot 1102, Aguiyi Ironsi Street, Maitama",
      scope: "12 terraced houses with staff quarters",
      contractType: "In-house design & build",
      permitNumber: "BP-2024-1180",
      siteEngineer: ref(person.hauwa),
      store: store.maitama,
    },
    {
      id: "prj_ibadan",
      code: "IRP",
      name: "Ibadan Ring Road Plaza",
      type: "retail",
      area: "Ring Road",
      city: "Ibadan",
      client: ref(client.oyo),
      status: "active",
      health: "delayed",
      stage: "Substructure",
      progress: 0.24,
      budget: 1_350_000_000,
      spent: 419_000_000,
      billed: 405_000_000,
      startDate: day(-200),
      targetDate: day(395),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.kunle),
      crew: { onSite: 23, rostered: 27 },
      address: "Plot 7, Ring Road, Ibadan",
      scope: "Two-level retail plaza: 48 shops and a supermarket",
      contractType: "Lump sum, client's design",
      permitNumber: "BP-2026-0336",
      siteEngineer: null,
      store: store.ibadan,
    },
    {
      id: "prj_yaba",
      code: "YTH",
      name: "Yaba Tech Hub fit-out",
      type: "fit_out",
      area: "Yaba",
      city: "Lagos",
      client: ref(client.yabaLabs),
      status: "active",
      health: "on_track",
      stage: "MEP first fix",
      progress: 0.17,
      budget: 310_000_000,
      spent: 47_000_000,
      billed: 119_000_000,
      startDate: day(-45),
      targetDate: day(120),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.zainab),
      crew: { onSite: 18, rostered: 20 },
      address: "Floors 3–4, 18 Herbert Macaulay Way, Yaba",
      scope: "1,800 m² office fit-out over two floors",
      contractType: "Fit-out, fixed price",
      permitNumber: null,
      siteEngineer: null,
      store: store.yaba,
    },
    {
      id: "prj_ajah",
      code: "AGP",
      name: "Ajah Gardens Phase II",
      type: "residential",
      area: "Ajah",
      city: "Lagos",
      client: null,
      status: "planning",
      health: null,
      stage: null,
      progress: 0,
      budget: 2_110_000_000,
      spent: 38_000_000,
      billed: 0,
      startDate: day(13),
      targetDate: day(740),
      pausedDate: null,
      completedDate: null,
      manager: ref(person.chinedu),
      crew: null,
      address: "Off Abraham Adesanya Road, Ajah",
      scope: "36 apartments in three blocks",
      contractType: "In-house design & build",
      permitNumber: null,
      siteEngineer: null,
      store: null,
    },
    {
      id: "prj_gbagada",
      code: "GBM",
      name: "Gbagada Mews",
      type: "residential",
      area: "Gbagada",
      city: "Lagos",
      client: null,
      status: "on_hold",
      health: null,
      stage: "Substructure",
      progress: 0.12,
      budget: 780_000_000,
      spent: 96_000_000,
      billed: 0,
      startDate: day(-300),
      targetDate: day(-60),
      pausedDate: day(-80),
      completedDate: null,
      manager: ref(person.kunle),
      crew: null,
      address: "12 Diya Street, Gbagada Phase 1",
      scope: "12 maisonettes",
      contractType: "In-house design & build",
      permitNumber: "BP-2025-0098",
      siteEngineer: null,
      store: null,
    },
    {
      id: "prj_vi",
      code: "VIR",
      name: "Victoria Island Office Refurb",
      type: "commercial",
      area: "Victoria Island",
      city: "Lagos",
      client: ref(client.harbourline),
      status: "completed",
      health: null,
      stage: null,
      progress: 1,
      budget: 240_000_000,
      spent: 231_000_000,
      billed: 240_000_000,
      startDate: day(-330),
      targetDate: day(-95),
      pausedDate: null,
      completedDate: day(-95),
      manager: ref(person.folake),
      crew: null,
      address: "Floors 4–5, 27 Adeola Odeku Street, Victoria Island",
      scope: "Refurbishment of two office floors, 1,200 m²",
      contractType: "Fit-out, fixed price",
      permitNumber: null,
      siteEngineer: null,
      store: null,
    },
  ];

  const project = Object.fromEntries(projects.map((p) => [p.code, ref(p)])) as Record<string, Ref>;
  const p = (code: string): Ref => project[code]!;

  // Lekki Palms' programme and cost codes are the design board's, exactly.
  // Planned dates count from the start of its 534-day programme.
  const lekkiStart = -288;
  const lekkiPhase = (
    index: number,
    name: string,
    from: number,
    to: number,
    progress: number,
    status: ProjectPhase["status"],
  ): ProjectPhase => ({
    id: `prj_lekki_ph${index}`,
    name,
    plannedStart: day(lekkiStart + from),
    plannedFinish: day(lekkiStart + to),
    progress,
    status,
  });
  const lekkiPhases: ProjectPhase[] = [
    lekkiPhase(1, "Mobilisation", 10, 45, 1, "done"),
    lekkiPhase(2, "Substructure", 30, 148, 1, "done"),
    lekkiPhase(3, "Superstructure", 89, 386, 0.74, "on_track"),
    lekkiPhase(4, "Blockwork", 148, 415, 0.55, "slipping"),
    lekkiPhase(5, "Roofing", 267, 386, 0.1, "on_track"),
    lekkiPhase(6, "MEP services", 208, 475, 0.22, "on_track"),
    lekkiPhase(7, "Finishes", 356, 519, 0, "not_started"),
    lekkiPhase(8, "External works", 415, 534, 0, "not_started"),
  ];
  // ₦ millions: budget, committed, spent.
  const lekkiCosts: [string, string, number, number, number][] = [
    ["01", "Preliminaries", 138, 112, 96],
    ["02", "Substructure", 262, 258, 254],
    ["03", "Superstructure", 486, 470, 452],
    ["04", "Blockwork & masonry", 148, 120, 84],
    ["05", "Roofing", 96, 64, 18],
    ["06", "MEP services", 278, 190, 154],
    ["07", "Finishes", 254, 40, 12],
    ["08", "External works", 88, 0, 0],
    ["09", "Contingency", 90, 0, 0],
  ];

  const phases: Record<string, ProjectPhase[]> = {};
  const budgets: Record<string, BudgetLine[]> = {};
  for (const record of projects) {
    if (record.id === "prj_lekki") {
      phases[record.id] = lekkiPhases;
      budgets[record.id] = lekkiCosts.map(([code, name, budget, committed, spent]) => ({
        code,
        name,
        budget: budget * MILLION,
        committed: committed * MILLION,
        spent: spent * MILLION,
      }));
    } else {
      const generated = generatePhases(record);
      phases[record.id] = generated;
      budgets[record.id] = generateBudget(record, generated);
    }
  }

  const issue = (
    id: string,
    severity: ProjectIssue["severity"],
    title: string,
    description: string | null,
    assignee: Ref | null,
    raisedAt: ISODateTime,
  ): ProjectIssue => ({ id, severity, title, description, assignee, raisedAt });
  const issues: Record<string, ProjectIssue[]> = {
    prj_lekki: [
      issue(
        "iss_101",
        "high",
        "Cement stock below reorder level",
        "38 bags left · request MR-0412 awaiting approval",
        null,
        at(0, "07:45"),
      ),
      issue(
        "iss_098",
        "medium",
        "Rain delays on blockwork, level 5",
        "6 hours lost this week · tarps ordered",
        null,
        at(-2, "15:10"),
      ),
      issue(
        "iss_094",
        "low",
        "Hoarding panel damaged at east gate",
        null,
        ref(person.musa),
        at(-5, "10:30"),
      ),
    ],
    prj_ikoyi: [
      issue(
        "iss_100",
        "high",
        "16mm rebar below reorder level",
        "2.1 t left, 8 t needed for the level 10 slab · MR-0411 raised",
        null,
        at(-1, "09:45"),
      ),
      issue(
        "iss_099",
        "medium",
        "Level 10 slab pour at risk",
        "Waiting on rebar; the pour may slip past this week",
        ref(person.folake),
        at(-1, "17:20"),
      ),
    ],
    prj_ibadan: [
      issue(
        "iss_096",
        "high",
        "Pile caps behind programme",
        "Grid C poured; grids D–F outstanding, 3 days behind",
        ref(person.kunle),
        at(-3, "16:00"),
      ),
      issue(
        "iss_097",
        "medium",
        "Dumper EQ-009 in the workshop",
        "Back on Thursday; hiring one in the meantime",
        null,
        at(-2, "11:15"),
      ),
    ],
    prj_maitama: [
      issue(
        "iss_095",
        "low",
        "Snagging on terrace T4",
        "12 items open after the client walk-round",
        ref(person.hauwa),
        at(-1, "14:30"),
      ),
    ],
  };

  const member = (
    who: PersonRecord,
    role: string,
    onSiteToday: boolean,
    leads: number | null = null,
  ) => ({ person: ref(who), role, leads, onSiteToday });
  const teams: Record<string, ProjectTeam> = {
    prj_lekki: {
      members: [
        member(person.chinedu, "Project manager", true),
        member(person.tolu, "Site engineer", true),
        member(person.ngozi, "Quantity surveyor", false),
        member(person.musa, "HSE officer", true),
        member(person.bisi, "Storekeeper", true),
        member(person.sunday, "Foreman, masonry", true, 22),
      ],
      subcontractors: [
        {
          id: "sub_lpr_aqua",
          name: "Aqua MEP Services Ltd",
          trade: "Plumbing & electrical",
          contractValue: 212 * MILLION,
          crewToday: 14,
        },
        {
          id: "sub_lpr_prime",
          name: "Prime Roofing Co.",
          trade: "Roof structure & covering",
          contractValue: 64 * MILLION,
          crewToday: 6,
        },
      ],
    },
    prj_ikoyi: {
      members: [
        member(person.folake, "Project manager", true),
        member(person.ifeanyi, "Site engineer", true),
        member(person.ngozi, "Quantity surveyor", false),
        member(person.emeka, "Crane operator", true),
      ],
      subcontractors: [
        {
          id: "sub_ict_apex",
          name: "Apex Formwork Ltd",
          trade: "Formwork & falsework",
          contractValue: 310 * MILLION,
          crewToday: 18,
        },
        {
          id: "sub_ict_aqua",
          name: "Aqua MEP Services Ltd",
          trade: "Plumbing & electrical",
          contractValue: 486 * MILLION,
          crewToday: 9,
        },
      ],
    },
    prj_maitama: {
      members: [
        member(person.ibrahim, "Site manager", true),
        member(person.hauwa, "Site engineer", true),
      ],
      subcontractors: [
        {
          id: "sub_mtc_capital",
          name: "Capital Finishes Ltd",
          trade: "Painting & tiling",
          contractValue: 58 * MILLION,
          crewToday: 8,
        },
      ],
    },
    prj_ibadan: {
      members: [
        member(person.kunle, "Project manager", true),
        member(person.yakubu, "Plant operator", true),
      ],
      subcontractors: [
        {
          id: "sub_irp_deep",
          name: "Deep Foundations Ltd",
          trade: "Piling & pile caps",
          contractValue: 145 * MILLION,
          crewToday: 11,
        },
      ],
    },
    prj_yaba: {
      members: [member(person.zainab, "Fit-out lead", true)],
      subcontractors: [
        {
          id: "sub_yth_aqua",
          name: "Aqua MEP Services Ltd",
          trade: "Mechanical & electrical",
          contractValue: 96 * MILLION,
          crewToday: 10,
        },
      ],
    },
    prj_ajah: {
      members: [
        member(person.chinedu, "Project manager", false),
        member(person.ngozi, "Quantity surveyor", false),
      ],
      subcontractors: [],
    },
    prj_gbagada: {
      members: [member(person.kunle, "Project manager", false)],
      subcontractors: [],
    },
    prj_vi: {
      members: [member(person.folake, "Project manager", false)],
      subcontractors: [],
    },
  };

  const milestone = (
    id: string,
    code: string,
    title: string,
    dueDate: ISODate,
    status: Milestone["status"],
  ): Milestone => ({ id, project: p(code), title, dueDate, status });
  const milestones: Milestone[] = [
    milestone("mst_1", "ICT", "Level 10 slab pour", day(2), "at_risk"),
    milestone("mst_2", "LPR", "Roof structure inspection", day(4), "on_track"),
    milestone("mst_3", "MTC", "Handover — Terraces 1–4", day(8), "on_track"),
    milestone("mst_4", "YTH", "MEP first fix complete", day(11), "on_track"),
    milestone("mst_5", "AGP", "Groundbreaking", day(13), "planned"),
    milestone("mst_6", "LPR", "Level 6 slab pour", day(30), "planned"),
    milestone("mst_7", "IRP", "Pile caps complete", day(-3), "missed"),
    milestone("mst_8", "LPR", "Substructure complete", day(-140), "done"),
    milestone("mst_9", "LPR", "Topping out", day(111), "planned"),
    milestone("mst_10", "LPR", "Practical completion", day(246), "planned"),
    milestone("mst_11", "ICT", "Practical completion", day(520), "planned"),
    milestone("mst_12", "MTC", "Practical completion", day(65), "on_track"),
    milestone("mst_13", "IRP", "Practical completion", day(395), "at_risk"),
    milestone("mst_14", "YTH", "Practical completion", day(120), "planned"),
    milestone("mst_15", "AGP", "Practical completion", day(740), "planned"),
    milestone("mst_16", "VIR", "Practical completion", day(-95), "done"),
  ];

  const report = (
    id: string,
    code: string,
    author: Ref,
    submittedAt: ISODateTime,
    details: Pick<
      SiteReport,
      "title" | "crewOnSite" | "weather" | "hoursLost" | "photoCount" | "summary"
    >,
  ): SiteReport => ({ id, project: p(code), author: ref(author), submittedAt, ...details });
  const siteReports: SiteReport[] = [
    report("rep_1", "ICT", person.folake, at(-1, "17:10"), {
      title: "Level 9 columns",
      crewOnSite: 71,
      weather: "Sunny",
      hoursLost: 0,
      photoCount: 5,
      summary: "Level 9 columns cast. Waiting on 16mm rebar delivery before the L10 slab.",
    }),
    report("rep_2", "LPR", person.chinedu, at(-1, "16:52"), {
      title: "Blockwork level 5, scaffold lift 3",
      crewOnSite: 48,
      weather: "Rain from 2 PM",
      hoursLost: 2,
      photoCount: 6,
      summary:
        "Blockwork on level 5 at 70%. Lost two hours to rain in the afternoon; tarps on order. Cement down to 38 bags, request raised.",
    }),
    report("rep_3", "MTC", person.ibrahim, at(-1, "15:40"), {
      title: "Snagging T3, painting T4",
      crewOnSite: 26,
      weather: "Cloudy",
      hoursLost: 0,
      photoCount: 8,
      summary: "Snagging on T3 closed out. Painting started on T4.",
    }),
    report("rep_4", "IRP", person.kunle, at(-1, "14:05"), {
      title: "Pile caps, grid C",
      crewOnSite: 23,
      weather: "Rain in the morning",
      hoursLost: 1,
      photoCount: 3,
      summary: "Pile caps on grid C poured. Dumper back from the workshop on Thursday.",
    }),
    report("rep_5", "YTH", person.zainab, at(-2, "16:30"), {
      title: "Level 2 containment",
      crewOnSite: 18,
      weather: "Sunny",
      hoursLost: 0,
      photoCount: 2,
      summary: "Containment for level 2 cabling done. Ceiling grid starts Monday.",
    }),
    report("rep_6", "LPR", person.tolu, at(-2, "17:05"), {
      title: "Level 6 slab formwork",
      crewOnSite: 51,
      weather: "Sunny",
      hoursLost: 0,
      photoCount: 9,
      summary: `Formwork to the level 6 slab 80% complete. Rebar fixing for beams started. Concrete pour booked for ${formatDate(day(30), "short")}.`,
    }),
    report("rep_7", "LPR", person.chinedu, at(-3, "16:40"), {
      title: "MEP sleeves and conduits, levels 3–4",
      crewOnSite: 46,
      weather: "Cloudy",
      hoursLost: 0,
      photoCount: 4,
      summary:
        "Aqua MEP completed sleeves on L3 and started conduit runs on L4. Toolbox talk on working at height held for all crews.",
    }),
    report("rep_8", "LPR", person.tolu, at(-4, "17:15"), {
      title: "Roof truss delivery inspection",
      crewOnSite: 44,
      weather: "Rain in the morning",
      hoursLost: 1,
      photoCount: 7,
      summary:
        "Prime Roofing delivered 40% of the trusses. Two rejected for split members; replacements due Friday.",
    }),
  ];

  const variationOrders: VariationOrder[] = [
    {
      id: "vo_007",
      code: "VO-007",
      project: p("LPR"),
      title: "Upgrade penthouse windows to thermally broken aluminium",
      amount: 18_600_000,
      timeImpactDays: 9,
      status: "pending",
      raisedBy: ref(person.chinedu),
      raisedAt: at(-5, "11:20"),
      decidedBy: null,
      decidedAt: null,
    },
    {
      id: "vo_006",
      code: "VO-006",
      project: p("LPR"),
      title: "Additional borehole and water treatment unit",
      amount: 7_450_000,
      timeImpactDays: 0,
      status: "approved",
      raisedBy: ref(person.chinedu),
      raisedAt: at(-60, "10:05"),
      decidedBy: ref(person.adaeze),
      decidedAt: at(-54, "15:30"),
    },
    {
      id: "vo_010",
      code: "VO-010",
      project: p("ICT"),
      title: "Lift lobby finishes upgrade",
      amount: 35_200_000,
      timeImpactDays: 0,
      status: "approved",
      raisedBy: ref(person.folake),
      raisedAt: at(-52, "12:40"),
      decidedBy: ref(person.adaeze),
      decidedAt: at(-46, "09:15"),
    },
    {
      id: "vo_009",
      code: "VO-009",
      project: p("ICT"),
      title: "Additional basement waterproofing",
      amount: 51_200_000,
      timeImpactDays: 6,
      status: "approved",
      raisedBy: ref(person.folake),
      raisedAt: at(-58, "16:20"),
      decidedBy: ref(person.adaeze),
      decidedAt: at(-50, "11:00"),
    },
  ];

  const invoices: InvoiceRecord[] = [
    {
      id: "inv_0149",
      number: "INV-2026-0149",
      client: ref(client.oyo),
      project: p("IRP"),
      reference: "Valuation 3",
      issuedOn: null,
      dueOn: null,
      amount: 65_036_250,
      paid: 0,
      status: "draft",
    },
    {
      id: "inv_0147",
      number: "INV-2026-0147",
      client: ref(client.crestview),
      project: p("ICT"),
      reference: "Valuation 6",
      issuedOn: day(-7),
      dueOn: day(23),
      amount: 198_620_000,
      paid: 0,
      status: "issued",
    },
    {
      id: "inv_0146",
      number: "INV-2026-0146",
      client: ref(client.ngoziOkonkwo),
      project: p("LPR"),
      reference: "Unit B-07, instalment 3 of 4",
      issuedOn: day(-12),
      dueOn: day(18),
      amount: 46_250_000,
      paid: 0,
      status: "issued",
    },
    {
      id: "inv_0145",
      number: "INV-2026-0145",
      client: ref(client.arewa),
      project: p("MTC"),
      reference: "Terraces T7–T8, instalment 2",
      issuedOn: day(-17),
      dueOn: day(13),
      amount: 72_400_000,
      paid: 33_500_000,
      status: "issued",
    },
    {
      id: "inv_0144",
      number: "INV-2026-0144",
      client: ref(client.yabaLabs),
      project: p("YTH"),
      reference: "Valuation 1",
      issuedOn: day(-21),
      dueOn: day(9),
      amount: 29_930_000,
      paid: 0,
      status: "issued",
    },
    {
      id: "inv_0143",
      number: "INV-2026-0143",
      client: ref(client.crestview),
      project: p("ICT"),
      reference: "Valuation 5",
      issuedOn: day(-35),
      dueOn: day(-5),
      amount: 176_300_000,
      paid: 176_300_000,
      status: "issued",
    },
    {
      id: "inv_0141",
      number: "INV-2026-0141",
      client: ref(client.harbourline),
      project: p("VIR"),
      reference: "Final account",
      issuedOn: day(-25),
      dueOn: day(-11),
      amount: 23_100_000,
      paid: 23_100_000,
      status: "issued",
    },
    {
      id: "inv_0140",
      number: "INV-2026-0140",
      client: ref(client.ifeoma),
      project: p("LPR"),
      reference: "Unit A-03, instalment 2 of 4",
      issuedOn: day(-26),
      dueOn: day(-12),
      amount: 46_250_000,
      paid: 46_250_000,
      status: "issued",
    },
    {
      id: "inv_0138",
      number: "INV-2026-0138",
      client: ref(client.emekaNwosu),
      project: p("MTC"),
      reference: "Terrace T6, final payment",
      issuedOn: day(-27),
      dueOn: day(-13),
      amount: 12_500_000,
      paid: 0,
      status: "issued",
    },
    {
      id: "inv_0131",
      number: "INV-2026-0131",
      client: ref(client.crestview),
      project: p("ICT"),
      reference: "Variations VO-009, VO-010",
      issuedOn: day(-42),
      dueOn: day(-12),
      amount: 86_400_000,
      paid: 0,
      status: "issued",
    },
  ];

  const stockRows: [string, string, string, Ref, number, number, string, Naira][] = [
    [
      "Cement 42.5R (50kg bag)",
      "CEM-425",
      "Cement & aggregates",
      store.lekki,
      38,
      150,
      "bags",
      9_800,
    ],
    [
      "Cement 42.5R (50kg bag)",
      "CEM-425",
      "Cement & aggregates",
      store.yard,
      1_240,
      400,
      "bags",
      9_800,
    ],
    ["Sharp sand", "AGG-SND", "Cement & aggregates", store.lekki, 18, 20, "t", 14_500],
    ["Granite ¾″", "AGG-GR34", "Cement & aggregates", store.ikoyi, 64, 30, "t", 32_000],
    ["Rebar 16mm", "STL-R16", "Steel", store.ikoyi, 2.1, 8, "t", 1_050_000],
    ["Rebar 12mm", "STL-R12", "Steel", store.lekki, 6.2, 4, "t", 1_020_000],
    ["BRC mesh A142", "STL-A142", "Steel", store.maitama, 0, 20, "sheets", 46_000],
    ["Hollow blocks 9″", "MAS-B9", "Masonry", store.lekki, 4_200, 1_500, "pcs", 650],
    ["Marine plywood 18mm", "FRM-PLY18", "Formwork", store.yard, 310, 120, "sheets", 28_500],
    [
      "Long-span aluminium roofing 0.55mm",
      "ROF-AL55",
      "Roofing",
      store.yard,
      1_850,
      600,
      "m²",
      7_200,
    ],
    ["PVC pipe 4″ (6m)", "PLB-P4", "Plumbing", store.ikoyi, 140, 60, "lengths", 6_800],
    ["Cable 2.5mm² (100m roll)", "ELC-C25", "Electrical", store.yaba, 24, 10, "rolls", 62_000],
    ["Porcelain tiles 60×60", "FIN-T60", "Finishes", store.maitama, 420, 150, "m²", 11_500],
    ["Emulsion paint (20L)", "FIN-EM20", "Finishes", store.maitama, 36, 40, "pails", 38_000],
  ];
  const stock: StockRecord[] = stockRows.map(
    ([name, sku, category, location, quantity, reorderLevel, unit, unitPrice], index) => ({
      id: `stk_${String(index + 1).padStart(2, "0")}`,
      name,
      sku,
      category,
      location,
      quantity,
      reorderLevel,
      unit,
      unitPrice,
    }),
  );

  const service = (offset: number, description: string) => ({ dueOn: day(offset), description });
  const equipment: EquipmentRecord[] = [
    {
      id: "eqp_001",
      code: "EQ-001",
      name: "Tower crane 8t",
      status: "in_use",
      location: "Ikoyi Crest Towers",
      nextService: service(16, "Monthly inspection"),
    },
    {
      id: "eqp_002",
      code: "EQ-002",
      name: "Tower crane 6t",
      status: "in_use",
      location: "Lekki Palms Residences",
      nextService: service(8, "Monthly inspection"),
    },
    {
      id: "eqp_003",
      code: "EQ-003",
      name: "Concrete pump 36m",
      status: "in_use",
      location: "Ikoyi Crest Towers",
      nextService: service(24, "Service"),
    },
    {
      id: "eqp_004",
      code: "EQ-004",
      name: "Excavator 20t",
      status: "in_use",
      location: "Ibadan Ring Road Plaza",
      nextService: service(2, "250-hour service"),
    },
    {
      id: "eqp_005",
      code: "EQ-005",
      name: "Backhoe loader",
      status: "available",
      location: "Central yard, Ikeja",
      nextService: service(34, "Service"),
    },
    {
      id: "eqp_006",
      code: "EQ-006",
      name: "Generator 100 kVA",
      status: "in_use",
      location: "Lekki Palms Residences",
      nextService: service(7, "Oil and filters"),
    },
    {
      id: "eqp_007",
      code: "EQ-007",
      name: "Generator 60 kVA",
      status: "in_use",
      location: "Maitama Court",
      nextService: service(22, "Service"),
    },
    {
      id: "eqp_008",
      code: "EQ-008",
      name: "Concrete mixer 350L",
      status: "in_use",
      location: "Lekki Palms Residences",
      nextService: service(49, "Service"),
    },
    {
      id: "eqp_009",
      code: "EQ-009",
      name: "Dumper 6t",
      status: "maintenance",
      location: "Ibadan Ring Road Plaza",
      nextService: null,
    },
    {
      id: "eqp_010",
      code: "EQ-010",
      name: "Telehandler 4t",
      status: "in_use",
      location: "Yaba Tech Hub fit-out",
      nextService: service(13, "Service"),
    },
    {
      id: "eqp_011",
      code: "EQ-011",
      name: "Plate compactor",
      status: "available",
      location: "Central yard, Ikeja",
      nextService: service(36, "Service"),
    },
    {
      id: "eqp_012",
      code: "EQ-012",
      name: "Scaffold set (600 m²)",
      status: "in_use",
      location: "Lekki Palms Residences",
      nextService: service(4, "Weekly inspection"),
    },
  ];

  const approval = (
    id: string,
    kind: ApprovalKind,
    title: string,
    by: Ref,
    offset: number,
    time: string,
  ): ApprovalRecord => ({ id, kind, title, requestedBy: ref(by), requestedAt: at(offset, time) });
  const approvals: ApprovalRecord[] = [
    approval("MR-0412", "material_request", "Cement 42.5R × 200 bags", person.chinedu, -1, "10:12"),
    approval("MR-0411", "material_request", "Rebar 16mm × 10 t", person.folake, -1, "09:40"),
    approval(
      "MR-0410",
      "material_request",
      "BRC mesh A142 × 30 sheets",
      person.ibrahim,
      -2,
      "15:05",
    ),
    approval("MR-0409", "material_request", "Sharp sand × 40 t", person.tolu, -2, "11:30"),
    approval("TS-1", "timesheet", "Masonry crew A (22)", person.sunday, -1, "18:00"),
    approval("TS-2", "timesheet", "Steel fixers (14)", person.folake, -1, "18:05"),
    approval("TS-3", "timesheet", "Carpenters & formwork (11)", person.folake, -1, "18:06"),
    approval("TS-4", "timesheet", "Finishing crew (12)", person.ibrahim, -1, "17:50"),
    approval("TS-5", "timesheet", "Groundworks crew (9)", person.kunle, -1, "17:45"),
    approval("TS-6", "timesheet", "Emeka Obi, crane operator", person.folake, -1, "18:07"),
    approval("TS-7", "timesheet", "Yakubu Garba, plant operator", person.kunle, -1, "17:46"),
    approval(
      "PO-2026-0233",
      "purchase_order",
      "Northgate Cement Distributors · Cement 42.5R × 1,000 bags",
      person.bisi,
      -2,
      "14:20",
    ),
    approval(
      "PO-2026-0232",
      "purchase_order",
      "Apex Steel Ltd · Rebar 16mm × 20 t",
      person.folake,
      -3,
      "12:10",
    ),
    // Waiting on the Lekki Palms budget tab; deciding it there clears it here.
    approval(
      "VO-007",
      "variation_order",
      "Lekki Palms Residences · Upgrade penthouse windows",
      person.chinedu,
      -5,
      "11:20",
    ),
  ];

  const certifications: CertificationRecord[] = [
    { id: "crt_1", person: ref(person.tolu), name: "Working at height", expiresOn: day(9) },
    { id: "crt_2", person: ref(person.sunday), name: "Working at height", expiresOn: day(14) },
    { id: "crt_3", person: ref(person.emeka), name: "Working at height", expiresOn: day(19) },
    { id: "crt_4", person: ref(person.emeka), name: "Tower crane operation", expiresOn: day(160) },
    {
      id: "crt_5",
      person: ref(person.yakubu),
      name: "Plant operation (excavator)",
      expiresOn: day(210),
    },
  ];

  const developments: DevelopmentRecord[] = [
    {
      id: "dev_lekki",
      name: "Lekki Palms Residences",
      units: { sold: 22, reserved: 6, leased: 0, available: 20 },
    },
    {
      id: "dev_maitama",
      name: "Maitama Court",
      units: { sold: 9, reserved: 2, leased: 0, available: 1 },
    },
    {
      id: "dev_ajah",
      name: "Ajah Gardens Phase II",
      units: { sold: 6, reserved: 4, leased: 0, available: 26 },
    },
    {
      id: "dev_gbagada",
      name: "Gbagada Mews",
      units: { sold: 4, reserved: 1, leased: 2, available: 5 },
    },
  ];

  // ₦ millions, oldest first, ending with the current month (to date).
  const monthly: [number, number][] = [
    [420, 398],
    [380, 402],
    [455, 390],
    [498, 470],
    [560, 512],
    [534, 520],
    [512, 468],
    [640, 590],
    [585, 502],
    [720, 655],
    [698, 610],
    [742, 455],
  ];
  const cashFlow: CashFlowMonth[] = monthly.map(([invoiced, collected], index) => ({
    month: lagosMonth(now, index - (monthly.length - 1)),
    invoiced: invoiced * MILLION,
    collected: collected * MILLION,
  }));

  const notifications: Notification[] = [
    {
      id: "ntf_1",
      title: "INV-2026-0131 is 12 days overdue · Crestview Holdings Ltd",
      createdAt: at(0, "08:00"),
      read: false,
      href: "/invoices",
    },
    {
      id: "ntf_2",
      title: "Excavator 20t (EQ-004) is due its 250-hour service in 2 days",
      createdAt: at(0, "07:30"),
      read: false,
      href: "/equipment",
    },
    {
      id: "ntf_3",
      title: "Folake Adeyemi raised PO-2026-0232 for your approval",
      createdAt: at(-1, "17:40"),
      read: false,
      href: "/inventory",
    },
    {
      id: "ntf_4",
      title: "Chinedu Eze filed the daily report for Lekki Palms Residences",
      createdAt: at(-1, "16:52"),
      read: false,
      href: "/projects/prj_lekki/reports",
    },
    {
      id: "ntf_5",
      title: "3 Working at height certificates expire within three weeks",
      createdAt: at(-1, "09:00"),
      read: false,
      href: "/staff",
    },
    {
      id: "ntf_6",
      title: "Crestview Holdings Ltd paid INV-2026-0143 in full",
      createdAt: at(-5, "11:20"),
      read: true,
      href: "/invoices",
    },
  ];

  return {
    day: day(0),
    currentUser: {
      id: person.adaeze.id,
      name: person.adaeze.name,
      email: "adaeze.okafor@brickbybrick.example",
      role: person.adaeze.role,
    },
    people: Object.values(person),
    projects,
    phases,
    budgets,
    issues,
    teams,
    milestones,
    siteReports,
    variationOrders,
    invoices,
    stock,
    equipment,
    approvals,
    certifications,
    developments,
    cashFlow,
    notifications,
  };
}
