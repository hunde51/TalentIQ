import { mockAuditLogs } from "@/data/mockData";
import { PageHeader } from "@/components/shared/PageComponents";

const AuditLogPage = () => (
  <div>
    <PageHeader title="Audit Log" subtitle="Track all user actions on the platform." />

    <div className="bg-card border border-border rounded-xl overflow-hidden">
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

export default AuditLogPage;
