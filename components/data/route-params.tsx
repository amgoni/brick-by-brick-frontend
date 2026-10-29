"use client";

import { createContext, use } from "react";

type Params = Record<string, string | string[] | undefined>;

const RouteParamsContext = createContext<Promise<Params> | null>(null);

interface RouteParamsProps {
  /** The `params` prop of the layout or page, passed on as it is (a promise). */
  params: Promise<Params>;
  children: React.ReactNode;
}

/**
 * Hands a dynamic route's own params to the Client Components under it, for
 * `useRouteParam`. Render it in the layout or page of the segment:
 *
 *   export default function ProjectLayout({ params, children }: LayoutProps<"/projects/[id]">) {
 *     return <RouteParams params={params}>{children}</RouteParams>;
 *   }
 *
 * The promise goes down unawaited, so the layout still prerenders as a static
 * shell (Next's advice for params under Cache Components).
 */
export function RouteParams({ params, children }: RouteParamsProps) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>;
}

/**
 * A dynamic segment's value on the page this renders on: "prj_lekki" on
 * /projects/prj_lekki.
 *
 * Why not `useParams()`: Next keeps the last few pages mounted after you leave
 * them (hidden, in <Activity>), and `useParams()` answers for whichever page
 * is showing. A hidden project page would read the invoice list's params, find
 * no id, fetch /api/projects/undefined, and say "not found" when you came back
 * to it. The params a page was rendered with stay its own.
 *
 * The value isn't known while the page is prerendered (there's no
 * generateStaticParams), so this suspends there: call it inside a
 * QueryBoundary or BrowserOnly.
 */
export function useRouteParam(name: string): string {
  const params = use(RouteParamsContext);
  if (!params) {
    throw new Error(`useRouteParam("${name}") needs a <RouteParams> in the layout or page above.`);
  }
  const value = use(params)[name];
  if (typeof value !== "string") throw new Error(`This route has no [${name}] segment.`);
  return value;
}
