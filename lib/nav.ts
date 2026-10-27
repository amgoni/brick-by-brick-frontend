import {
  Building2,
  ChartColumn,
  ContactRound,
  Folder,
  Forklift,
  HardHat,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceCounts } from "@/lib/api/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** One line on what the section is for: page subtitles and the palette. */
  description: string;
  /** Which of the workspace counts shows beside it. */
  badge?: keyof Pick<WorkspaceCounts, "inventory" | "staff">;
}

export interface NavSection {
  /** Small caps heading above the group; the first section has none. */
  label?: string;
  items: NavItem[];
}

/** The sidebar, in the design's order and grouping. */
export const NAV: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Where things stand across every site, and what needs you today.",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Projects & sites",
        href: "/projects",
        icon: HardHat,
        description:
          "Every project's progress, schedule, budget and site activity, from groundbreaking to handover.",
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: Package,
        badge: "inventory",
        description:
          "Stock across sites and the yard, material requests from the field, and purchase orders.",
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        description: "Who you buy from, what they quoted, and how they've delivered.",
      },
      {
        label: "Equipment",
        href: "/equipment",
        icon: Forklift,
        description:
          "Owned and hired plant: where it is, who's running it, and when it's due a service.",
      },
      {
        label: "Staff",
        href: "/staff",
        icon: Users,
        badge: "staff",
        description: "Your people and crews: attendance, timesheets and certifications.",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Invoices",
        href: "/invoices",
        icon: Receipt,
        description: "Valuations and sale instalments: what's been billed, paid and overdue.",
      },
      {
        label: "Reports",
        href: "/reports",
        icon: ChartColumn,
        description: "Cash flow, budgets and productivity across every project.",
      },
    ],
  },
  {
    label: "Sales & clients",
    items: [
      {
        label: "Properties",
        href: "/properties",
        icon: Building2,
        description: "Units across your developments: sold, reserved, leased and available.",
      },
      {
        label: "Clients",
        href: "/clients",
        icon: ContactRound,
        description: "Buyers, tenants and commercial clients, with every invoice and conversation.",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Documents",
        href: "/documents",
        icon: Folder,
        description: "Drawings, contracts, permits and certificates, with versions and approvals.",
      },
      {
        label: "Users & roles",
        href: "/users",
        icon: ShieldCheck,
        description: "Who can see and do what, across the company.",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Company details, numbering, notifications and integrations.",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((section) => section.items);

export function findNavItem(href: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.href === href);
}

/** Whether `href` is the current section: exact for "/", otherwise by prefix. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
