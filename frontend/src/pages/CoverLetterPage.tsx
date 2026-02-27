import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, type CoverLetterResponse } from "@/lib/api";

const CoverLetterPage = () => {
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState<CoverLetterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResume, setLoadingResume] = useState(true);

  useEffect(() => {
    const loadDefaultResume = async () => {
      try {
        const privacy = await api.getPrivacySettings();
        if (privacy.default_resume_id) {
          setResumeId(privacy.default_resume_id);
          return;
        }
        const latest = await api.getLatestResume();
        setResumeId(latest.id);
      } catch {
        // No resume yet; handled in UI.
      } finally {
        setLoadingResume(false);
      }
    };

    void loadDefaultResume();
  }, []);

  const handleCopy = () => {
    if (!coverLetter?.generated_text) return;
    navigator.clipboard.writeText(coverLetter.generated_text);
    toast.success("Copied");
  };

  const handleDownload = async () => {
    if (!coverLetter) return;
    try {
      const blob = await api.downloadCoverLetterFile(coverLetter.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${coverLetter.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  const handleGenerate = async () => {
    if (!resumeId.trim()) {
      toast.error("Upload a resume first from Resume page.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Job description is required");
      return;
    }

    try {
      setLoading(true);
      const data = await api.generateCoverLetter({
        resume_id: resumeId.trim(),
        job_description: jobDescription,
      });
      setCoverLetter(data);
      toast.success("Cover letter generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cover Letter" subtitle="Generate cover letters from resume + job description.">
        <Button size="sm" onClick={handleGenerate} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Generate
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2" disabled={!coverLetter}>
          <Copy className="w-4 h-4" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2" disabled={!coverLetter}>
          <Download className="w-4 h-4" /> Download
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <Label>Resume ID (auto-selected)</Label>
            <Input
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="Upload resume first or paste resume id"
              className="mt-1.5"
              disabled={loadingResume}
            />
            {!resumeId && !loadingResume && (
              <p className="mt-2 text-xs text-muted-foreground">No resume uploaded yet. Go to Resume page and upload first.</p>
            )}
          </div>

          <div>
            <Label>Job Description</Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[180px] mt-1.5"
              placeholder="Paste target job description"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Textarea
            value={coverLetter?.generated_text || "Generate a cover letter to see result here."}
            readOnly
            className="min-h-[360px] border-0 p-0 resize-none text-sm leading-relaxed focus-visible:ring-0 bg-transparent text-foreground"
          />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPage;
