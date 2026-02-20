import { mockApplications } from "@/data/mockData";
import { PageHeader, StatusBadge } from "@/components/shared/PageComponents";

const ApplicationsPage = () => (
  <div>
    <PageHeader title="My Applications" subtitle="Track all your job applications." />

    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job Title</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Company</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Applied</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Skill</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockApplications.map((app) => (
              <tr key={app.id} className="table-row-hover border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">{app.jobTitle}</td>
                <td className="px-5 py-3 text-muted-foreground">{app.company}</td>
                <td className="px-5 py-3 text-muted-foreground">{app.appliedAt}</td>
                <td className="px-5 py-3"><span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{app.skill}</span></td>
                <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default ApplicationsPage;
