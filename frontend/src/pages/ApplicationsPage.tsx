import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared/PageComponents";
import { api, type Application, type ApplicationStatus, type CoverLetterResponse } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<CoverLetterResponse | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.listApplications();
        setApplications(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const canUpdateStatus = user?.role === "recruiter" || user?.role === "admin";

  const rows = useMemo(() => applications, [applications]);
  const formatCreatedAt = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const updateStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      const updated = await api.updateApplicationStatus(applicationId, status);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      toast.success("Application updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  };

  const openCoverLetter = async (coverLetterId: string) => {
    try {
      setCoverLetterLoading(true);
      const data = await api.getCoverLetter(coverLetterId);
      setSelectedCoverLetter(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load cover letter");
    } finally {
      setCoverLetterLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Applications" subtitle="Track and manage job applications." />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Resume</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cover Letter</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                {canUpdateStatus && <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((app) => (
                <tr key={app.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted-foreground">{app.job_title || app.job_id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{app.applicant_name || app.applicant_username || app.user_id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{app.resume_id || "N/A"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {app.cover_letter_id ? (
                      <button
                        type="button"
                        className="font-mono text-primary hover:underline"
                        onClick={() => void openCoverLetter(app.cover_letter_id!)}
                      >
                        {app.cover_letter_id}
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatCreatedAt(app.created_at)}</td>
                  <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
                  {canUpdateStatus && (
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, "interview")}>Interview</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, "rejected")}>Reject</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-muted-foreground mt-4">Loading applications...</p>}
      {!loading && rows.length === 0 && <p className="text-muted-foreground mt-4">No applications found.</p>}

      <Dialog open={!!selectedCoverLetter || coverLetterLoading} onOpenChange={(open) => (!open ? setSelectedCoverLetter(null) : null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cover Letter</DialogTitle>
            <DialogDescription>
              {selectedCoverLetter ? `Source: ${selectedCoverLetter.generator_source}` : "Loading cover letter..."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={selectedCoverLetter?.generated_text || ""}
            readOnly
            className="min-h-[360px] resize-none"
          />
          {selectedCoverLetter && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const blob = await api.downloadCoverLetterFile(selectedCoverLetter.id);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `cover-letter-${selectedCoverLetter.id}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Download failed");
                  }
                }}
              >
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsPage;
