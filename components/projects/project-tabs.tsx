"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PROJECT_TABS,
  projectHref,
  useProjectId,
  type ProjectTab,
} from "@/components/projects/project-link";
import { BrowserOnly } from "@/components/ui/browser-only";
import { Button, type ButtonProps } from "@/components/ui/button";
import { TabNav, TabNavLink } from "@/components/ui/tabs";

const LABEL = "Project sections";

/**
 * Overview, Schedule, Daily reports, Budget, Team: each a page of its own,
 * so a link can open straight onto a project's budget.
 *
 * The links need the project's id and the highlight needs the path, neither
 * of which is known while the page is prerendered, so the prerendered HTML
 * has the same tabs as placeholders and the real links take over in the
 * browser.
 */
export function ProjectTabs() {
  return (
    <BrowserOnly
      fallback={
        <TabNav aria-label={LABEL}>
          {PROJECT_TABS.map(({ label }) => (
            <TabNavLink key={label}>{label}</TabNavLink>
          ))}
        </TabNav>
      }
    >
      <CurrentProjectTabs />
    </BrowserOnly>
  );
}

function CurrentProjectTabs() {
  const id = useProjectId();
  const pathname = usePathname();
  return (
    <TabNav aria-label={LABEL}>
      {PROJECT_TABS.map(({ tab, label }) => {
        const href = projectHref(id, tab);
        return (
          <TabNavLink key={label} href={href} active={pathname === href}>
            {label}
          </TabNavLink>
        );
      })}
    </TabNav>
  );
}

interface ProjectTabButtonProps extends Omit<ButtonProps, "asChild"> {
  tab: ProjectTab;
}

/**
 * A button that opens another tab of the project on screen: "Open schedule"
 * on the overview. For the same reason as the tabs, it's a disabled button in
 * the prerendered HTML and a link once the browser knows the id.
 */
export function ProjectTabButton({ tab, children, ...props }: ProjectTabButtonProps) {
  return (
    <BrowserOnly
      fallback={
        <Button {...props} disabled>
          {children}
        </Button>
      }
    >
      <CurrentProjectTabButton tab={tab} {...props}>
        {children}
      </CurrentProjectTabButton>
    </BrowserOnly>
  );
}

function CurrentProjectTabButton({ tab, children, ...props }: ProjectTabButtonProps) {
  const id = useProjectId();
  return (
    <Button asChild {...props}>
      <Link href={projectHref(id, tab)}>{children}</Link>
    </Button>
  );
}
