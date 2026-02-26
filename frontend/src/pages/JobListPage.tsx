import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Search, MapPin, Briefcase, Filter, Building2, Sparkles, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, type Job } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const JobListPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set());
  const [uploadingLetterJobs, setUploadingLetterJobs] = useState<Set<string>>(new Set());
  const [uploadedCoverLetters, setUploadedCoverLetters] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const [data, existingApplications] = await Promise.all([
          api.listJobs({ page: 1, size: 50 }),
          user?.role === "job_seeker" ? api.listApplications() : Promise.resolve([]),
        ]);
        setJobs(data.items);
        if (user?.role === "job_seeker") {
          setAppliedJobs(new Set(existingApplications.map((app) => app.job_id)));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user?.role]);

  const filtered = useMemo(
    () =>
      jobs.filter((j) => {
        const q = search.toLowerCase();
        const location = locationFilter.toLowerCase();
        const matchSearch =
          !q ||
          j.title.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q);
        const matchLocation = !location || j.location.toLowerCase().includes(location);
        return matchSearch && matchLocation;
      }),
    [jobs, search, locationFilter],
  );

  const handleApply = async (job: Job) => {
    if (!user) return;
    setApplyingJobs((prev) => new Set(prev).add(job.id));
    try {
      const [privacy, aiPrefs] = await Promise.all([api.getPrivacySettings(), api.getAiPreferences()]);
      if (!privacy.default_resume_id) {
        toast.error("Upload a resume first. We attach it to your application.");
        return;
      }

      let coverLetterId = uploadedCoverLetters[job.id];
      if (!coverLetterId && aiPrefs.auto_cover_letter_generation) {
        try {
          const coverLetter = await api.generateCoverLetter({
            resume_id: privacy.default_resume_id,
            job_description: job.description,
          });
          coverLetterId = coverLetter.id;
        } catch {
          toast.error("Auto cover letter failed. Application will continue without it.");
        }
      }

      await api.createApplication({
        job_id: job.id,
        user_id: user.id,
        resume_id: privacy.default_resume_id,
        cover_letter_id: coverLetterId,
        status: "applied",
      });
      setAppliedJobs((prev) => new Set(prev).add(job.id));
      toast.success(`Applied to ${job.title}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply";
      if (message.toLowerCase().includes("already exists")) {
        setAppliedJobs((prev) => new Set(prev).add(job.id));
        toast.error("You already applied to this job.");
      } else {
        toast.error(message);
      }
    } finally {
      setApplyingJobs((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const handleUploadLetter = async (job: Job, file: File) => {
    if (!user || user.role !== "job_seeker") return;
    setUploadingLetterJobs((prev) => new Set(prev).add(job.id));
    try {
      const privacy = await api.getPrivacySettings();
      if (!privacy.default_resume_id) {
        toast.error("Upload a resume first. We attach it to your application.");
        return;
      }

      const coverLetter = await api.uploadCoverLetter({
        resume_id: privacy.default_resume_id,
        job_description: job.description,
        file,
      });
      setUploadedCoverLetters((prev) => ({ ...prev, [job.id]: coverLetter.id }));
      toast.success("Cover letter uploaded for this job");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cover letter upload failed");
    } finally {
      setUploadingLetterJobs((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  return (
    <div>
      <PageHeader title="Browse Jobs" subtitle="Find opportunities that match your skills." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, skill, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch("");
            setLocationFilter("");
          }}
        >
          Clear
        </Button>
      </div>

      {!loading && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> jobs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <div key={job.id} className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-lg leading-tight">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {job.recruiter_name || job.recruiter_username || "Verified Employer"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                  <Sparkles className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{new Date(job.created_at).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {expandedJobId === job.id ? job.description : `${job.description.slice(0, 160)}${job.description.length > 160 ? "..." : ""}`}
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setExpandedJobId((prev) => (prev === job.id ? null : job.id))}
                >
                  {expandedJobId === job.id ? "Show less" : "View details"}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {job.skills.slice(0, 6).map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{s}</span>
                ))}
                {job.skills.length > 6 && (
                  <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                    +{job.skills.length - 6}
                  </span>
                )}
              </div>
              {user?.role === "job_seeker" && (
                <p className="mt-3 text-xs">
                  {appliedJobs.has(job.id) ? (
                    <span className="text-emerald-600">Application submitted successfully.</span>
                  ) : uploadingLetterJobs.has(job.id) ? (
                    <span className="text-amber-600">Uploading cover letter...</span>
                  ) : uploadedCoverLetters[job.id] ? (
                    <span className="text-emerald-600">Cover letter uploaded.</span>
                  ) : (
                    <span className="text-muted-foreground">Upload a cover letter, then click Apply Now.</span>
                  )}
                </p>
              )}

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Updated {new Date(job.updated_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  {user?.role === "job_seeker" && (
                    <>
                      <input
                        id={`cover-letter-upload-${job.id}`}
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void handleUploadLetter(job, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Button
                        size="sm"
                        variant={uploadedCoverLetters[job.id] ? "secondary" : "outline"}
                        onClick={() => document.getElementById(`cover-letter-upload-${job.id}`)?.click()}
                        disabled={uploadingLetterJobs.has(job.id) || appliedJobs.has(job.id)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {uploadedCoverLetters[job.id]
                          ? "Letter Uploaded"
                          : uploadingLetterJobs.has(job.id)
                            ? "Uploading..."
                            : "Upload Letter"}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedJobId((prev) => (prev === job.id ? null : job.id))}
                    disabled={appliedJobs.has(job.id)}
                  >
                    {expandedJobId === job.id ? "Hide Details" : "View Details"}
                  </Button>
                  {user?.role === "job_seeker" && (
                  <Button
                    size="sm"
                    onClick={() => handleApply(job)}
                    disabled={appliedJobs.has(job.id) || applyingJobs.has(job.id) || uploadingLetterJobs.has(job.id)}
                    variant={appliedJobs.has(job.id) ? "secondary" : "default"}
                  >
                    {appliedJobs.has(job.id) ? "Applied" : applyingJobs.has(job.id) ? "Applying..." : "Apply Now"}
                  </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {loading && <p className="text-muted-foreground">Loading jobs...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No jobs match your filters</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default JobListPage;
