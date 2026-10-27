import { AppShell } from "@/components/layout/app-shell";

/**
 * Every page inside the app frame. A route group: "(app)" groups these pages
 * under one layout without adding anything to their URLs, so the dashboard
 * is "/", not "/app". The sign-in page will sit outside it, with no shell.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
