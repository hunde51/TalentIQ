import { useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api, type UserListItem, type UserRole } from "@/lib/api";

const UsersPage = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async (q?: string) => {
    try {
      setLoading(true);
      const data = await api.listUsers({ page: 1, size: 100, q });
      setUsers(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleStatus = async (user: UserListItem) => {
    try {
      const updated = await api.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated.user : u)));
      toast.success(updated.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  };

  const changeRole = async (user: UserListItem, role: UserRole) => {
    try {
      const updated = await api.updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated.user : u)));
      toast.success(updated.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Role update failed");
    }
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage platform users and roles." />

      <div className="flex gap-2 mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or user id"
        />
        <Button variant="outline" onClick={() => void loadUsers(query.trim() || undefined)}>Search</Button>
        <Button variant="outline" onClick={() => { setQuery(""); void loadUsers(); }}>Reset</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">User ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Verified</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.map((u) => (
                <tr key={u.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{u.id}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => void changeRole(u, e.target.value as UserRole)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="job_seeker">Job Seeker</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={u.is_active ? "active" : "inactive"} /></td>
                  <td className="px-5 py-3"><StatusBadge status={u.is_verified ? "active" : "inactive"} /></td>
                  <td className="px-5 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void toggleStatus(u)}
                      className={u.is_active ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-muted-foreground mt-4">Loading users...</p>}
    </div>
  );
};

export default UsersPage;
