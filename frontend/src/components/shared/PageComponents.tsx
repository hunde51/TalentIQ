import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: "default" | "primary" | "accent" | "success" | "warning";
}) => {
  const iconBg: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-success font-medium mt-1">{trend}</p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    applied: "bg-info/10 text-info",
    interview: "bg-warning/10 text-warning",
    rejected: "bg-destructive/10 text-destructive",
    offered: "bg-success/10 text-success",
    new: "bg-info/10 text-info",
    shortlisted: "bg-accent/10 text-accent",
    active: "bg-success/10 text-success",
    inactive: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        styles[status] || "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
};
