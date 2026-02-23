import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared/PageComponents";
import { Briefcase, FileText, TrendingUp, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { api, type Application, type Job, type JobMatchResponse } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const JobSeekerDashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matchResult, setMatchResult] = useState<JobMatchResponse | null>(null);
  const [resumeId, setResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [apps, jobList] = await Promise.all([
          api.listApplications(),
          api.listJobs({ page: 1, size: 50 }),
        ]);
        setApplications(apps);
        setJobs(jobList.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const applicationsByMonth = useMemo(() => {
    const monthMap = new Map<string, number>();
    applications.forEach((app) => {
      const month = new Date(app.created_at).toLocaleString(undefined, { month: "short" });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
  }, [applications]);

  const applicationsByStatus = useMemo(() => {
    const statusMap = new Map<string, number>();
    applications.forEach((app) => {
      statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1);
    });
    return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
  }, [applications]);

  const matchedJobs = matchResult?.matches || [];

  const handleMatch = async () => {
    if (!resumeId.trim()) {
      toast.error("Enter resume ID to run job matching");
      return;
    }

    try {
      setMatching(true);
      const result = await api.matchJobs({ resume_id: resumeId.trim(), top_k: 5 });
      setMatchResult(result);
      toast.success("Job match generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Job matching failed");
    } finally {
      setMatching(false);
    }
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your live overview from backend data." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications" value={applications.length} icon={<Send className="w-5 h-5" />} variant="primary" />
        <StatCard label="Interviews" value={applications.filter((a) => a.status === "interview").length} icon={<Briefcase className="w-5 h-5" />} variant="accent" />
        <StatCard label="Open Jobs" value={jobs.length} icon={<TrendingUp className="w-5 h-5" />} variant="success" />
        <StatCard label="Matched Jobs" value={matchedJobs.length} icon={<FileText className="w-5 h-5" />} variant="warning" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-foreground mb-3">AI Job Matching</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input value={resumeId} onChange={(e) => setResumeId(e.target.value)} placeholder="Paste resumes.id" />
          <Button onClick={handleMatch} disabled={matching}>{matching ? "Matching..." : "Run Match"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Applications by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={applicationsByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(234 62% 37%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Applications Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={applicationsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(173 58% 39%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(173 58% 39%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-foreground mb-4">Matched Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchedJobs.map((job) => (
            <div key={job.job_id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-foreground">{job.title}</h4>
              <p className="text-sm text-muted-foreground">{job.location}</p>
              <p className="text-sm font-medium text-accent mt-2">Score: {(job.similarity_score * 100).toFixed(1)}%</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {matchedJobs.length === 0 && <p className="text-sm text-muted-foreground">Run match to see recommended jobs.</p>}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Application Tracking</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Application ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Applied</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground font-mono text-xs">{app.id}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{app.job_id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-muted-foreground mt-4">Loading dashboard...</p>}
    </div>
  );
};

export default JobSeekerDashboard;
