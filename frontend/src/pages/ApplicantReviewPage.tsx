import { useState } from "react";
import { mockApplicants, mockJobs } from "@/data/mockData";
import { PageHeader, StatusBadge } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, UserX, Calendar, Star } from "lucide-react";

const ApplicantReviewPage = () => {
  const [applicants, setApplicants] = useState(mockApplicants);
  const [selectedJob, setSelectedJob] = useState(mockJobs[0].id);

  const updateStatus = (id: string, status: typeof applicants[0]["status"]) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Applicant ${status}`);
  };

  return (
    <div>
      <PageHeader title="Applicant Review" subtitle="Review and manage candidates.">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {mockJobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
      </PageHeader>

      <div className="space-y-4">
        {applicants.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{a.name}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted-foreground">{a.email} • {a.experience} experience</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {a.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{s}</span>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-semibold text-foreground">AI Match Score: {a.matchScore}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.aiFeedback}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "shortlisted")} className="gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Shortlist
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "interview")} className="gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Interview
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "rejected")} className="gap-1.5 text-destructive hover:text-destructive">
                  <UserX className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicantReviewPage;
