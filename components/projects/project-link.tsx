"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Ref } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { projectQueries } from "@/lib/queries/projects";

/** The tabs of a project's page; each is a route under /projects/[id]. */
export const PROJECT_TABS = [
  { tab: undefined, label: "Overview" },
  { tab: "schedule", label: "Schedule" },
  { tab: "reports", label: "Daily reports" },
  { tab: "budget", label: "Budget" },
  { tab: "team", label: "Team" },
] as const;

export type ProjectTab = NonNullable<(typeof PROJECT_TABS)[number]["tab"]>;

/** /projects/prj_lekki, or one of its tabs: /projects/prj_lekki/budget */
export function projectHref(id: string, tab?: ProjectTab): string {
  return `/projects/${encodeURIComponent(id)}${tab ? `/${tab}` : ""}`;
}

/**
 * The id in the URL of the project page this renders on.
 *
 * It reads the URL, which isn't known while a /projects/[id] page is
 * prerendered, so only call it inside a QueryBoundary or BrowserOnly: there
 * it runs in the browser alone.
 */
export function useProjectId(): string {
  return useParams<{ id: string }>().id;
}

interface ProjectLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  project: Ref;
  tab?: ProjectTab;
}

/**
 * A link to a project's page. It starts fetching the project the moment the
 * pointer is over it (or it has keyboard focus), so by the time the click
 * lands the page's header usually has its data. Next fetches the page's
 * code ahead of time in the same way.
 */
export function ProjectLink({
  project,
  tab,
  className,
  children,
  onPointerEnter,
  onFocus,
  ...props
}: ProjectLinkProps) {
  const queryClient = useQueryClient();
  const prefetch = () => void queryClient.prefetchQuery(projectQueries.detail(project.id));

  return (
    <Link
      href={projectHref(project.id, tab)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        prefetch();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prefetch();
      }}
      className={cn("font-medium text-ink hover:underline", className)}
      {...props}
    >
      {children ?? project.name}
    </Link>
  );
}
