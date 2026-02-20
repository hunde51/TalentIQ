import { mockJobs, skillDemandData } from "@/data/mockData";
import { PageHeader, StatCard } from "@/components/shared/PageComponents";
import { Briefcase, Users, TrendingUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(234 62% 37%)", "hsl(173 58% 39%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)", "hsl(152 60% 40%)", "hsl(210 100% 52%)"];

const applicantsPerJob = mockJobs.map((j) => ({ name: j.title.split(" ").slice(0, 2).join(" "), applicants: j.applicants }));

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const totalApplicants = mockJobs.reduce((s, j) => s + j.applicants, 0);

  return (
    <div>
      <PageHeader title="Recruiter Dashboard" subtitle="Manage your job postings and candidates.">
        <Button onClick={() => navigate("/post-job")} className="gap-2">
          <PlusCircle className="w-4 h-4" /> Post New Job
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Jobs" value={mockJobs.length} icon={<Briefcase className="w-5 h-5" />} variant="primary" />
        <StatCard label="Total Applicants" value={totalApplicants} icon={<Users className="w-5 h-5" />} variant="accent" trend="+24 this week" />
        <StatCard label="Avg. Match Score" value="82%" icon={<TrendingUp className="w-5 h-5" />} variant="success" />
        <StatCard label="Interviews Scheduled" value={12} icon={<Briefcase className="w-5 h-5" />} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Applicants per Job</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applicantsPerJob}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <Tooltip />
              <Bar dataKey="applicants" fill="hsl(234 62% 37%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Skills Demand</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={skillDemandData} dataKey="demand" nameKey="skill" cx="50%" cy="50%" outerRadius={90} label={({ skill }) => skill}>
                {skillDemandData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Posted Jobs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Your Posted Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Applicants</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Posted</th>
              </tr>
            </thead>
            <tbody>
              {mockJobs.map((job) => (
                <tr key={job.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{job.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{job.location}</td>
                  <td className="px-5 py-3 text-muted-foreground">{job.type}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{job.applicants}</td>
                  <td className="px-5 py-3 text-muted-foreground">{job.postedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
