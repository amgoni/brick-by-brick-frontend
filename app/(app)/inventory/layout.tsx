import { InventoryHeader, InventoryTabs } from "@/components/inventory/inventory-header";

/*
 * The four tabs of Inventory share this frame. Each is its own page, so the
 * dashboard can open straight onto the requests waiting for approval.
 */
export default function InventoryLayout({ children }: LayoutProps<"/inventory">) {
  return (
    <>
      <InventoryHeader />
      <InventoryTabs />
      {children}
    </>
  );
}
