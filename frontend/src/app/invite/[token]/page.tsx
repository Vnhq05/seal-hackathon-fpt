"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getInviteInfoApi,
  type InviteCompetitionInfoResponse,
} from "@/lib/team-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, Mail, FileText } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] =
      React.useState<InviteCompetitionInfoResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadInviteInfo() {
      try {
        setLoading(true);

        const result = await getInviteInfoApi(token);

        console.log("INVITE INFO:", result);

        setData(result);
      } catch (error) {
        toast.error(
            error instanceof Error
                ? error.message
                : "Failed to load invitation"
        );

        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInviteInfo();
    }
  }, [token]);

  if (loading) {
    return (
        <div className="min-h-screen grid place-items-center p-6 bg-background">
          <div className="rounded-xl border bg-card p-8 max-w-md text-center">
            <div className="font-semibold text-lg">Loading invitation...</div>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we load your invitation.
            </p>
          </div>
        </div>
    );
  }

  if (!data) {
    return (
        <div className="min-h-screen grid place-items-center p-6 bg-background">
          <div className="rounded-xl border bg-card p-8 max-w-md text-center">
            <div className="font-semibold text-lg">Invitation not found</div>
            <p className="text-sm text-muted-foreground mt-2">
              This invite link is invalid or has expired.
            </p>
            <Link
                href="/"
                className="inline-block mt-4 text-sm text-primary underline"
            >
              Go home
            </Link>
          </div>
        </div>
    );
  }

  const { team, competition, inviteEmail, inviteStatus } = data;

  return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl btn-gradient grid place-items-center text-primary-foreground mb-3">
              <Mail className="h-6 w-6" />
            </div>

            <h1 className="text-2xl font-bold">
              You're invited to join a team
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              This invitation was sent to{" "}
              <span className="font-medium text-foreground">
                            {inviteEmail}
                        </span>
            </p>

            <div className="mt-3">
              <Badge variant="outline">{inviteStatus}</Badge>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-muted-foreground">
                  Team ID: {team.id}
                </div>
              </div>

              <Badge variant="outline" className="ml-auto">
                {team.status ?? "INCOMPLETE"}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              You have been invited to join this team.
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
                <Trophy className="h-5 w-5" />
              </div>

              <div>
                <div className="font-semibold">{competition.name}</div>
                <div className="text-xs text-muted-foreground">
                  Competition ID: {competition.id}
                </div>
              </div>

              {competition.status && (
                  <Badge variant="secondary" className="ml-auto">
                    {competition.status}
                  </Badge>
              )}
            </div>

            <div className="space-y-3 text-sm">
              {competition.description && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <FileText className="h-4 w-4" />
                      Description
                    </div>
                    <div className="text-muted-foreground">
                      {competition.description}
                    </div>
                  </div>
              )}

              <div className="flex flex-wrap gap-2">
                {competition.format && (
                    <Badge variant="outline">
                      Format: {competition.format}
                    </Badge>
                )}

                {competition.status && (
                    <Badge variant="outline">
                      Status: {competition.status}
                    </Badge>
                )}
              </div>

              {competition.startDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                                    Start date:{" "}
                      {competition.startDate.replace("T", " ")}
                                </span>
                  </div>
              )}

              {competition.registrationDeadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                                    Registration deadline:{" "}
                      {competition.registrationDeadline.replace("T", " ")}
                                </span>
                  </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="font-semibold">Next step</div>
            <p className="text-sm text-muted-foreground mt-1">
              Log in with the invited email to accept this invitation and join
              the team.
            </p>

            <div className="flex gap-2 mt-4">
              <Link href="/login" className="flex-1">
                <Button className="w-full btn-gradient text-primary-foreground">
                  Login to accept
                </Button>
              </Link>

              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Go home
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            This page is loaded from the invitation link sent by email.
          </p>
        </div>
      </div>
  );
}