import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-store";
import { roleLabel, isSchoolAdminRole } from "@/lib/roles";
import { useSession } from "@/hooks/use-session";
import { useSchoolData } from "@/hooks/use-school-data";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut, LayoutDashboard, Building2, Users, BookOpen, GraduationCap, BarChart3,
  FileSpreadsheet, ShieldCheck, SlidersHorizontal, UsersRound, ClipboardCheck, UserSquare2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }

type AllowRole = "super_admin" | "school_admin" | "teacher";

function matchesAllow(role: string, allow: AllowRole[]): boolean {
  if (allow.includes("school_admin") && isSchoolAdminRole(role)) return true;
  return (allow as string[]).includes(role);
}

export function AppShell({ children, allow }: { children: ReactNode; allow: AllowRole[] }) {
  const user = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { rosters } = useSchoolData();

  useEffect(() => {
    if (user === undefined) return;

    if (user === null) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (user.requiresPasswordReset && pathname !== "/reset-password") {
      navigate({ to: "/reset-password", replace: true });
      return;
    }

    if (user.accountStatus === "pending-approval" && pathname !== "/pending-approval") {
      navigate({ to: "/pending-approval", replace: true });
      return;
    }

    if (user.role === "unassigned" || !matchesAllow(user.role, allow)) {
      navigate({ to: "/pending-approval", replace: true });
      return;
    }
  }, [user, allow, navigate, pathname]);

  if (user === undefined || user === null) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const schoolAdmin = isSchoolAdminRole(user.role);
  const isClassTeacher = user.role === "teacher" && user.classTeacherStreams.length > 0;
  const pendingRosters = schoolAdmin ? rosters.filter((r) => r.status === "pending").length : 0;

  const items: NavItem[] = user.role === "super_admin"
    ? [
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/schools", label: "Schools", icon: Building2 },
      ]
    : schoolAdmin
    ? [
        { to: "/school", label: "Overview", icon: LayoutDashboard },
        { to: "/school/students", label: "Students & Streams", icon: UsersRound },
        { to: "/school/rosters", label: "Roster Approvals", icon: ClipboardCheck, badge: pendingRosters || undefined },
        { to: "/school/subjects", label: "Subjects", icon: BookOpen },
        { to: "/school/exams", label: "Exams & Results", icon: FileSpreadsheet },
        { to: "/school/grading", label: "Grading", icon: SlidersHorizontal },
        { to: "/school/teachers", label: "Staff", icon: Users },
        { to: "/school/analytics", label: "Analytics", icon: BarChart3 },
      ]
    : (() => {
        const base: NavItem[] = [
          { to: "/teacher", label: "Overview", icon: LayoutDashboard },
          { to: "/teacher/classes", label: "My Classes", icon: GraduationCap },
          { to: "/teacher/exams", label: "Enter Exam", icon: FileSpreadsheet },
          { to: "/teacher/directory", label: "Directory", icon: Users },
        ];
        if (isClassTeacher) base.splice(2, 0, { to: "/teacher/my-class", label: "My Class", icon: UserSquare2 });
        return base;
      })();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo className="h-7 w-auto" />
        </div>
        {user.schoolName && (
          <div className="border-b border-border px-5 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">School</div>
            <div className="truncate text-sm font-semibold">{user.schoolName}</div>
          </div>
        )}
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <Badge className="h-5 min-w-5 justify-center bg-emerald-500 px-1.5 text-[10px] text-white hover:bg-emerald-500">
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-md bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
            <ShieldCheck className="h-4 w-4 text-brand-blue" />
            <span>Tenant isolated</span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          <div className="md:hidden"><Logo className="h-6 w-auto" /></div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.title ?? roleLabel(user.role)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>
        <div className="flex md:hidden gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
