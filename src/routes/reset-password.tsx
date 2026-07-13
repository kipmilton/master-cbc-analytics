import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { updatePasswordForUser, landingPathFor } from "@/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Master CBC" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const user = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border/70">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold">Sign in first</h1>
            <p className="mt-2 text-sm text-muted-foreground">You need to sign in before resetting your password.</p>
            <Button onClick={() => navigate({ to: "/login" })} className="mt-6 w-full">Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeUser = user;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || password !== confirmPassword) {
      toast.error("Please confirm the new password before continuing.");
      return;
    }
    setBusy(true);
    await updatePasswordForUser(activeUser.email, password);
    setBusy(false);
    toast.success("Password updated. You can continue to your dashboard.");
    navigate({ to: landingPathFor(activeUser.role) });
  }

  return (
    <AppShell allow={["teacher"]}>
      <PageHeader title="Reset your password" subtitle="Set a new password before you continue to your teacher dashboard." />
      <Card className="mx-auto max-w-xl border-border/70">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <LockKeyhole className="h-5 w-5" />
            <span>This temporary password must be replaced before access is granted.</span>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a strong password" required className="pr-12" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save and continue"}</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
