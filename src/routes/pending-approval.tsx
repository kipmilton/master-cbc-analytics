import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/use-session";
import { signOut, landingPathFor } from "@/lib/auth-store";
import { Clock3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({ meta: [{ title: "Pending Approval — Master CBC" }] }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const user = useSession();
  const navigate = useNavigate();

  if (user === undefined) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (user === null) { navigate({ to: "/login", replace: true }); return null; }
  if (user.accountStatus === "active") { navigate({ to: landingPathFor(user.role), replace: true }); return null; }

  const schoolAdminRoles = ["principal", "deputy_academic", "deputy_admin"] as const;
  const isPrincipalApp = user.applicationStatus === "pending" || ((schoolAdminRoles as readonly string[]).includes(user.role) && user.schoolStatus !== "active");
  const isRejected = user.applicationStatus === "rejected";

  return (
    <div className="min-h-screen bg-secondary/30 p-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between py-4">
        <Link to="/"><Logo className="h-7 w-auto" /></Link>
        <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/login" }); }}>Sign out</Button>
      </div>
      <Card className="mx-auto max-w-3xl border-border/70">
        <CardContent className="p-8">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <Badge className={isRejected ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-700"}>
              {isRejected ? "Application Rejected" : "Pending Approval"}
            </Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold">Hi {user.name.split(" ")[0]},</h1>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            {isRejected ? (
              <p>Your school application was not approved at this time. Please contact <a className="text-primary underline" href="mailto:hello@mastercbc.co.ke">hello@mastercbc.co.ke</a> for details.</p>
            ) : isPrincipalApp ? (
              <p>Your school application is currently under review by the Master CBC administration team. You will get full access to your Principal dashboard the moment we approve it — typically within 24 hours.</p>
            ) : (
              <p>Your account is waiting for the Principal to approve your onboarding. You will get access to your teacher dashboard as soon as they do.</p>
            )}
          </div>
          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />What happens next</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You will receive an email confirmation once your account is approved.</li>
              <li>Sign back in to reach your live dashboard, fully scoped to your school.</li>
              <li>All data is protected with row-level security — you'll only ever see your own school's records.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
