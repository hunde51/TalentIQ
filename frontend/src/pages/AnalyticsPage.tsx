import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/shared/PageComponents";
import { api, type AnalyticsResponse, type Application } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { BarChart3, Users2, CheckCircle2, XCircle, Target } from "lucide-react";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [analyticsData, apps] = await Promise.all([api.analytics(), api.listApplications()]);
        setAnalytics(analyticsData);
        setApplications(apps);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const summary = useMemo(() => {
    const total = applications.length;
    const interviewed = applications.filter((a) => a.status === "interview").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    const pending = applications.filter((a) => a.status === "applied").length;
    const interviewRate = total ? Math.round((interviewed / total) * 100) : 0;
    return { total, interviewed, rejected, pending, interviewRate };
  }, [applications]);

  const topJobs = useMemo(() => (analytics?.applications_per_job || []).slice(0, 6), [analytics]);
  const topJobPeak = useMemo(
    () => topJobs.reduce((max, item) => Math.max(max, item.application_count), 0),
    [topJobs],
  );

  const funnel = useMemo(
    () => [
      { stage: "Applied", count: summary.total || 0, color: "hsl(234 62% 37%)" },
      { stage: "Interview", count: summary.interviewed, color: "hsl(173 58% 39%)" },
      { stage: "Rejected", count: summary.rejected, color: "hsl(0 72% 51%)" },
    ],
    [summary],
  );

  if (user?.role !== "recruiter" && user?.role !== "admin") {
    return <p className="text-muted-foreground">Analytics is available for recruiter/admin only.</p>;
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Hiring performance insights for your jobs and applicants."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Applications" value={summary.total} icon={<Users2 className="w-5 h-5" />} variant="primary" />
        <StatCard label="Pending Review" value={summary.pending} icon={<BarChart3 className="w-5 h-5" />} variant="accent" />
        <StatCard label="Interviewed" value={summary.interviewed} icon={<CheckCircle2 className="w-5 h-5" />} variant="success" />
        <StatCard label="Rejected" value={summary.rejected} icon={<XCircle className="w-5 h-5" />} variant="warning" />
        <StatCard label="Interview Rate" value={`${summary.interviewRate}%`} icon={<Target className="w-5 h-5" />} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2">Hiring Funnel</h3>
          <p className="text-sm text-muted-foreground mb-4">How candidates move through your pipeline.</p>
          <div className="space-y-3">
            {funnel.map((item) => {
              const pct = summary.total ? Math.max(4, Math.round((item.count / summary.total) * 100)) : 0;
              return (
                <div key={item.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{item.stage}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2">Top Skills Demand</h3>
          <p className="text-sm text-muted-foreground mb-4">Most requested skills in current postings.</p>
          <div className="flex flex-wrap gap-2">
            {(analytics?.popular_skills || []).slice(0, 14).map((skill) => (
              <span
                key={skill.skill}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                <span className="font-medium">{skill.skill}</span>
                <span className="text-muted-foreground">({skill.count})</span>
              </span>
            ))}
            {(analytics?.popular_skills || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No skill data available yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-2">Job Performance</h3>
        <p className="text-sm text-muted-foreground mb-4">Applications count by job title.</p>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className="h-[300px] rounded-xl border border-border bg-background/40 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={topJobs.map((job, index) => ({
                  ...job,
                  rankLabel: `#${index + 1}`,
                  shortTitle: job.title.length > 16 ? `${job.title.slice(0, 16)}...` : job.title,
                }))}
                margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="jobPerfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(234 62% 45%)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(234 62% 45%)" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(220 16% 90%)" />
                <XAxis dataKey="rankLabel" tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} applications`, "Count"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.title || "Job"}
                />
                <Area
                  type="monotone"
                  dataKey="application_count"
                  stroke="hsl(234 62% 37%)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#jobPerfFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {topJobs.map((job, idx) => {
              const pct = topJobPeak ? Math.round((job.application_count / topJobPeak) * 100) : 0;
              return (
                <div key={job.job_id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {idx + 1}. {job.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{job.application_count}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/90 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {topJobs.length === 0 && <p className="text-sm text-muted-foreground mt-2">No job performance data available.</p>}
          </div>
        </div>
      </section>

      {loading && <p className="text-muted-foreground mt-4">Loading analytics...</p>}
    </div>
  );
};

export default AnalyticsPage;
