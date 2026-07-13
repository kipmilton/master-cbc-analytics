import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { signIn, landingPathFor } from "@/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Master CBC" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setErrorMessage("");

    const result = await signIn(email, password);
    console.log("login submit", { email, password, result });

    setBusy(false);

    if (!result.user) {
      const message = result.errorMessage || "Email or password is incorrect. Please try again.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    toast.success(`Welcome back, ${result.user.name.split(" ")[0]}`);
    if (result.user.requiresPasswordReset) {
      navigate({ to: "/reset-password" });
      return;
    }
    if (result.user.accountStatus === "pending-approval" && result.user.role === "teacher") {
      navigate({ to: "/pending-approval" });
      return;
    }
    navigate({ to: landingPathFor(result.user.role) });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-linear-to-br from-primary/15 via-accent/30 to-secondary/40 p-10 lg:flex">
        <Link to="/">
          <Logo className="h-8 w-auto" />
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Welcome back.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Pick up where you left off — your school's data is waiting,
            securely scoped to your role.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/70 p-4 text-sm backdrop-blur">
          <div className="font-semibold">Secure Login</div>
          <p className="mt-2 text-muted-foreground">
            Sign in using the email address and password assigned to your
            account.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/70">
          <CardContent className="p-8">
            <div className="mb-6 lg:hidden">
              <Logo className="h-7 w-auto" />
            </div>

            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>

            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your Master CBC dashboard.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className="pr-12"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}