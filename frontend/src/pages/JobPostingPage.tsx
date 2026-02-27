import { useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { api } from "@/lib/api";

interface JobForm {
  title: string;
  location: string;
  skills: string;
  description: string;
}

const JobPostingPage = () => {
  const [form, setForm] = useState<JobForm>({
    title: "",
    location: "",
    skills: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof JobForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!form.title.trim() || !form.location.trim() || !form.description.trim() || skills.length === 0) {
      toast.error("title, location, description, and at least one skill are required");
      return;
    }

    try {
      setSubmitting(true);
      await api.createJob({
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        skills,
      });
      toast.success("Job posted");
      setForm({ title: "", location: "", skills: "", description: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Post a Job" subtitle="Create a new job listing (recruiter/admin only)." />

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Job Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Location *</Label>
            <Input value={form.location} onChange={(e) => update("location", e.target.value)} className="mt-1.5" />
          </div>

          <div className="md:col-span-2">
            <Label>Required Skills * (comma-separated)</Label>
            <Input
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder="React, TypeScript, PostgreSQL"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label>Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Minimum 20 characters"
            className="mt-1.5 min-h-[140px]"
          />
        </div>

        <Button type="submit" className="gap-2" disabled={submitting}>
          <Send className="w-4 h-4" /> {submitting ? "Posting..." : "Post Job"}
        </Button>
      </form>
    </div>
  );
};

export default JobPostingPage;
