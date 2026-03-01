import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Upload, CheckCircle, Download, Brain, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, type ResumeFeedback, type ResumeParseResult, type ResumeUploadResponse } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";

const ResumeUploadPage = () => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<ResumeUploadResponse | null>(null);
  const [parsed, setParsed] = useState<ResumeParseResult | null>(null);
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [taskPolling, setTaskPolling] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [statusPolling, setStatusPolling] = useState(false);

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const latest = await api.getLatestResume();
        setResume(latest);
        await loadInsightsForResume(latest, true);
      } catch {
        // No uploaded resume yet for this user.
      } finally {
        setLoadingExisting(false);
      }
    };

    void loadExisting();
  }, []);

  const loadInsightsForResume = async (resumeData: ResumeUploadResponse, silent = false) => {
    try {
      const parseData = await api.getParsedResume(resumeData.id);
      setParsed(parseData);
    } catch {
      if (!silent) {
        toast.info("Resume is still processing. Please wait a moment.");
      }
    }

    try {
      const feedbackData = await api.getResumeFeedback(resumeData.id);
      setFeedback(feedbackData);
    } catch {
      // Feedback not ready yet; user can generate manually.
    }
  };

  useEffect(() => {
    if (!resume) return;
    if (parsed) return;

    const processing = ["uploaded", "queued", "processing"].includes((resume.processing_status || "").toLowerCase());
    if (!processing) return;

    setStatusPolling(true);
    const interval = window.setInterval(async () => {
      try {
        const latest = await api.getLatestResume();
        setResume(latest);
        if ((latest.processing_status || "").toLowerCase() === "parsed") {
          window.clearInterval(interval);
          setStatusPolling(false);
          await loadInsightsForResume(latest, true);
        }
      } catch {
        window.clearInterval(interval);
        setStatusPolling(false);
      }
    }, 2500);

    return () => {
      window.clearInterval(interval);
      setStatusPolling(false);
    };
  }, [resume, parsed]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const data = await api.uploadResume(file);
      setResume(data);
      try {
        await api.patchPrivacySettings({ default_resume_id: data.id });
      } catch {
        // Keep upload success even if privacy settings patch fails.
      }
      setParsed(null);
      setFeedback(null);
      toast.success("Resume uploaded and set as default for applications");
      await loadInsightsForResume(data, true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
    e.target.value = "";
  };

  const loadParsedResult = async () => {
    if (!resume) return;
    try {
      const data = await api.getParsedResume(resume.id);
      setParsed(data);
      toast.success("Parsed result loaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Parse result not ready");
    }
  };

  const generateFeedback = async () => {
    if (!resume) return;
    try {
      const data = await api.getResumeFeedback(resume.id);
      setFeedback(data);
      toast.success("Feedback generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Feedback failed");
    }
  };

  const generateFeedbackAsync = async () => {
    if (!resume) return;

    try {
      const task = await api.getResumeFeedbackAsync(resume.id);
      setTaskPolling(true);

      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await api.getTaskStatus(task.task_id);
        const state = String(status.status || status.state || "").toLowerCase();

        if (state === "success") {
          const data = await api.getResumeFeedback(resume.id);
          setFeedback(data);
          toast.success("Async feedback ready");
          setTaskPolling(false);
          return;
        }

        if (state === "failure" || state === "failed") {
          toast.error("Async feedback task failed");
          setTaskPolling(false);
          return;
        }
      }

      toast.error("Task timeout. Check Celery worker/Redis.");
      setTaskPolling(false);
    } catch (error) {
      setTaskPolling(false);
      toast.error(error instanceof Error ? error.message : "Async feedback failed");
    }
  };

  const downloadResume = async () => {
    if (!resume) return;
    try {
      const blob = await api.downloadResumeFile(resume.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resume.original_filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  const resumeScore = useMemo(() => {
    if (!parsed) return null;
    let score = 40;
    score += Math.min(parsed.skills.length * 4, 24);
    score += Math.min(parsed.experience.length * 6, 24);
    score += Math.min(parsed.education.length * 4, 12);
    if (feedback?.overall_feedback) score += 8;
    return Math.min(score, 100);
  }, [parsed, feedback]);

  return (
    <div>
      <PageHeader title="Resume" subtitle="Upload, parse, and generate AI feedback." />

      {loadingExisting && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your latest resume...
        </div>
      )}

      {!resume ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleUpload(file);
          }}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Upload Your Resume</h3>
          <p className="text-sm text-muted-foreground mb-6">PDF or DOCX. Max size is validated by backend.</p>
          <label>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileInput} disabled={uploading} />
            <Button asChild className="gap-2" disabled={uploading}>
              <span>{uploading ? "Uploading..." : "Choose File"}</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{resume.original_filename} uploaded</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
            <p><span className="text-muted-foreground">Resume ID:</span> <span className="font-mono">{resume.id}</span></p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {resume.processing_status}
              {statusPolling && (
                <span className="inline-flex items-center gap-1 ml-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </span>
              )}
            </p>
            <p><span className="text-muted-foreground">File size:</span> {resume.file_size} bytes</p>
            {resumeScore !== null && (
              <p><span className="text-muted-foreground">Resume score:</span> <span className="font-semibold">{resumeScore}/100</span></p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={loadParsedResult}>
                <Brain className="w-4 h-4" /> Load Parsed Result
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={generateFeedback}>
                <MessageSquare className="w-4 h-4" /> Generate Feedback
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={generateFeedbackAsync} disabled={taskPolling}>
                <MessageSquare className="w-4 h-4" /> {taskPolling ? "Polling Task..." : "Generate Async"}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadResume}>
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
          </div>

          {parsed && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Parsed Resume</h3>
              <div>
                <p className="text-sm font-medium mb-1">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Experience</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {parsed.experience.map((item, i) => (
                    <li key={`${item}-${i}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Education</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {parsed.education.map((item, i) => (
                    <li key={`${item}-${i}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {feedback && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground">AI Feedback</h3>
              <div>
                <p className="text-sm font-medium mb-1">Skills</p>
                <Textarea value={feedback.skills_feedback} readOnly className="min-h-[100px]" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Phrasing</p>
                <Textarea value={feedback.phrasing_feedback} readOnly className="min-h-[100px]" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Formatting</p>
                <Textarea value={feedback.formatting_feedback} readOnly className="min-h-[100px]" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Overall</p>
                <Textarea value={feedback.overall_feedback} readOnly className="min-h-[120px]" />
              </div>
            </div>
          )}
        </div>
      )}

      {resume && (
        <p className="text-xs text-muted-foreground mt-4">
          If parsed/feedback data is missing, start Redis + Celery worker and upload again.
        </p>
      )}
    </div>
  );
};

export default ResumeUploadPage;
