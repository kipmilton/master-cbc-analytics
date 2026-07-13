import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { submitSchoolApplication } from "@/lib/tenants.functions";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — Master CBC" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [system, setSystem] = useState<"cbc" | "844" | "both" | "">("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    if (!system) return toast.error("Pick a curriculum system");

    setBusy(true);
    try {
      await submitSchoolApplication({
        data: {
          email: String(fd.get("email") ?? ""),
          password: String(fd.get("pw") ?? ""),
          schoolName: String(fd.get("sname") ?? ""),
          county: String(fd.get("county") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          system,
          principalName: String(fd.get("pname") ?? ""),
          principalTitle: "Principal",
        },
      });
      toast.success("Application submitted. Sign in to see your approval status.");
      navigate({ to: "/login" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit your application.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/70">
          <CardContent className="p-8">
            <div className="mb-6"><Logo className="h-7 w-auto" /></div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
            <h1 className="text-2xl font-bold">Register your school</h1>
            <p className="mt-1 text-sm text-muted-foreground">Submit your details — we'll approve within 24 hrs.</p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2"><Label htmlFor="sname">School name</Label><Input id="sname" name="sname" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label htmlFor="county">County</Label><Input id="county" name="county" required /></div>
                <div className="grid gap-2">
                  <Label>System</Label>
                  <Select value={system} onValueChange={(v) => setSystem(v as typeof system)} required>
                    <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cbc">CBC (Grades 7-12)</SelectItem>
                      <SelectItem value="844">8-4-4 (Form 3-4)</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2"><Label htmlFor="pname">Principal full name</Label><Input id="pname" name="pname" required /></div>
              <div className="grid gap-2"><Label htmlFor="email">Principal email</Label><Input id="email" name="email" type="email" required /></div>
              <div className="grid gap-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required /></div>
              <div className="grid gap-2"><Label htmlFor="pw">Choose a password</Label><Input id="pw" name="pw" type="password" minLength={8} required /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="relative hidden flex-col justify-between bg-linear-to-br from-(--brand-blue)/15 via-accent/20 to-primary/15 p-10 lg:flex">
        <Link to="/"><Logo className="h-8 w-auto" /></Link>
        <div>
          <h2 className="text-3xl font-bold">Your school, fully on-board in under a week.</h2>
          <p className="mt-3 max-w-md text-muted-foreground">Free onboarding, free teacher training, and white-glove data migration from your existing spreadsheets.</p>
        </div>
        <div className="text-sm text-muted-foreground">© Master CBC</div>
      </div>
    </div>
  );
}
