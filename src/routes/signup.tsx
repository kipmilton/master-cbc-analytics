import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — Master CBC" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [system, setSystem] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("pw") ?? "");
    const name = String(fd.get("pname") ?? "").trim();
    const schoolName = String(fd.get("sname") ?? "").trim();
    const county = String(fd.get("county") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();

    if (!system) return toast.error("Please pick a curriculum system");

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          role: "school_admin",
          name,
          title: "Principal",
          pendingSchool: { name: schoolName, county, phone, system },
        },
      },
    });
    setBusy(false);

    if (error) {
      const message = error.message || "We couldn't submit your application right now.";
      if (error.status === 429 || /rate|too many/i.test(message)) {
        return toast.error("Too many signup attempts. Please wait a minute and try again.");
      }
      if (/already|registered|exists/i.test(message)) {
        return toast.error("This email is already registered. Please sign in instead.");
      }
      return toast.error(message);
    }

    if (!data.user) {
      return toast.error("We couldn't create your account. Please try again.");
    }

    toast.success("Application submitted. Check your email to verify, then sign in.");
    form.reset();
    setSystem("");
    navigate({ to: "/login" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/70">
          <CardContent className="p-8">
            <div className="mb-6"><Logo className="h-7 w-auto" /></div>
            <h1 className="text-2xl font-bold">Register your school</h1>
            <p className="mt-1 text-sm text-muted-foreground">Submit your details — Super Admin will approve within 24 hrs.</p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2"><Label htmlFor="sname">School name</Label><Input id="sname" name="sname" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label htmlFor="county">County</Label><Input id="county" name="county" required /></div>
                <div className="grid gap-2">
                  <Label>System</Label>
                  <Select value={system} onValueChange={setSystem} required>
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
