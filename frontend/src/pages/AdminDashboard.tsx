import { mockUsers, mockAuditLogs, mockJobs, mockApplications } from "@/data/mockData";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared/PageComponents";
import { Users, Briefcase, FileText, Shield } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const usersByRole = [
  { role: "Job Seekers", count: mockUsers.filter((u) => u.role === "job_seeker").length },
  { role: "Recruiters", count: mockUsers.filter((u) => u.role === "recruiter").length },
  { role: "Admins", count: mockUsers.filter((u) => u.role === "admin").length },
];

const AdminDashboard = () => (
  <div>
    <PageHeader title="Admin Dashboard" subtitle="Platform overview and system management." />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total Users" value={mockUsers.length} icon={<Users className="w-5 h-5" />} variant="primary" trend="+3 this month" />
      <StatCard label="Jobs Posted" value={mockJobs.length} icon={<Briefcase className="w-5 h-5" />} variant="accent" />
      <StatCard label="Applications" value={mockApplications.length} icon={<FileText className="w-5 h-5" />} variant="success" />
      <StatCard label="Audit Events" value={mockAuditLogs.length} icon={<Shield className="w-5 h-5" />} variant="warning" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Users by Role</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={usersByRole}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 90%)" />
            <XAxis dataKey="role" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(173 58% 39%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Management mini */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.slice(0, 5).map((u) => (
                <tr key={u.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">{u.role.replace("_", " ")}</td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Audit Log */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Audit Log</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Target</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLogs.map((log) => (
              <tr key={log.id} className="table-row-hover border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">{log.user}</td>
                <td className="px-5 py-3 text-muted-foreground">{log.action}</td>
                <td className="px-5 py-3 text-muted-foreground">{log.target}</td>
                <td className="px-5 py-3 text-muted-foreground">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
