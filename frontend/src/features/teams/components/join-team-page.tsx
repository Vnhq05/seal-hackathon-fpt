"use client";

import { useMyActiveEnrollment } from "@/features/events/hooks/use-enrollment";
import { useHackathonPage } from "@/features/events/hooks/use-hackathon-page";
import { useInvitationParticipationGate } from "@/features/teams/hooks/use-invitation-participation-gate";
import { useTeamInvitation } from "@/features/teams/hooks/use-team-invitation";
import { ParticipationBlockBanner } from "@/features/events/components/participation-block-banner";
import { useRespondInvitation } from "@/features/teams/hooks/use-respond-invitation";
import { InvitationDetailCard } from "./invitation-detail-card";
import type { InvitationResponse } from "@/lib/api";
import {
  TeamGroupIcon,
  WarningTriangleIcon,
  CheckCircleIcon,
  XIcon,
  InfoCircleIcon,
} from "./invitation-icons";
import {
  overlayStyle,
  blurStyle,
  modalStyle,
  headerIconStyle,
  titleStyle,
  subtitleStyle,
  warningStyle,
  acceptBtnStyle,
  declineBtnStyle,
} from "./invitation-styles";

interface JoinTeamPageProps {
  invitationId: string;
}

export function JoinTeamPage({ invitationId }: JoinTeamPageProps) {
  const {
    data: rawData,
    isLoading,
    isError,
  } = useTeamInvitation(invitationId);
  // When called with an invitationId, the hook returns a single InvitationResponse | null.
  // TypeScript infers a union because the hook can also return InvitationResponse[].
  const invitation = (Array.isArray(rawData) ? rawData[0] : rawData) as
    | InvitationResponse
    | null
    | undefined;
  const { respond, isPending } = useRespondInvitation(invitationId);
  const { data: activeEnrollment } = useMyActiveEnrollment();
  const { data: event } = useHackathonPage(activeEnrollment?.eventId ?? "");
  const { canModifyMembers, registrationClosedReason } = useInvitationParticipationGate(event);

  if (isLoading) {
    return (
      <div style={overlayStyle}>
        <div style={blurStyle} />
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <p style={{ fontSize: 14, color: "#8891a5" }}>
              Loading invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div style={overlayStyle}>
        <div style={blurStyle} />
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
              Invitation not found
            </p>
            <p style={{ fontSize: 14, color: "#8891a5" }}>
              This invitation may have expired or been withdrawn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={blurStyle} />
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div style={modalStyle}>
          {/* Header */}
          <div className="flex flex-col items-center px-6 pt-6">
            <div style={headerIconStyle}>
              <TeamGroupIcon size={26} />
            </div>
            <h1 style={{ ...titleStyle, marginTop: 16 }}>
              You&apos;ve been invited to join a team
            </h1>
            <p style={{ ...subtitleStyle, marginTop: 4 }}>
              Review the invitation details below before accepting.
            </p>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
            <InvitationDetailCard invitation={invitation} />

            <div style={warningStyle}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <WarningTriangleIcon />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#b45309",
                  lineHeight: "19.25px",
                  margin: 0,
                }}
              >
                Accepting will assign you to this team and track. This cannot be
                changed later.
              </p>
            </div>

            {!canModifyMembers && registrationClosedReason && (
              <ParticipationBlockBanner reason={registrationClosedReason} />
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={isPending || !canModifyMembers}
                onClick={() => respond("accept")}
                style={{
                  ...acceptBtnStyle,
                  opacity: isPending ? 0.7 : 1,
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                <CheckCircleIcon />
                {isPending ? "Processing..." : "Accept invite"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => respond("decline")}
                style={{
                  ...declineBtnStyle,
                  opacity: isPending ? 0.7 : 1,
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                <XIcon />
                Decline
              </button>
            </div>

            <div
              style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 9 }}
              className="flex items-center justify-center gap-1"
            >
              <InfoCircleIcon />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#8891a5",
                  letterSpacing: "0.24px",
                  lineHeight: "12px",
                  textAlign: "center",
                }}
              >
                You can only be in one team per event.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
