"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { describeError, QueryBoundary } from "@/components/data/query-boundary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useWorkspaceCounts,
} from "@/lib/queries/me";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {/* The accessible name is this text plus the unread count below,
              so it reads "Notifications, 5 unread". */}
          <span className="sr-only">Notifications</span>
          <QueryBoundary fallback={null} errorFallback={() => null}>
            <UnreadDot />
          </QueryBoundary>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <QueryBoundary fallback={<ListSkeleton rows={3} />}>
          <NotificationList onNavigate={() => setOpen(false)} />
        </QueryBoundary>
      </PopoverContent>
    </Popover>
  );
}

function UnreadDot() {
  const { data } = useWorkspaceCounts();
  if (data.unreadNotifications === 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-2.5 right-2.5 size-1.75 rounded-full bg-danger ring-2 ring-surface"
      />
      <span className="sr-only">, {data.unreadNotifications} unread</span>
    </>
  );
}

function NotificationList({ onNavigate }: { onNavigate: () => void }) {
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const now = new Date();
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-4">
        <p className="text-base font-semibold">Notifications</p>
        {unread > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              markAllRead.mutate(undefined, {
                onError: (error) => toast.error(describeError(error)),
              })
            }
          >
            Mark all as read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={<BellOff />} title="You're all caught up" className="py-8" />
      ) : (
        <ul className="max-h-[min(24rem,60dvh)] overflow-y-auto">
          {notifications.map((notification) => (
            <li key={notification.id} className="border-b border-line last:border-b-0">
              <Link
                href={notification.href}
                onClick={onNavigate}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-hover"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    !notification.read && "bg-accent",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-md", !notification.read && "font-medium")}>
                    {notification.title}
                  </span>
                  <time dateTime={notification.createdAt} className="text-sm text-ink-3">
                    {formatDateTime(notification.createdAt, now)}
                  </time>
                </span>
                {!notification.read && <span className="sr-only">Unread</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
