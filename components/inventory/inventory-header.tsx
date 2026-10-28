"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Count } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TabNav, TabNavLink } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useMaterialRequests, usePurchaseOrders } from "@/lib/queries/inventory";
import { useUiStore } from "@/store/ui.store";

export function InventoryHeader() {
  const openPurchaseOrder = useUiStore((state) => state.openPurchaseOrder);
  return (
    <PageHeader
      title="Inventory"
      description="Stock across the central yard and every site store. Requests from site land here for approval."
      actions={
        <>
          <Button onClick={() => toast("Stock transfers are on the build list.")}>
            <ArrowLeftRight />
            Transfer stock
          </Button>
          <Button variant="primary" onClick={() => openPurchaseOrder()}>
            <Plus />
            New purchase order
          </Button>
        </>
      }
    />
  );
}

const TABS = [
  { href: "/inventory", label: "Stock on hand" },
  { href: "/inventory/requests", label: "Requests", waiting: "requests" },
  { href: "/inventory/orders", label: "Purchase orders", waiting: "orders" },
  { href: "/inventory/movements", label: "Movements" },
] as const;

/**
 * Each tab is a page, so the dashboard can link straight to the requests
 * waiting for approval. Requests and Purchase orders show how many are
 * waiting, from the same lists those tabs show.
 */
export function InventoryTabs() {
  const pathname = usePathname();
  return (
    <TabNav aria-label="Inventory sections">
      {TABS.map((tab) => (
        <TabNavLink key={tab.href} href={tab.href} active={pathname === tab.href}>
          {tab.label}
          {"waiting" in tab && (
            <QueryBoundary fallback={null} errorFallback={() => null}>
              {tab.waiting === "requests" ? <WaitingRequests /> : <WaitingOrders />}
            </QueryBoundary>
          )}
        </TabNavLink>
      ))}
    </TabNav>
  );
}

function Waiting({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <>
      <Count value={count} />
      <span className="sr-only"> waiting</span>
    </>
  );
}

function WaitingRequests() {
  const { data } = useMaterialRequests();
  return <Waiting count={data.filter((request) => request.status === "pending").length} />;
}

function WaitingOrders() {
  const { data } = usePurchaseOrders();
  return <Waiting count={data.filter((order) => order.status === "awaiting_approval").length} />;
}
