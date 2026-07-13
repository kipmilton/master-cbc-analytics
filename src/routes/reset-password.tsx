import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/use-session";
import { updateMyPassword, landingPathFor, signOut } from "@/lib/auth-store";
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

  const active = user;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setBusy(true);
    const res = await updateMyPassword(password);
    setBusy(false);
    if (!res.ok) return toast.error(res.error ?? "Could not update password.");
    toast.success("Password updated. Redirecting…");
    if (active.accountStatus === "pending-approval") {
      navigate({ to: "/pending-approval" });
    } else {
      navigate({ to: landingPathFor(active.role) });
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/30 p-6">
      <Card className="w-full max-w-lg border-border/70">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <Logo className="h-7 w-auto" />
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={async () => { await signOut(); navigate({ to: "/login" }); }}>Sign out</button>
          </div>
          <h1 className="text-2xl font-bold">Set your new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {active.email}</p>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <LockKeyhole className="h-5 w-5" />
            <span>This temporary password must be replaced before you can continue.</span>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required className="pr-12" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save and continue"}</Button>
          </form>
          <p className="mt-4 text-center"><Link to="/" className="text-xs text-muted-foreground hover:underline">Back home</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
