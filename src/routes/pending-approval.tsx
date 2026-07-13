import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { Clock3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({ meta: [{ title: "Pending Approval — Master CBC" }] }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const user = useSession();

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="Pending approval" subtitle="Your teacher account is waiting for principal confirmation before full access is enabled." />
      <Card className="mx-auto max-w-2xl border-border/70">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <Badge className="bg-amber-500/15 text-amber-700">Pending Approval</Badge>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>{user?.name ?? "Your account"} is currently locked to a read-only onboarding state until the Principal or Deputy approves the onboarding record.</p>
            <p>You will receive access to your teacher dashboard once the approval is completed.</p>
          </div>
          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />What happens next</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>The Principal can approve your account from the school admin panel.</li>
              <li>Your assigned streams and subjects will become active after approval.</li>
              <li>Any temporary password you received must be reset before the first successful sign-in.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
