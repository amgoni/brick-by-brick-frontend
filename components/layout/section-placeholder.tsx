import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { findNavItem } from "@/lib/nav";

/**
 * Stands in for a section that hasn't been built yet, so every link in the
 * navigation goes somewhere. Each page using it is replaced, one by one, as
 * its module is built from its design board.
 */
export function SectionPlaceholder({ href }: { href: string }) {
  const item = findNavItem(href);
  if (!item) throw new Error(`No navigation item for ${href}`);
  const Icon = item.icon;

  return (
    <>
      <PageHeader title={item.label} description={item.description} />
      <Card>
        <EmptyState
          icon={<Icon />}
          title={`${item.label} is on the build list`}
          description="This page is built from its design board in a later step. Until then, the dashboard has the headlines."
          action={
            <Button asChild>
              <Link href="/">Back to the dashboard</Link>
            </Button>
          }
        />
      </Card>
    </>
  );
}
