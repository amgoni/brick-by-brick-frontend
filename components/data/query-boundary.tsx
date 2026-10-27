"use client";

import { QueryErrorResetBoundary, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Component } from "react";
import { BrowserOnly } from "@/components/ui/browser-only";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/client";

interface ErrorFallbackProps {
  error: Error;
  /** Clears the error and refetches what failed. */
  retry: () => void;
}

interface QueryBoundaryProps {
  /**
   * The skeleton: what the server prerenders, and what shows while the data
   * loads. Size it like the content so nothing jumps when it arrives.
   */
  fallback: React.ReactNode;
  /** Shown if a query below fails. Defaults to an ErrorState with a retry. */
  errorFallback?: (props: ErrorFallbackProps) => React.ReactNode;
  children: React.ReactNode;
}

/**
 * The wrapper every piece of fetched data sits in. Inside it, components call
 * `useSuspenseQuery` (through the hooks in lib/queries) and get their data
 * back already loaded, with no `isPending` or `error` branches of their own:
 *
 *   <QueryBoundary fallback={<TableSkeleton />}>
 *     <ProjectsTable />   ← const { data } = useProjects()
 *   </QueryBoundary>
 *
 * It does three jobs:
 *
 * - Browser only. Data comes from the API after hydration, so the server
 *   renders the fallback; that's also what keeps TanStack Query's clock reads
 *   out of the static prerender (see BrowserOnly).
 * - Loading. While a query is in flight the fallback shows. Once there's data,
 *   background refetches keep showing it.
 * - Errors. A failed query renders `errorFallback`, and its retry resets the
 *   query so the next render fetches again.
 */
export function QueryBoundary({
  fallback,
  errorFallback = defaultErrorFallback,
  children,
}: QueryBoundaryProps) {
  const queryClient = useQueryClient();
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary queryClient={queryClient} onReset={reset} fallback={errorFallback}>
          <BrowserOnly fallback={fallback}>{children}</BrowserOnly>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function defaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return <ErrorState description={describeError(error)} onRetry={retry} />;
}

/** What to tell a person about a failure: the server's own words when it sent some. */
export function describeError(error: Error): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again in a moment.";
}

interface ErrorBoundaryProps {
  queryClient: QueryClient;
  onReset: () => void;
  fallback: (props: ErrorFallbackProps) => React.ReactNode;
  children: React.ReactNode;
}

/**
 * React only catches render errors in a class component; there's no hook for
 * it. This is a small one, plus one thing a generic boundary can't do.
 *
 * One request often feeds several boundaries (the dashboard summary feeds
 * eight), so one failure shows up in each of them. Retrying any one of them
 * refetches the shared query, and the rest should recover with it rather than
 * wait to be clicked too. So while showing an error, the boundary watches the
 * query that threw it, found by identity (TanStack Query throws the very
 * error object it keeps in the query's state), and resets itself the moment
 * that query succeeds.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };
  private unsubscribe: (() => void) | undefined;

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(_: ErrorBoundaryProps, previous: { error: Error | null }) {
    const { error } = this.state;
    if (!error || error === previous.error) return;
    const cache = this.props.queryClient.getQueryCache();
    const failed = cache.getAll().find((query) => query.state.error === error);
    if (!failed) return;
    this.unsubscribe?.();
    this.unsubscribe = cache.subscribe((event) => {
      if (event.query === failed && failed.state.status === "success") this.retry();
    });
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  retry = () => {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    return error ? this.props.fallback({ error, retry: this.retry }) : this.props.children;
  }
}
