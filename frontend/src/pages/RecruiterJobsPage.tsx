import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type Job } from "@/lib/api";
import { toast } from "sonner";

type JobEditForm = {
  title: string;
  location: string;
  skills: string;
  description: string;
};

const RecruiterJobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobEditForm>({ title: "", location: "", skills: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deletingJobIds, setDeletingJobIds] = useState<Set<string>>(new Set());
  const [pendingDeleteJob, setPendingDeleteJob] = useState<Job | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.listJobs({ page: 1, size: 100 });
        setJobs(data.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load your jobs");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const startEdit = (job: Job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      location: job.location,
      skills: job.skills.join(", "),
      description: job.description,
    });
  };

  const saveEdit = async () => {
    if (!editingJobId) return;

    const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim() || !form.location.trim() || !form.description.trim() || skills.length === 0) {
      toast.error("title, location, description, and at least one skill are required");
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateJob(editingJobId, {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        skills,
      });
      setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
      setEditingJobId(null);
      toast.success("Job updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    setDeletingJobIds((prev) => new Set(prev).add(jobId));
    try {
      await api.deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      if (editingJobId === jobId) {
        setEditingJobId(null);
      }
      toast.success("Job deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete job");
    } finally {
      setDeletingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  return (
    <div>
      <PageHeader title="Job" subtitle="Manage jobs you created." />

      <div className="space-y-4">
        {jobs.map((job) => {
          const isEditing = editingJobId === job.id;
          const isDeleting = deletingJobIds.has(job.id);
          return (
            <div key={job.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
              {!isEditing && (
                <>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(job)} disabled={isDeleting}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingDeleteJob(job)} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label>Skills (comma-separated)</Label>
                    <Input value={form.skills} onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-1.5 min-h-[120px]" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveEdit()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingJobId(null)} disabled={saving}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && <p className="text-muted-foreground">Loading jobs...</p>}
      {!loading && jobs.length === 0 && <p className="text-muted-foreground">No jobs created yet.</p>}

      {pendingDeleteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete Job?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{pendingDeleteJob.title}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPendingDeleteJob(null)}
                disabled={deletingJobIds.has(pendingDeleteJob.id)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteJob(pendingDeleteJob.id);
                  setPendingDeleteJob(null);
                }}
                disabled={deletingJobIds.has(pendingDeleteJob.id)}
              >
                {deletingJobIds.has(pendingDeleteJob.id) ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterJobsPage;
