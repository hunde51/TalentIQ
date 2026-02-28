import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { api, type AuditLogItem } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [userId, setUserId] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.listAuditLogs({
        page: 1,
        size: 100,
        user_id: userId.trim() || undefined,
        method: method.trim() || undefined,
      });
      setLogs(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Track user actions across the platform." />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filter by user_id" />
        <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Filter by method (GET/POST/PATCH...)" />
        <Button variant="outline" onClick={() => void loadLogs()}>Filter</Button>
        <Button variant="outline" onClick={() => { setUserId(""); setMethod(""); void loadLogs(); }}>Reset</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">User ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Path</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && logs.map((log) => (
                <tr key={log.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{log.user_id || "anonymous"}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{log.action}</td>
                  <td className="px-5 py-3 text-muted-foreground">{log.method}</td>
                  <td className="px-5 py-3 text-muted-foreground">{log.path}</td>
                  <td className="px-5 py-3 text-muted-foreground">{log.status_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-muted-foreground mt-4">Loading audit logs...</p>}
    </div>
  );
};

export default AuditLogPage;
