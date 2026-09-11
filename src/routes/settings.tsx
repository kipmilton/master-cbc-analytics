import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { updateMyProfile } from "@/lib/me.functions";
import { updateMyPassword, roleLabel } from "@/lib/auth-store";
import { getGreeting } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, KeyRound, Eye, EyeOff, Save, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — Master CBC" },
      { name: "description", content: "Manage your profile details and account password." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = useSession();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name ?? "");
      setTitle(user.title ?? "");
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      return toast.error("Full name cannot be empty.");
    }
    setSavingProfile(true);
    try {
      await updateMyProfile({
        data: {
          fullName: fullName.trim(),
          ...(title.trim() ? { title: title.trim() } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.invalidateQueries();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match.");
    }

    setSavingPassword(true);
    try {
      const res = await updateMyPassword(newPassword);
      if (res.ok) {
        toast.success("Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Failed to update password.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell allow={["super_admin", "school_admin", "teacher"]}>
      <PageHeader
        title={getGreeting(user?.name)}
        subtitle="Manage your profile settings and update your account password."
      />

      <div className="max-w-4xl space-y-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile Details
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Change Password
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="mt-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Profile Information
                </CardTitle>
                <CardDescription>
                  Update your display name as seen across your school dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Your registered email address is used for authentication and notifications.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role" className="text-xs font-semibold">
                      Assigned Role
                    </Label>
                    <div>
                      <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold py-1 px-3">
                        {user ? roleLabel(user.role) : "User"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Jane Doe"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-xs font-semibold">
                      Display Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Principal"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Shown under your greeting on the dashboard.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={savingProfile} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {savingProfile ? "Saving changes…" : "Save profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PASSWORD */}
          <TabsContent value="password" className="mt-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" /> Password &amp; Security
                </CardTitle>
                <CardDescription>
                  Ensure your account is using a strong, secret password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePassword} className="space-y-5 max-w-lg">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Re-enter your new password"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Your password change will be saved immediately to your active session.</span>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={savingPassword} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {savingPassword ? "Updating password…" : "Update password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
