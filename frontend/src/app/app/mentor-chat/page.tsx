"use client";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth, useAllUsers, type User } from "@/lib/auth";
import {
  useCompetitionStore,
  addMentorMessage,
  createMentorInvite,
  respondMentorInvite,
  cancelMentorInvite,
  type MentorInvite,
} from "@/lib/competition-store";
import { getTeams, setTeamMentor, type Team } from "@/lib/judging-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircleOff, Mail, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function MentorChat() {
  useRequireRole(["Participant", "Mentor", "Lecturer"]); // thay cho beforeLoad
  const { user } = useAuth();
  const allUsers = useAllUsers();
  const { chat, invites, tick } = useCompetitionStore();
  // re-read teams whenever store ticks so accept-invite flips view instantly
  const allTeams = React.useMemo<Team[]>(() => getTeams(), [tick]);

  const scopedTeams = React.useMemo<Team[]>(() => {
    if (!user) return [];
    if (user.role === "Participant") {
      const mine = allTeams.filter((t) => t.members.includes(user.email));
      return mine.length ? mine : [allTeams[0]];
    }
    if (user.role === "Mentor" || user.role === "Lecturer") return allTeams.filter((t) => t.mentorId === user.id);
    return allTeams;
  }, [user, allTeams]);

  const [teamId, setTeamId] = React.useState<string | null>(scopedTeams[0]?.id ?? null);
  React.useEffect(() => {
    if (!teamId && scopedTeams[0]) setTeamId(scopedTeams[0].id);
    if (teamId && !scopedTeams.find((t) => t.id === teamId)) setTeamId(scopedTeams[0]?.id ?? null);
  }, [scopedTeams, teamId]);

  const [text, setText] = React.useState("");
  const activeTeam = scopedTeams.find((t) => t.id === teamId) ?? null;
  const mentorForTeam: User | undefined = activeTeam?.mentorId
    ? allUsers.find((u) => u.id === activeTeam.mentorId)
    : undefined;

  const isMentor = user?.role === "Mentor" || user?.role === "Lecturer";
  const filtered = chat.filter((m) => m.teamId === teamId);

  const send = () => {
    if (!text.trim() || !activeTeam) return;
    addMentorMessage({
      teamId: activeTeam.id,
      mentorId: activeTeam.mentorId ?? "u2",
      from: isMentor ? "mentor" : "team",
      text,
    });
    setText("");
  };

  // ---------- PARTICIPANT VIEW ----------
  if (user?.role === "Participant") {
    if (!activeTeam) {
      return (
        <div>
          <PageHeader title="Mentor chat" subtitle="Talk to your assigned mentor" />
          <EmptyState message="You haven't joined a team yet." />
        </div>
      );
    }

    // No mentor yet → invite flow
    if (!mentorForTeam) {
      const teamInvites = invites.filter((i) => i.teamId === activeTeam.id);
      return (
        <div>
          <PageHeader title="Mentor chat" subtitle={`Team · ${activeTeam.name} — no mentor yet`} />
          <div className="grid lg:grid-cols-2 gap-4">
            <InvitePanel team={activeTeam} userId={user.id} userEmail={user.email} />
            <InviteList invites={teamInvites} side="team" onCancel={(id) => { cancelMentorInvite(id); toast.success("Invite cancelled"); }} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <PageHeader title="Mentor chat" subtitle={`Your mentor · ${mentorForTeam.name}`} />
        <div className="rounded-xl border bg-card flex flex-col h-[calc(100vh-220px)]">
          <ChatHeader title={mentorForTeam.name} subtitle={`Mentor · ${mentorForTeam.email}`} pill={activeTeam.name} />
          <MessageList messages={filtered} isMentor={isMentor} />
          <Composer value={text} onChange={setText} onSend={send} />
        </div>
      </div>
    );
  }

  // ---------- MENTOR / COORDINATOR / ADMIN VIEW ----------
  const pendingForMentor = isMentor
    ? invites.filter((i) => i.status === "pending" && i.toEmail.toLowerCase() === user!.email.toLowerCase())
    : [];

  return (
    <div>
      <PageHeader
        title="Mentor chat"
        subtitle={isMentor ? `Your teams · ${scopedTeams.length} assigned` : "Oversight · all teams and mentors"}
      />

      {isMentor && pendingForMentor.length > 0 && (
        <div className="rounded-xl border bg-card mb-4">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <div className="font-medium">Mentorship invitations</div>
            <Badge variant="secondary" className="ml-auto">{pendingForMentor.length} pending</Badge>
          </div>
          <div className="divide-y">
            {pendingForMentor.map((inv) => (
              <div key={inv.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{inv.teamName}</div>
                  <div className="text-xs text-muted-foreground">
                    From {inv.fromEmail} · {new Date(inv.createdAt).toLocaleString()}
                  </div>
                  {inv.message && <div className="text-sm mt-1 text-muted-foreground italic">"{inv.message}"</div>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        setTeamMentor(inv.teamId, user!.id);
                        respondMentorInvite(inv.id, "accepted");
                        toast.success(`You are now mentor for ${inv.teamName}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Không thể nhận đội");
                      }
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      respondMentorInvite(inv.id, "declined");
                      toast.success("Invitation declined");
                    }}
                  >
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
          {scopedTeams.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No teams assigned to you yet. Accept an invitation above to start mentoring.
            </div>
          )}
          {scopedTeams.map((t) => {
            const mentor = allUsers.find((u) => u.id === t.mentorId);
            return (
              <button
                key={t.id}
                onClick={() => setTeamId(t.id)}
                className={`w-full text-left px-4 py-3 border-b text-sm ${teamId === t.id ? "bg-accent" : "hover:bg-accent/50"}`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.track}</div>
                {!isMentor && (
                  <div className="text-[11px] text-muted-foreground mt-1">Mentor: {mentor?.name ?? "—"}</div>
                )}
              </button>
            );
          })}
        </div>
        <div className="rounded-xl border bg-card flex flex-col">
          {activeTeam ? (
            <>
              <ChatHeader
                title={activeTeam.name}
                subtitle={activeTeam.track}
                pill={mentorForTeam ? `Mentor · ${mentorForTeam.name}` : "No mentor assigned"}
              />
              <MessageList messages={filtered} isMentor={isMentor} />
              <Composer value={text} onChange={setText} onSend={send} />
            </>
          ) : (
            <EmptyState message="Select a team to start chatting." />
          )}
        </div>
      </div>
    </div>
  );
}

function InvitePanel({ team, userId, userEmail }: { team: Team; userId: string; userEmail: string }) {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const submit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid Gmail / email address.");
      return;
    }
    try {
      createMentorInvite({
        teamId: team.id,
        teamName: team.name,
        fromUserId: userId,
        fromEmail: userEmail,
        toEmail: trimmed,
        message: message.trim() || undefined,
      });
      toast.success(`Invitation sent to ${trimmed}`);
      setEmail("");
      setMessage("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Invite a mentor by email</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Send an invitation to a mentor's Gmail. They'll see it in their Mentor Chat and can accept to join your team.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Mentor's Gmail</label>
          <Input
            type="email"
            placeholder="mentor@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Personal note (optional)</label>
          <Textarea
            rows={3}
            placeholder={`Hi! We're ${team.name} working on ${team.track} — would love your guidance.`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={submit} className="w-full btn-gradient text-primary-foreground">
          <Send className="h-4 w-4 mr-2" /> Send invitation
        </Button>
      </div>
    </div>
  );
}

function InviteList({
  invites,
  side,
  onCancel,
}: {
  invites: MentorInvite[];
  side: "team" | "mentor";
  onCancel?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-medium mb-3">Sent invitations</h3>
      {invites.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">No invitations sent yet.</div>
      ) : (
        <ul className="space-y-3">
          {invites.map((i) => (
            <li key={i.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{i.toEmail}</div>
                  <div className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleString()}</div>
                </div>
                <StatusPill status={i.status} />
              </div>
              {side === "team" && i.status === "pending" && onCancel && (
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => onCancel(i.id)}>
                  Cancel invite
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: MentorInvite["status"] }) {
  const map = {
    pending: { label: "Pending", icon: Clock, cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
    accepted: { label: "Accepted", icon: Check, cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    declined: { label: "Declined", icon: X, cls: "bg-red-500/10 text-red-500 border-red-500/30" },
    cancelled: { label: "Cancelled", icon: X, cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={`text-[11px] inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${m.cls}`}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

function ChatHeader({ title, subtitle, pill }: { title: string; subtitle: string; pill?: string }) {
  return (
    <div className="border-b px-5 py-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      {pill && <span className="text-xs rounded-full border px-2 py-1 text-muted-foreground">{pill}</span>}
    </div>
  );
}

function MessageList({
  messages,
  isMentor,
}: {
  messages: ReturnType<typeof useCompetitionStore>["chat"];
  isMentor: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-10">No messages yet — start the conversation.</div>
      )}
      {messages.map((m) => {
        const mine = (m.from === "mentor") === isMentor;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${mine ? "btn-gradient text-primary-foreground" : "bg-muted"}`}>
              <div>{m.text}</div>
              <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {m.from} · {new Date(m.at).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({ value, onChange, onSend }: { value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <div className="border-t p-3 flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="Type a message…"
      />
      <button onClick={onSend} className="rounded-md btn-gradient text-primary-foreground px-3">
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2 p-10">
      <MessageCircleOff className="h-4 w-4" /> {message}
    </div>
  );
}
