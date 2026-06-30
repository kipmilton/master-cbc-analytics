import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-store";
import { useSession } from "@/hooks/use-session";
import { LogOut, LayoutDashboard, Building2, Users, BookOpen, GraduationCap, BarChart3, FileSpreadsheet, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const navByRole = {
  super_admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/schools", label: "Schools", icon: Building2 },
  ] as NavItem[],
  school_admin: [
    { to: "/school", label: "Overview", icon: LayoutDashboard },
    { to: "/school/subjects", label: "Subjects", icon: BookOpen },
    { to: "/school/teachers", label: "Teachers", icon: Users },
    { to: "/school/analytics", label: "Analytics", icon: BarChart3 },
  ] as NavItem[],
  teacher: [
    { to: "/teacher", label: "Overview", icon: LayoutDashboard },
    { to: "/teacher/classes", label: "My Classes", icon: GraduationCap },
    { to: "/teacher/exams", label: "Enter Exam", icon: FileSpreadsheet },
    { to: "/teacher/directory", label: "Directory", icon: Users },
  ] as NavItem[],
};

export function AppShell({ children, allow }: { children: ReactNode; allow: Array<"super_admin" | "school_admin" | "teacher"> }) {
  const user = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (user === null) navigate({ to: "/login", replace: true });
    else if (user && !allow.includes(user.role)) navigate({ to: "/login", replace: true });
  }, [user, allow, navigate]);

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const items = navByRole[user.role];

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo className="h-7 w-auto" />
        </div>
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
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-md bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
            <ShieldCheck className="h-4 w-4 text-[color:var(--brand-blue)]" />
            <span>Row-Level Secured</span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          <div className="md:hidden"><Logo className="h-6 w-auto" /></div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.title ?? user.role.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate({ to: "/login" }); }}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>
        <div className="flex md:hidden gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
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
