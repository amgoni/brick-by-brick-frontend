import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <Logo />
      <EmptyState
        icon={<MapPinOff />}
        title="There's nothing at this address"
        description="The page may have moved, or the link may be mistyped."
        action={
          <Button asChild variant="primary">
            <Link href="/">Go to the dashboard</Link>
          </Button>
        }
      />
    </main>
  );
}
