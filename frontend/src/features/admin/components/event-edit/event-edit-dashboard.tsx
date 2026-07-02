"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { EventPhasePanel } from "@/features/events/components/event-phase-panel";
import { AllowedEmailDomainsPanel } from "@/features/events/components/allowed-email-domains-panel";
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
  COMPLETED: "Closed",
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
      <div style={{ padding: 24 }}>
        <div className="animate-pulse rounded" style={{ height: 32, width: 280, backgroundColor: "rgba(223,226,236,0.8)", marginBottom: 16 }} />
        <div className="animate-pulse rounded" style={{ height: 200, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "#991b1b" }}>Failed to load event.</p>
        <Link href={`${portalBase}/hackathons`} style={{ color: "#0284c7", fontSize: 14 }}>← Back to Event Management</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Link
        href={`${portalBase}/hackathons`}
        style={{ fontSize: 13, color: "#8891a5", textDecoration: "none", marginBottom: 16, display: "inline-block" }}
      >
        ← Back to Event Management
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          {event.name}
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          {event.season} {event.year} · {STATUS_LABELS[event.status] ?? event.status}
        </p>
      </div>

      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <EventPhasePanel eventId={eventId} currentStatus={event.status} />
      </div>

      <div id="allowed-email-domains" style={{ marginBottom: 24, maxWidth: 720 }}>
        <AllowedEmailDomainsPanel eventId={eventId} readOnly />
      </div>

      <div style={{ marginBottom: 24 }}>
        <EventEditTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div style={{ marginTop: 24 }}>{tabContent}</div>
    </div>
  );
}
