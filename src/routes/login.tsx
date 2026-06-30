import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { signIn, landingPathFor } from "@/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Master CBC" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      const u = signIn(email, password);
      setBusy(false);
      if (!u) { toast.error("Invalid email or password"); return; }
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate({ to: landingPathFor(u.role) });
    }, 400);
  }

  function quickLogin(e: string, p: string) { setEmail(e); setPassword(p); }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/15 via-accent/30 to-secondary/40 p-10 lg:flex">
        <Link to="/"><Logo className="h-8 w-auto" /></Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Welcome back.</h2>
          <p className="mt-3 max-w-md text-muted-foreground">Pick up where you left off — your school&apos;s data is waiting, securely scoped to your role.</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-4 text-sm backdrop-blur">
          <div className="font-semibold">Demo accounts</div>
          <div className="mt-2 grid gap-2">
            <button type="button" onClick={() => quickLogin("super@mastercbc.co.ke", "super123")} className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted">
              <div className="font-medium">Super Admin</div>
              <div className="text-muted-foreground">super@mastercbc.co.ke / super123</div>
            </button>
            <button type="button" onClick={() => quickLogin("principal@riverside.ac.ke", "school123")} className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted">
              <div className="font-medium">Principal / Deputy</div>
              <div className="text-muted-foreground">principal@riverside.ac.ke / school123</div>
            </button>
            <button type="button" onClick={() => quickLogin("teacher@riverside.ac.ke", "teach123")} className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted">
              <div className="font-medium">Teacher</div>
              <div className="text-muted-foreground">teacher@riverside.ac.ke / teach123</div>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/70">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6"><Logo className="h-7 w-auto" /></div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access your Master CBC dashboard.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No account? <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
