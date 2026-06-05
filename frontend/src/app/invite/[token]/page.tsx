"use client";
/* ============================================================================
 * app/invite/[token]/page.tsx — trang lời mời vào team "/invite/<token>".
 * ----------------------------------------------------------------------------
 * Đây là "dynamic route". Khác bản TanStack:
 *   - File cũ tên invite.$token.tsx, lấy param bằng Route.useParams().
 *   - Next.js: thư mục đặt trong [ngoặc vuông] → [token], lấy param bằng
 *     useParams() của next/navigation.
 * ========================================================================== */
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTeamMemberInviteByToken } from "@/lib/competition-store";
import { getTeams } from "@/lib/judging-store";
import { useCompetitionStore } from "@/lib/competition-store";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, MapPin, Mail } from "lucide-react";

export default function InvitePage() {
  // useParams trả về object các tham số trên URL; ở đây là { token }.
  const { token } = useParams<{ token: string }>();
  const { competitions } = useCompetitionStore();
  const [invite, setInvite] = React.useState(() => getTeamMemberInviteByToken(token));

  React.useEffect(() => {
    setInvite(getTeamMemberInviteByToken(token));
  }, [token]);

  if (!invite) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-background">
        <div className="rounded-xl border bg-card p-8 max-w-md text-center">
          <div className="font-semibold text-lg">Invitation not found</div>
          <p className="text-sm text-muted-foreground mt-2">This invite link is invalid or has expired.</p>
          <Link href="/" className="inline-block mt-4 text-sm text-primary underline">Go home</Link>
        </div>
      </div>
    );
  }

  const team = getTeams().find((t) => t.id === invite.teamId);
  const open = competitions.filter((c) => c.status === "Open" || c.status === "Active" || c.status === "Scoring");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl btn-gradient grid place-items-center text-primary-foreground mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">You're invited to join a team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{invite.fromEmail}</span> invited <span className="font-medium text-foreground">{invite.toEmail}</span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground"><Users className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">{invite.teamName}</div>
              <div className="text-xs text-muted-foreground">Track: {invite.track}</div>
            </div>
            {team && <Badge variant="outline" className="ml-auto">{team.members.length} members</Badge>}
          </div>
          {team && (
            <div className="space-y-1">
              {team.members.map((m) => (
                <div key={m} className="text-sm rounded-md px-3 py-2 bg-muted/40 flex items-center justify-between">
                  <span>{m}</span>
                  {m.toLowerCase() === invite.toEmail.toLowerCase() && <Badge>You</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-2">Competitions your team can join</h2>
          {open.length === 0 && (
            <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No open competitions right now.</div>
          )}
          <div className="space-y-2">
            {open.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{c.startDate.replace("T", " ")}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                  </div>
                </div>
                <Badge variant="secondary">{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No account needed to view this page. Create one anytime to participate fully.
        </p>
      </div>
    </div>
  );
}
