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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircleOff, Mail, Check, X, Clock, UserPlus } from "lucide-react";
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
  const [loading, setLoading] = React.useState(true);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);

  React.useEffect(() => {
    getMyTeamsApi()
        .then((d) => setMyTeams(d.filter((mt) => mt.team)))
        .catch(() => setMyTeams([]))
        .finally(() => setLoading(false));
  }, []);

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
        <PageHeader title="Mentor chat" subtitle="Pick a competition, invite a mentor, then chat" />

        {loading && <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>}

        {!loading && myTeams.length === 0 && <EmptyCard message="You haven't joined a team yet." />}

        {!loading && myTeams.length > 0 && (
            <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)]">
              <div className="rounded-xl border bg-card overflow-y-auto h-fit max-h-full">
                <div className="px-4 py-3 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your competitions
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
                        <div className="font-medium truncate">{c?.name ?? `Competition #${mt.team!.competitionId}`}</div>
                        <div className="text-xs text-muted-foreground truncate">Team: {mt.team!.name}</div>
                      </button>
                  );
                })}
              </div>

              <div className="rounded-xl border bg-card flex flex-col min-h-0">
                {selected?.team ? (
                    <ParticipantTeamPanel
                        key={selected.team.id}
                        teamId={selected.team.id}
                        teamName={selected.team.name}
                        isLeader={Boolean(selected.isLeader ?? selected.leader)}
                        me={me}
                    />
                ) : (
                    <EmptyState message="Select a competition." />
                )}
              </div>
            </div>
        )}
      </div>
  );
}

function ParticipantTeamPanel({
  teamId, teamName, isLeader, me,
}: {
  teamId: number;
  teamName: string;
  isLeader: boolean;
  me: Me;
}) {
  const [room, setRoom] = React.useState<MentorRoom | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [sentToId, setSentToId] = React.useState<number | null>(null);

  React.useEffect(() => { listMentorsApi().then(setMentors).catch(() => setMentors([])); }, []);

  // Poll phòng chat: khi mentor chấp nhận, room xuất hiện → tự chuyển sang khung chat.
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

  if (checking) return <EmptyState message="Loading…" />;

  if (room) {
    const mentor = mentors.find((m) => m.id === room.mentorId);
    return (
        <ChatRoom
            roomId={room.id}
            me={me}
            peerName={mentor?.fullName ?? `Mentor #${room.mentorId}`}
            pill={teamName}
        />
    );
  }

  // Chưa có mentor → màn hình mời.
  const invite = async (mentor: Mentor) => {
    if (!isLeader) { toast.error("Only the team leader can invite a mentor."); return; }
    try {
      await sendMentorRequestApi(teamId, mentor.id);
      setSentToId(mentor.id);
      toast.success(`Invitation sent to ${mentor.fullName}. Waiting for them to accept.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation");
    }
  };

  return (
      <div className="p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Invite a mentor for "{teamName}"</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a mentor below. Once they accept, a chat window will appear here automatically.
        </p>

        {sentToId != null && (
            <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 text-sm px-3 py-2 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Invitation sent — waiting for the mentor to accept…
            </div>
        )}

        {mentors.length === 0 ? (
            <div className="text-sm text-muted-foreground">No mentors available yet.</div>
        ) : (
            <div className="space-y-2">
              {mentors.map((m) => (
                  <div key={m.id} className="rounded-lg border p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full btn-gradient grid place-items-center text-xs text-primary-foreground shrink-0">
                      {m.fullName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{m.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[m.specialty, m.organization].filter(Boolean).join(" · ") || "Mentor"}
                      </div>
                    </div>
                    <Button size="sm" disabled={!isLeader || sentToId === m.id} onClick={() => invite(m)}>
                      {sentToId === m.id ? "Sent" : <><Mail className="h-3.5 w-3.5 mr-1" /> Invite</>}
                    </Button>
                  </div>
              ))}
            </div>
        )}

        {!isLeader && (
            <p className="text-xs text-muted-foreground mt-4">Only the team leader can invite a mentor.</p>
        )}
      </div>
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
