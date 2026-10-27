import type { Metadata } from "next";
import { ActiveProjectsCard } from "@/components/dashboard/active-projects-card";
import { ApprovalsCard } from "@/components/dashboard/approvals-card";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { CashFlowCard } from "@/components/dashboard/cash-flow-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiTiles } from "@/components/dashboard/kpi-tiles";
import { MilestonesCard } from "@/components/dashboard/milestones-card";
import { SalesCard } from "@/components/dashboard/sales-card";
import { SiteReportsCard } from "@/components/dashboard/site-reports-card";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * A Server Component that only arranges the cards. Each card fetches its own
 * data in the browser, so the static HTML is the whole layout with skeletons
 * where the figures go, and every card fills in as its request returns.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <KpiTiles />

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[2_1_37.5rem] flex-col gap-4">
          <ActiveProjectsCard />
          <CashFlowCard />
        </div>
        <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-4">
          <AttentionCard />
          <ApprovalsCard />
          <SalesCard />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(26.25rem,100%),1fr))] gap-4">
        <MilestonesCard />
        <SiteReportsCard />
      </div>
    </div>
  );
}
