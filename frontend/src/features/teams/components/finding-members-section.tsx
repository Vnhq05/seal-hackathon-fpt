"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";
import { enrollmentWaitingListKey } from "@/features/events/hooks/use-enrollment";
import { useMatchingCandidates, matchingCandidatesKey } from "@/features/teams/hooks/use-matching-candidates";
import { usePublicMatchingProfile } from "@/features/teams/hooks/use-public-matching-profile";
import { PublicProfileModal } from "@/features/teams/components/public-profile-modal";
import { formatUniversityDisplay } from "@/lib/university";

interface FindingMembersSectionProps {
  eventId: string;
  teamId: string;
}

export function FindingMembersSection({ eventId, teamId }: FindingMembersSectionProps) {
  const { data: candidates = [], isLoading, error } = useMatchingCandidates(eventId, teamId);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();
    if (!keyword) return candidates;
    return candidates.filter((c) => (c.preferredRole ?? "").toLowerCase().includes(keyword));
  }, [candidates, appliedKeyword]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.userId === profileUserId),
    [candidates, profileUserId],
  );

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = usePublicMatchingProfile(eventId, teamId, profileUserId ?? undefined, profileUserId != null);

  const { mutate: invite, isPending: inviting, variables: invitingUserId } = useMutation({
    mutationFn: (userId: string) => invitationApi.send(teamId, { inviteeUserId: userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchingCandidatesKey(eventId, teamId) });
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: ["pending-invites", teamId] });
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(eventId) });
    },
  });

  const applySearch = () => setAppliedKeyword(keywordInput);

  return (
    <div className="mb-4 border-t border-seal-border-light pt-4">
      <h4 className="text-xs font-medium text-seal-text-secondary">Finding members</h4>
      <p className="mt-1 text-[11px] text-seal-text-muted">
        Participants who enabled &quot;I am looking for a team&quot; in this event.
      </p>

      <div className="mt-2 flex gap-2">
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          placeholder="Search by preferred role"
          className="flex-1 border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text shadow-[2px_2px_0_0_#0c1228] outline-none focus:border-royal/40"
        />
        <button
          type="button"
          onClick={applySearch}
          className="border-2 border-navy bg-white px-4 py-2 text-navy font-mono text-sm font-bold shadow-[2px_2px_0_0_#0c1228]"
        >
          Search
        </button>
      </div>

      {isLoading && (
        <p className="mt-3 text-xs text-seal-text-muted">Loading candidates...</p>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-600">
          {error instanceof Error ? error.message : "Failed to load candidates"}
        </p>
      )}

      {!isLoading && !error && candidates.length === 0 && (
        <p className="mt-3 text-xs text-seal-text-muted">No participants are currently looking for a team.</p>
      )}

      {!isLoading && !error && candidates.length > 0 && filtered.length === 0 && (
        <p className="mt-3 text-xs text-seal-text-muted">
          {`No candidates found with preferred role "${appliedKeyword.trim()}".`}
        </p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {filtered.map((candidate) => {
            const invitingThis = inviting && invitingUserId === candidate.userId;
            return (
              <li
                key={candidate.userId}
                className="border-2 border-navy bg-white p-3 shadow-[2px_2px_0_0_#0c1228]"
              >
                <div className="flex items-center justify-between gap-3">
                  {candidate.isProfilePublic ? (
                    <button
                      type="button"
                      onClick={() => setProfileUserId(candidate.userId)}
                      className="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-seal-text underline decoration-sky-200 decoration-1 underline-offset-[3px] hover:text-sky-700"
                      title="View public profile and achievements"
                    >
                      {candidate.fullName}
                    </button>
                  ) : (
                    <div className="min-w-0 truncate text-sm font-medium text-seal-text">
                      {candidate.fullName}
                    </div>
                  )}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => invite(candidate.userId)}
                      disabled={candidate.hasPendingInvitation || invitingThis}
                      className="border-2 border-navy bg-seal-yellow px-3 py-1 text-[11px] font-bold text-navy shadow-[2px_2px_0_0_#0c1228] disabled:opacity-50"
                    >
                      {candidate.hasPendingInvitation ? "Invited" : invitingThis ? "Sending..." : "Invite"}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-seal-text-muted truncate">
                  {formatUniversityDisplay(
                    candidate.userType ?? "FPT_STUDENT",
                    candidate.universityName,
                  )}
                  {candidate.semester != null ? ` · Semester ${candidate.semester}` : ""}
                  {` · Preferred role: ${candidate.preferredRole ?? "—"}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {profileUserId && (
        <PublicProfileModal
          profile={
            profile ?? {
              userId: profileUserId,
              fullName: selectedCandidate?.fullName ?? "Participant",
              email: null,
              phone: null,
              avatarUrl: null,
              studentId: null,
              userType: selectedCandidate?.userType ?? "FPT_STUDENT",
              universityName: selectedCandidate?.universityName ?? null,
              studentStanding: null,
              semester: selectedCandidate?.semester ?? null,
              temporaryAccount: false,
              createdAt: null,
              competitions: [],
            }
          }
          loading={profileLoading}
          error={profileError}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  );
}
