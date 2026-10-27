import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  /** Usually text; a Skeleton while the record's name loads. */
  label: React.ReactNode;
  /** Omit on the last item: it's the page you're on. */
  href?: string;
}

/** Projects › Lekki Palms Residences › Schedule */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav
      data-slot="breadcrumb"
      aria-label="Breadcrumb"
      className={cn("text-md text-ink-3", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(isLast && "text-ink")}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight aria-hidden="true" className="size-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
