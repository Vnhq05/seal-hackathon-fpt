"use client";
/* ----------------------------------------------------------------------------
 * mentor-chat — NỐI BACKEND THẬT (/api/mentors + /api/mentor-chat).
 *
 * Participant: chọn cuộc thi (team của mình) → mời 1 mentor → khi mentor chấp
 *   nhận, phòng chat tự xuất hiện và hiển thị khung chat với mentor đó.
 * Mentor/Lecturer: xem lời mời đang chờ → Accept/Deny → chat trong các phòng
 *   đang dẫn dắt.
 * Tin nhắn được polling mỗi vài giây (backend chưa có websocket).
 * -------------------------------------------------------------------------- */
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useCompetitionStore } from "@/lib/competition-store";
import { getMyTeamsApi, getTeamsApi, type MyTeamResponse } from "@/lib/team-api";
import {
  listMentorsApi,
  sendMentorRequestApi,
  getPendingRequestsApi,
  getTeamRequestsApi,
  respondMentorRequestApi,
  getRoomByTeamApi,
  getActiveRoomsApi,
  sendChatMessageApi,
  getMessagesApi,
  type Mentor,
  type MentorRequest,
  type MentorRoom,
  type ChatMessage,
} from "@/lib/mentor-api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircleOff, Mail, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

type Me = { id: string; name: string };

export default function MentorChat() {
  useRequireRole(["Participant", "Mentor", "Lecturer"]);
  const { user } = useAuth();

  if (!user) return null;
  const me: Me = { id: user.id, name: user.name };

  if (user.role === "Participant") {
    return <ParticipantView me={me} />;
  }
  return <MentorView me={me} />;
}

/* ============================ PARTICIPANT ============================ */
function ParticipantView({ me }: { me: Me }) {
  const { competitions } = useCompetitionStore();
  const [myTeams, setMyTeams] = React.useState<MyTeamResponse[]>([]);
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);

  React.useEffect(() => {
    getMyTeamsApi()
        .then((d) => setMyTeams(d.filter((mt) => mt.team)))
        .catch(() => setMyTeams([]))
        .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { listMentorsApi().then(setMentors).catch(() => setMentors([])); }, []);

  React.useEffect(() => {
    if (myTeams.length === 0) { setSelectedTeamId(null); return; }
    if (selectedTeamId == null || !myTeams.some((mt) => mt.team?.id === selectedTeamId)) {
      setSelectedTeamId(myTeams[0].team!.id);
    }
  }, [myTeams, selectedTeamId]);

  const compById = (id?: number | null) => competitions.find((c) => String(c.id) === String(id));
  const selected = myTeams.find((mt) => mt.team?.id === selectedTeamId) ?? null;

  return (
      <div>
        <PageHeader
            title="Mentor chat"
            subtitle={selected?.team ? `Team · ${selected.team.name}` : "Invite a mentor, then chat"}
        />

        {loading && <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>}

        {!loading && myTeams.length === 0 && <EmptyCard message="You haven't joined a team yet." />}

        {!loading && myTeams.length > 0 && (
            <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[calc(100vh-220px)]">
              <div className="rounded-xl border bg-card overflow-y-auto h-fit max-h-full">
                <div className="px-4 py-3 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your teams
                </div>
                {myTeams.map((mt) => {
                  const c = compById(mt.team!.competitionId);
                  const active = mt.team!.id === selectedTeamId;
                  return (
                      <button
                          key={mt.team!.id}
                          onClick={() => setSelectedTeamId(mt.team!.id)}
                          className={`w-full text-left px-4 py-3 border-b text-sm ${active ? "bg-accent" : "hover:bg-accent/50"}`}
                      >
                        <div className="font-medium truncate">{mt.team!.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c?.name ?? `Competition #${mt.team!.competitionId}`}
                        </div>
                      </button>
                  );
                })}
              </div>

              <div className="min-h-0">
                {selected?.team ? (
                    <ParticipantTeamPanel
                        key={selected.team.id}
                        teamId={selected.team.id}
                        teamName={selected.team.name}
                        isLeader={Boolean(selected.isLeader ?? selected.leader)}
                        mentors={mentors}
                        me={me}
                    />
                ) : (
                    <div className="rounded-xl border bg-card flex flex-col h-full">
                      <EmptyState message="Select a team." />
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
}

function ParticipantTeamPanel({
  teamId, teamName, isLeader, mentors, me,
}: {
  teamId: number;
  teamName: string;
  isLeader: boolean;
  mentors: Mentor[];
  me: Me;
}) {
  const [room, setRoom] = React.useState<MentorRoom | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [requests, setRequests] = React.useState<MentorRequest[]>([]);

  // Poll phòng chat: khi mentor chấp nhận, room xuất hiện → tự chuyển sang khung chat (ảnh 7).
  React.useEffect(() => {
    let stop = false;
    const check = async () => {
      const r = await getRoomByTeamApi(teamId);
      if (!stop) { setRoom(r); setChecking(false); }
    };
    check();
    const t = setInterval(check, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [teamId]);

  // Poll danh sách lời mời đã gửi (Sent invitations) + trạng thái.
  const reloadRequests = React.useCallback(() => {
    getTeamRequestsApi(teamId).then(setRequests).catch(() => setRequests([]));
  }, [teamId]);
  React.useEffect(() => {
    reloadRequests();
    const t = setInterval(reloadRequests, 4000);
    return () => clearInterval(t);
  }, [reloadRequests]);

  if (checking) {
    return (
        <div className="rounded-xl border bg-card flex flex-col h-full">
          <EmptyState message="Loading…" />
        </div>
    );
  }

  // Đã có mentor (mentor đã chấp nhận) → khung chat (ảnh 7).
  if (room) {
    const mentor = mentors.find((m) => m.id === room.mentorId);
    return (
        <div className="rounded-xl border bg-card flex flex-col h-[calc(100vh-220px)]">
          <ChatRoom
              roomId={room.id}
              me={me}
              peerName={mentor?.fullName ?? `Mentor #${room.mentorId}`}
              pill={teamName}
          />
        </div>
    );
  }

  // Chưa có mentor → giao diện mời bằng email + danh sách lời mời đã gửi (ảnh 6).
  return (
      <div className="grid md:grid-cols-2 gap-4">
        <InvitePanel teamId={teamId} teamName={teamName} isLeader={isLeader} mentors={mentors} onSent={reloadRequests} />
        <SentInvitations requests={requests} mentors={mentors} />
      </div>
  );
}

function InvitePanel({
  teamId, teamName, isLeader, mentors, onSent,
}: {
  teamId: number;
  teamName: string;
  isLeader: boolean;
  mentors: Mentor[];
  onSent: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async () => {
    if (!isLeader) { toast.error("Only the team leader can invite a mentor."); return; }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    // Map email → mentor thật (backend mời theo mentorId).
    const mentor = mentors.find((m) => (m.email ?? "").toLowerCase() === trimmed);
    if (!mentor) {
      toast.error("No mentor is registered with that email.");
      return;
    }
    try {
      setSending(true);
      await sendMentorRequestApi(teamId, mentor.id);
      toast.success(`Invitation sent to ${mentor.email ?? mentor.fullName}.`);
      setEmail("");
      setNote("");
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
      <div className="rounded-xl border bg-card p-5 h-fit">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Invite a mentor by email</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Send an invitation to a mentor&apos;s Gmail. They&apos;ll see it in their Mentor Chat and can accept to join your team.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Mentor&apos;s Gmail</label>
            <Input
                type="email"
                placeholder="mentor@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isLeader}
                className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Personal note (optional)</label>
            <Textarea
                placeholder={`Hi! We're ${teamName} — would love your guidance.`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!isLeader}
                rows={3}
                className="mt-1"
            />
          </div>
          <Button
              onClick={submit}
              disabled={!isLeader || sending}
              className="w-full btn-gradient text-primary-foreground"
          >
            <Send className="h-4 w-4 mr-2" /> {sending ? "Sending…" : "Send invitation"}
          </Button>
          {!isLeader && (
              <p className="text-xs text-muted-foreground">Only the team leader can invite a mentor.</p>
          )}
        </div>
      </div>
  );
}

function SentInvitations({
  requests, mentors,
}: {
  requests: MentorRequest[];
  mentors: Mentor[];
}) {
  const mentorLabel = (mentorId: number) => {
    const m = mentors.find((x) => x.id === mentorId);
    return m?.email ?? m?.fullName ?? `Mentor #${mentorId}`;
  };

  return (
      <div className="rounded-xl border bg-card p-5 h-fit">
        <h3 className="font-medium mb-4">Sent invitations</h3>
        {requests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No invitations sent yet.</div>
        ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{mentorLabel(r.mentorId)}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

function StatusBadge({ status }: { status: MentorRequest["status"] }) {
  if (status === "ACCEPTED") {
    return (
        <span className="inline-flex items-center gap-1 text-xs rounded-full border border-green-500/30 bg-green-500/10 text-green-500 px-2.5 py-1">
          <Check className="h-3.5 w-3.5" /> Accepted
        </span>
    );
  }
  if (status === "DENIED") {
    return (
        <span className="inline-flex items-center gap-1 text-xs rounded-full border border-red-500/30 bg-red-500/10 text-red-500 px-2.5 py-1">
          <X className="h-3.5 w-3.5" /> Declined
        </span>
    );
  }
  return (
      <span className="inline-flex items-center gap-1 text-xs rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 px-2.5 py-1">
        <Clock className="h-3.5 w-3.5" /> Pending
      </span>
  );
}

/* ============================ MENTOR / LECTURER ============================ */
function MentorView({ me }: { me: Me }) {
  const [mentorId, setMentorId] = React.useState<number | null>(null);
  const [resolving, setResolving] = React.useState(true);
  const [pending, setPending] = React.useState<MentorRequest[]>([]);
  const [rooms, setRooms] = React.useState<MentorRoom[]>([]);
  const [teamNames, setTeamNames] = React.useState<Record<number, string>>({});
  const [selectedRoomId, setSelectedRoomId] = React.useState<number | null>(null);

  // Tìm mentorId (id bản ghi mentor) ứng với user đang đăng nhập.
  React.useEffect(() => {
    listMentorsApi()
        .then((ms) => {
          const mine = ms.find((m) => Number(m.userId) === Number(me.id));
          setMentorId(mine ? mine.id : null);
        })
        .catch(() => setMentorId(null))
        .finally(() => setResolving(false));
  }, [me.id]);

  // Tên team để hiển thị (room/request chỉ có teamId).
  React.useEffect(() => {
    getTeamsApi()
        .then((ts) => {
          const map: Record<number, string> = {};
          ts.forEach((t) => { map[t.id] = t.name; });
          setTeamNames(map);
        })
        .catch(() => {});
  }, []);

  const reload = React.useCallback(() => {
    if (mentorId == null) return;
    getPendingRequestsApi(mentorId).then(setPending).catch(() => {});
    getActiveRoomsApi(mentorId).then(setRooms).catch(() => {});
  }, [mentorId]);

  React.useEffect(() => {
    reload();
    const t = setInterval(reload, 5000);
    return () => clearInterval(t);
  }, [reload]);

  React.useEffect(() => {
    if (rooms.length === 0) { setSelectedRoomId(null); return; }
    if (selectedRoomId == null || !rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const respond = async (req: MentorRequest, decision: "ACCEPTED" | "DENIED") => {
    try {
      await respondMentorRequestApi(req.id, decision);
      toast.success(decision === "ACCEPTED"
          ? `Accepted — you now mentor ${teamNames[req.teamId] ?? `team #${req.teamId}`}`
          : "Invitation declined");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  if (resolving) {
    return (
        <div>
          <PageHeader title="Mentor chat" subtitle="Loading…" />
          <EmptyCard message="Loading your mentor profile…" />
        </div>
    );
  }

  if (mentorId == null) {
    return (
        <div>
          <PageHeader title="Mentor chat" subtitle="Mentor workspace" />
          <EmptyCard message="You don't have a mentor profile yet. Ask an Admin/Coordinator to register you as a mentor." />
        </div>
    );
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  return (
      <div>
        <PageHeader title="Mentor chat" subtitle={`Your teams · ${rooms.length} active`} />

        {pending.length > 0 && (
            <div className="rounded-xl border bg-card mb-4">
              <div className="px-5 py-3 border-b flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div className="font-medium">Mentorship invitations</div>
                <Badge variant="secondary" className="ml-auto">{pending.length} pending</Badge>
              </div>
              <div className="divide-y">
                {pending.map((req) => (
                    <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{teamNames[req.teamId] ?? `Team #${req.teamId}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respond(req, "ACCEPTED")}>
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respond(req, "DENIED")}>
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-260px)]">
          <div className="rounded-xl border bg-card overflow-y-auto">
            {rooms.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  No teams yet. Accept an invitation above to start mentoring.
                </div>
            )}
            {rooms.map((r) => (
                <button
                    key={r.id}
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`w-full text-left px-4 py-3 border-b text-sm ${selectedRoomId === r.id ? "bg-accent" : "hover:bg-accent/50"}`}
                >
                  <div className="font-medium">{teamNames[r.teamId] ?? `Team #${r.teamId}`}</div>
                  <div className="text-xs text-muted-foreground">Room #{r.id}</div>
                </button>
            ))}
          </div>

          <div className="rounded-xl border bg-card flex flex-col min-h-0">
            {selectedRoom ? (
                <ChatRoom
                    roomId={selectedRoom.id}
                    me={me}
                    peerName={teamNames[selectedRoom.teamId] ?? `Team #${selectedRoom.teamId}`}
                    pill="Mentor"
                />
            ) : (
                <EmptyState message="Select a team to start chatting." />
            )}
          </div>
        </div>
      </div>
  );
}

/* ============================ SHARED CHAT ROOM ============================ */
function ChatRoom({
  roomId, me, peerName, pill,
}: {
  roomId: number;
  me: Me;
  peerName: string;
  pill?: string;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [text, setText] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  const reload = React.useCallback(() => {
    getMessagesApi(roomId).then(setMessages).catch(() => {});
  }, [roomId]);

  React.useEffect(() => {
    reload();
    const t = setInterval(reload, 3000);
    return () => clearInterval(t);
  }, [reload]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      await sendChatMessageApi(roomId, Number(me.id), me.name, content);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    }
  };

  return (
      <>
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{peerName}</div>
            <div className="text-xs text-muted-foreground">Room #{roomId}</div>
          </div>
          {pill && <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">{pill}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10">No messages yet — start the conversation.</div>
          )}
          {messages.map((m) => {
            const mine = Number(m.senderId) === Number(me.id);
            return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${mine ? "btn-gradient text-primary-foreground" : "bg-muted"}`}>
                    <div>{m.messageContent}</div>
                    <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {m.senderName} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="border-t p-3 flex gap-2">
          <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
          />
          <button onClick={send} className="rounded-md btn-gradient text-primary-foreground px-3">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </>
  );
}

/* ============================ SMALL HELPERS ============================ */
function EmptyState({ message }: { message: string }) {
  return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2 p-10">
        <MessageCircleOff className="h-4 w-4" /> {message}
      </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">{message}</div>
  );
}
