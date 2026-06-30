import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, hint, icon, accent = "primary" }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: "primary" | "blue" | "emerald" }) {
  const accentBg = accent === "blue" ? "bg-[color:var(--brand-blue)]/10 text-[color:var(--brand-blue)]" : accent === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary";
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg}`}>{icon}</div>}
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
