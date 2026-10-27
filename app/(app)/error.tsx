"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";

/**
 * The last line of defence for a page inside the shell: anything a
 * QueryBoundary didn't catch lands here, with the sidebar and top bar still
 * working around it. `retry` re-fetches and re-renders the page.
 */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Where an error-reporting service (Sentry, say) will hook in.
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState
        title="This page ran into a problem"
        description="It's been logged. Try again, or use the navigation to carry on elsewhere."
        onRetry={retry}
      />
    </Card>
  );
}
