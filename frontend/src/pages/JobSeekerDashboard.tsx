import {
  mockResume,
  mockApplications,
  mockJobs,
  applicationsBySkill,
  trendingJobsData,
} from "@/data/mockData";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared/PageComponents";
import { Briefcase, FileText, TrendingUp, Send } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const JobSeekerDashboard = () => {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back, Alex! Here's your career overview." />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications" value={mockApplications.length} icon={<Send className="w-5 h-5" />} variant="primary" trend="+2 this week" />
        <StatCard label="Interviews" value={mockApplications.filter((a) => a.status === "interview").length} icon={<Briefcase className="w-5 h-5" />} variant="accent" />
        <StatCard label="Skills Matched" value={mockResume.skills.length} icon={<TrendingUp className="w-5 h-5" />} variant="success" />
        <StatCard label="Resume Score" value="92%" icon={<FileText className="w-5 h-5" />} variant="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Applications by Skill</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={applicationsBySkill}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
              <XAxis dataKey="skill" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(234 62% 37%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Trending Jobs</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendingJobsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <Tooltip />
              <Line type="monotone" dataKey="jobs" stroke="hsl(173 58% 39%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(173 58% 39%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resume Summary */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-foreground mb-3">AI Resume Summary</h3>
        <p className="text-muted-foreground text-sm mb-4">{mockResume.summary}</p>
        <div className="flex flex-wrap gap-2">
          {mockResume.skills.map((skill) => (
            <span key={skill} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="mb-8">
        <h3 className="font-semibold text-foreground mb-4">AI-Recommended Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockJobs.slice(0, 3).map((job) => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-foreground">{job.title}</h4>
              <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
              <p className="text-sm font-medium text-accent mt-2">{job.salary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Tracking */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Application Tracking</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job Title</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Applied</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockApplications.map((app) => (
                <tr key={app.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{app.jobTitle}</td>
                  <td className="px-5 py-3 text-muted-foreground">{app.company}</td>
                  <td className="px-5 py-3 text-muted-foreground">{app.appliedAt}</td>
                  <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
