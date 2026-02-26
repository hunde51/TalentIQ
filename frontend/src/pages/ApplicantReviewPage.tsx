import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, UserX, Calendar, Download } from "lucide-react";
import { api, type Application } from "@/lib/api";

const ApplicantReviewPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [downloadingLetters, setDownloadingLetters] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listApplications();
        setApplications(data);
        if (data.length > 0) setSelectedJob(data[0].job_id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load applicants");
      }
    };
    load();
  }, []);

  const jobOptions = useMemo(
    () =>
      Array.from(
        new Map(applications.map((a) => [a.job_id, a.job_title || "Untitled Job"])).entries(),
      ),
    [applications],
  );
  const filtered = useMemo(
    () => applications.filter((a) => (selectedJob ? a.job_id === selectedJob : true)),
    [applications, selectedJob],
  );

  const updateStatus = async (id: string, status: "interview" | "rejected") => {
    try {
      const updated = await api.updateApplicationStatus(id, status);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Applicant status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const downloadCoverLetter = async (application: Application) => {
    if (!application.cover_letter_id) {
      toast.error("No uploaded cover letter for this applicant");
      return;
    }

    setDownloadingLetters((prev) => new Set(prev).add(application.id));
    try {
      const blob = await api.downloadCoverLetterFile(application.cover_letter_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${application.cover_letter_id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloadingLetters((prev) => {
        const next = new Set(prev);
        next.delete(application.id);
        return next;
      });
    }
  };

  return (
    <div>
      <PageHeader title="Applicant Review" subtitle="Review and manage candidates.">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {jobOptions.map(([jobId, jobTitle]) => (
            <option key={jobId} value={jobId}>
              {jobTitle}
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="space-y-4">
        {filtered.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground text-sm">
                    {a.applicant_name || a.applicant_username || "Applicant"}
                  </h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted-foreground">Job: {a.job_title || "Untitled Job"}</p>
                <p className="text-sm text-muted-foreground">
                  Applicant: {a.applicant_name || a.applicant_username || a.user_id}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "interview")} className="gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Interview
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "interview")} className="gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Shortlist
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "rejected")} className="gap-1.5 text-destructive hover:text-destructive">
                  <UserX className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void downloadCoverLetter(a)}
                  disabled={!a.cover_letter_id || downloadingLetters.has(a.id)}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingLetters.has(a.id) ? "Downloading..." : "Download Letter"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-muted-foreground">No applicants for selected job.</p>}
    </div>
  );
};

export default ApplicantReviewPage;
