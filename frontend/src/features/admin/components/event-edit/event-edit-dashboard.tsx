"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { EventPhasePanel } from "@/features/events/components/event-phase-panel";
import {
  EventEditTabs,
  isValidEventEditTab,
  type EventEditTabId,
} from "@/features/admin/components/event-edit/event-edit-tabs";
import { BasicInformationTab } from "@/features/admin/components/event-edit/tabs/basic-information-tab";
import { AddTracksTab } from "@/features/admin/components/event-edit/tabs/add-tracks-tab";
import { AddRoundsTab } from "@/features/admin/components/event-edit/tabs/add-rounds-tab";
import { PrizesHonoredGuestTab } from "@/features/admin/components/event-edit/tabs/prizes-honored-guest-tab";
import { AddLectureTab } from "@/features/admin/components/event-edit/tabs/add-lecture-tab";
import { EnrollmentsTab } from "@/features/admin/components/event-edit/tabs/enrollments-tab";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED_REGISTRATION: "Registration Closed",
  ACTIVE: "Active",
  SCORING: "Scoring",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function EventEditDashboard({
  eventId,
  defaultTab,
}: {
  eventId: string;
  defaultTab?: EventEditTabId;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalBase = useStaffPortalBase();
  const tabParam = searchParams.get("tab");
  const activeTab: EventEditTabId =
    (isValidEventEditTab(tabParam) ? tabParam : null) ?? defaultTab ?? "basic";

  const { data: event, isLoading, isError } = useAdminEvent(eventId);

  const setActiveTab = useCallback(
    (tab: EventEditTabId) => {
      router.replace(`${portalBase}/hackathons/${eventId}?tab=${tab}`, { scroll: false });
    },
    [eventId, portalBase, router],
  );

  const tabContent = useMemo(() => {
    if (!event) return null;
    switch (activeTab) {
      case "basic":
        return <BasicInformationTab event={event} />;
      case "tracks":
        return <AddTracksTab event={event} />;
      case "rounds":
        return <AddRoundsTab event={event} />;
      case "prizes":
        return <PrizesHonoredGuestTab event={event} />;
      case "lecture":
        return <AddLectureTab eventId={eventId} />;
      case "enrollments":
        return <EnrollmentsTab eventId={eventId} />;
      default:
        return <BasicInformationTab event={event} />;
    }
  }, [activeTab, event, eventId]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-4">
        <div className="mb-4 h-8 w-72 animate-pulse rounded bg-seal-border/80" />
        <div className="h-48 animate-pulse rounded bg-seal-border/80" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-4">
        <p className="text-red-700">Failed to load event.</p>
        <Link href={`${portalBase}/hackathons`} className="mt-2 inline-block text-sm text-sky-600">
          ← Back to Event Management
        </Link>
      </div>
    );
  }

  const contentMaxWidth = activeTab === "enrollments" ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className={`mx-auto w-full ${contentMaxWidth} px-2 py-2 sm:px-4`}>
      <Link
        href={`${portalBase}/hackathons`}
        className="mb-5 inline-flex items-center gap-1 text-[13px] text-seal-text-muted no-underline transition-colors hover:text-navy"
      >
        ← Back to Event Management
      </Link>

      <header className="mb-8 border-b-2 border-navy/10 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-navy sm:text-[32px]">
          {event.name}
        </h1>
        <p className="mt-2 text-sm text-seal-text-muted">
          {event.season} {event.year}
          <span className="mx-2 text-navy/20">·</span>
          {STATUS_LABELS[event.status] ?? event.status}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <EventPhasePanel eventId={eventId} currentStatus={event.status} />

        <div className="border-t-2 border-navy/10 pt-6">
          <EventEditTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="min-w-0">{tabContent}</div>
      </div>
    </div>
  );
}
