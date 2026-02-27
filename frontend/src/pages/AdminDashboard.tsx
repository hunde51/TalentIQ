import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/shared/PageComponents";
import { Users, Briefcase, FileText, Shield } from "lucide-react";
import { api, type AnalyticsResponse } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.analytics();
        setAnalytics(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalApplications = analytics?.applications_per_job.reduce((sum, item) => sum + item.application_count, 0) || 0;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview from backend analytics." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Analytics Jobs" value={analytics?.applications_per_job.length || 0} icon={<Briefcase className="w-5 h-5" />} variant="primary" />
        <StatCard label="Applications" value={totalApplications} icon={<FileText className="w-5 h-5" />} variant="accent" />
        <StatCard label="Popular Skills" value={analytics?.popular_skills.length || 0} icon={<Users className="w-5 h-5" />} variant="success" />
        <StatCard label="Audit Events" value="N/A" icon={<Shield className="w-5 h-5" />} variant="warning" />
      </div>

      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Applications per Job</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.applications_per_job}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <Tooltip />
                <Bar dataKey="application_count" fill="hsl(173 58% 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Popular Skills</h3>
            <div className="space-y-3">
              {analytics.popular_skills.map((skill) => (
                <div key={skill.skill} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{skill.skill}</span>
                  <span className="text-muted-foreground">{skill.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          User management and audit log details are available in dedicated pages, and require backend list endpoints.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
