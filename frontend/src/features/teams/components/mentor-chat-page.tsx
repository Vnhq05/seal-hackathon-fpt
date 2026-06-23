"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMyTeamsAllEvents, type MyEventTeam } from "@/features/teams/hooks/use-my-teams-all-events";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mentorInvitationApi, mentorChatApi } from "@/lib/api";
import type { MentorInvitationResponse, MentorRoomResponse, ChatMessageResponse } from "@/lib/api";

// ═══ Icons ═══

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M13 1L6 8M13 1l-4 12-3-5-5-3 12-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 2l7 5 7-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ═══ Status Badge ═══

function StatusBadge({ status }: { status: MentorInvitationResponse["status"] }) {
  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
        <CheckIcon /> Accepted
      </span>
    );
  }
  if (status === "DENIED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
        <XSmallIcon /> Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
      <ClockIcon /> Pending
    </span>
  );
}

// ═══ Main Page ═══

export function MentorChatPage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const isStudent = user.userType === "FPT_STUDENT" || user.userType === "EXTERNAL_STUDENT";
  if (isStudent) return <StudentView />;
  return <LecturerMentorView />;
}

// ═══ Student View ═══

function StudentView() {
  const { data: allTeams, isLoading } = useMyTeamsAllEvents();
  const activeTeams = (allTeams ?? []).filter((mt) => mt.event.status !== "COMPLETED");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = activeTeams[selectedIdx] ?? null;

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" /></div>;
  }

  if (activeTeams.length === 0) {
    return (
      <div className="rounded-lg border border-seal-border bg-seal-surface p-10 text-center text-sm text-seal-text-muted">
        You haven&apos;t joined a team yet. Register for an event from the Dashboard first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">MentorHub</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          {selected?.team ? `Team: ${selected.team.name}` : "Invite a mentor, then chat"}
        </p>
      </div>

      <div className="grid gap-4 min-h-[calc(100vh-220px)]" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Sidebar */}
        <div className="rounded-lg border border-seal-border bg-seal-surface overflow-y-auto self-start max-h-full">
          <div className="border-b border-seal-border-light px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
            Your teams
          </div>
          {activeTeams.map((mt, idx) => (
            <button
              key={mt.team!.id}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full border-b border-seal-border-light px-4 py-3 text-left text-sm transition-colors ${idx === selectedIdx ? "bg-seal-cyan/5" : "hover:bg-seal-surface-sunken"}`}
            >
              <div className="font-medium text-seal-text truncate">{mt.team!.name}</div>
              <div className="text-xs text-seal-text-muted truncate">{mt.event.name}</div>
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="min-h-0">
          {selected?.team ? (
            <StudentTeamPanel
              key={selected.team.id}
              eventId={selected.event.id}
              teamId={selected.team.id}
              teamName={selected.team.name}
              isLeader={selected.team.leaderId === useAuthStore.getState().user?.id}
            />
          ) : (
            <EmptyPanel message="Select a team." />
          )}
        </div>
      </div>
    </div>
  );
}

function StudentTeamPanel({ eventId, teamId, teamName, isLeader }: {
  eventId: string; teamId: string; teamName: string; isLeader: boolean;
}) {
  const { data: room } = useQuery({
    queryKey: ["mentor-room", eventId, teamId],
    queryFn: () => mentorInvitationApi.getRoomByTeam(eventId, teamId),
    refetchInterval: 4000,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["mentor-invitations", eventId, teamId],
    queryFn: () => mentorInvitationApi.getByTeam(eventId, teamId),
    refetchInterval: 4000,
  });

  if (room) {
    return (
      <div className="rounded-lg border border-seal-border bg-seal-surface flex flex-col h-[calc(100vh-220px)]">
        <ChatRoom eventId={eventId} teamId={teamId} peerName={`Mentor`} pill={teamName} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InvitePanel eventId={eventId} teamId={teamId} teamName={teamName} isLeader={isLeader} />
      <SentInvitations invitations={invitations} />
    </div>
  );
}

function InvitePanel({ eventId, teamId, teamName, isLeader }: {
  eventId: string; teamId: string; teamName: string; isLeader: boolean;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => mentorInvitationApi.send(eventId, teamId, { mentorEmail: email.trim(), message: note.trim() || undefined }),
    onSuccess: () => {
      setEmail("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["mentor-invitations", eventId, teamId] });
    },
  });

  const handleSend = () => {
    if (!isLeader) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    send();
  };

  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface p-5 self-start">
      <div className="flex items-center gap-2 mb-1 text-seal-text">
        <MailIcon />
        <h3 className="font-semibold text-sm">Invite a mentor by email</h3>
      </div>
      <p className="text-xs text-seal-text-muted mb-4">
        Send an invitation to a mentor. They&apos;ll see it and can accept to join your team.
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-seal-text-secondary">Mentor&apos;s email</label>
          <input
            type="email"
            placeholder="mentor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isLeader}
            className="mt-1 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          />
        </div>
        <div>
          <label className="text-xs text-seal-text-secondary">Personal note (optional)</label>
          <textarea
            placeholder={`Hi! We're ${teamName} — would love your guidance.`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!isLeader}
            rows={3}
            className="mt-1 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!isLeader || isPending}
          className="w-full rounded-lg bg-seal-cyan py-2.5 text-sm font-semibold text-white transition-colors hover:bg-seal-cyan-dark disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2"><SendIcon /> {isPending ? "Sending..." : "Send invitation"}</span>
        </button>
        {!isLeader && <p className="text-xs text-seal-text-muted">Only the team leader can invite a mentor.</p>}
      </div>
    </div>
  );
}

function SentInvitations({ invitations }: { invitations: MentorInvitationResponse[] }) {
  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface p-5 self-start">
      <h3 className="font-semibold text-sm text-seal-text mb-4">Sent invitations</h3>
      {invitations.length === 0 ? (
        <p className="text-sm text-seal-text-muted">No invitations sent yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-seal-border p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-seal-text truncate">{inv.mentorEmail ?? inv.mentorName ?? `Mentor`}</div>
                <div className="text-xs text-seal-text-muted">
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ Lecturer/Mentor View ═══

function LecturerMentorView() {
  const { user } = useAuthStore();
  const { data: allTeams } = useMyTeamsAllEvents();
  const activeEvent = (allTeams ?? []).find((mt) => mt.event.status === "ACTIVE" || mt.event.status === "OPEN");
  const eventId = activeEvent?.event.id ?? "";

  const { data: pending = [] } = useQuery({
    queryKey: ["mentor-pending", eventId],
    queryFn: () => mentorInvitationApi.getPendingForMentor(eventId),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["mentor-rooms", eventId],
    queryFn: () => mentorInvitationApi.getMentorActiveRooms(eventId),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const selectedRoom = rooms[selectedRoomIdx] ?? null;
  const qc = useQueryClient();

  const { mutate: respond } = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "ACCEPTED" | "DENIED" }) =>
      mentorInvitationApi.respond(eventId, id, { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor-pending", eventId] });
      qc.invalidateQueries({ queryKey: ["mentor-rooms", eventId] });
    },
  });

  if (!eventId) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">MentorHub</h1>
        <div className="rounded-lg border border-seal-border bg-seal-surface p-10 text-center text-sm text-seal-text-muted">
          No active event found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">MentorHub</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">Your teams — {rooms.length} active</p>
      </div>

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <div className="rounded-lg border border-seal-border bg-seal-surface">
          <div className="flex items-center gap-2 border-b border-seal-border px-5 py-3">
            <MailIcon />
            <span className="font-semibold text-sm text-seal-text">Mentorship invitations</span>
            <span className="ml-auto rounded-md bg-seal-surface-elevated px-2 py-0.5 text-xs font-medium text-seal-text-secondary">{pending.length} pending</span>
          </div>
          <div className="divide-y divide-seal-border-light">
            {pending.map((req) => (
              <div key={req.id} className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-seal-text">Team #{req.teamId}</div>
                  <div className="text-xs text-seal-text-muted">
                    {req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}
                  </div>
                  {req.message && <div className="mt-1 text-sm text-seal-text-muted italic">&ldquo;{req.message}&rdquo;</div>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => respond({ id: req.id, decision: "ACCEPTED" })}
                    className="flex items-center gap-1 rounded-lg bg-seal-cyan px-3 py-1.5 text-xs font-semibold text-white hover:bg-seal-cyan-dark"
                  >
                    <CheckIcon /> Accept
                  </button>
                  <button
                    onClick={() => respond({ id: req.id, decision: "DENIED" })}
                    className="flex items-center gap-1 rounded-lg border border-seal-border bg-seal-surface px-3 py-1.5 text-xs font-semibold text-seal-text hover:bg-seal-surface-elevated"
                  >
                    <XSmallIcon /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rooms + Chat */}
      <div className="grid gap-4 h-[calc(100vh-320px)]" style={{ gridTemplateColumns: "280px 1fr" }}>
        <div className="rounded-lg border border-seal-border bg-seal-surface overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-6 text-center text-sm text-seal-text-muted">
              No teams assigned yet. Accept an invitation above to start mentoring.
            </div>
          ) : (
            rooms.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoomIdx(idx)}
                className={`w-full border-b border-seal-border-light px-4 py-3 text-left text-sm transition-colors ${idx === selectedRoomIdx ? "bg-seal-cyan/5" : "hover:bg-seal-surface-sunken"}`}
              >
                <div className="font-medium text-seal-text">Team #{r.teamId}</div>
                <div className="text-xs text-seal-text-muted">Room #{r.id}</div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-lg border border-seal-border bg-seal-surface flex flex-col min-h-0">
          {selectedRoom ? (
            <ChatRoom eventId={eventId} teamId={selectedRoom.teamId} peerName={`Team #${selectedRoom.teamId}`} pill="Mentor" />
          ) : (
            <EmptyPanel message="Select a team to start chatting." />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Chat Room ═══

function ChatRoom({ eventId, teamId, peerName, pill }: {
  eventId: string; teamId: string; peerName: string; pill?: string;
}) {
  const { user } = useAuthStore();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["mentor-messages", eventId, teamId],
    queryFn: () => mentorChatApi.getMessages(eventId, teamId),
    refetchInterval: 3000,
  });

  const qc = useQueryClient();
  const { mutate: send } = useMutation({
    mutationFn: (msg: string) => mentorChatApi.sendMessage(eventId, teamId, { message: msg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentor-messages", eventId, teamId] }),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    send(content);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-seal-border px-5 py-3">
        <div>
          <div className="font-semibold text-sm text-seal-text">{peerName}</div>
          <div className="text-xs text-seal-text-muted">Chat</div>
        </div>
        {pill && <span className="rounded-full border border-seal-border px-2.5 py-1 text-xs text-seal-text-muted">{pill}</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-seal-text-muted py-10">
            No messages yet — start the conversation.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderUserId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-seal-cyan text-white" : "bg-seal-surface-elevated text-seal-text"}`}>
                <div>{m.message}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-seal-text-muted"}`}>
                  {m.senderName} — {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-seal-border p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-seal-border bg-seal-surface px-3 py-2.5 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
        />
        <button onClick={handleSend} className="rounded-lg bg-seal-cyan px-4 py-2.5 text-white hover:bg-seal-cyan-dark">
          <SendIcon />
        </button>
      </div>
    </>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-seal-text-muted p-10">
      {message}
    </div>
  );
}
