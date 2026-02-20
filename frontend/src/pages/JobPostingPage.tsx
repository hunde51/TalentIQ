import { useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, Send, MapPin, Briefcase } from "lucide-react";

interface JobForm {
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  skills: string;
  description: string;
}

const JobPostingPage = () => {
  const [form, setForm] = useState<JobForm>({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    salary: "",
    skills: "",
    description: "",
  });
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>({});

  const update = (field: keyof JobForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.company.trim()) e.company = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    toast.success("Job posted successfully!");
    setForm({ title: "", company: "", location: "", type: "Full-time", salary: "", skills: "", description: "" });
    setPreview(false);
  };

  return (
    <div>
      <PageHeader title="Post a Job" subtitle="Create a new job listing.">
        <Button variant="outline" onClick={() => { if (validate()) setPreview(!preview); }} className="gap-2">
          <Eye className="w-4 h-4" /> {preview ? "Edit" : "Preview"}
        </Button>
      </PageHeader>

      {preview ? (
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
          <h3 className="text-xl font-bold text-foreground">{form.title}</h3>
          <p className="text-muted-foreground">{form.company}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{form.location}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{form.salary || "Not specified"}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{form.type}</span>
          </div>
          <p className="text-sm text-foreground mt-4 whitespace-pre-line">{form.description}</p>
          {form.skills && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {form.skills.split(",").map((s) => (
                <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{s.trim()}</span>
              ))}
            </div>
          )}
          <Button onClick={handleSubmit} className="mt-6 gap-2">
            <Send className="w-4 h-4" /> Post Job
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Job Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Senior React Developer" className="mt-1.5" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label>Company *</Label>
              <Input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Your Company" className="mt-1.5" />
              {errors.company && <p className="text-xs text-destructive mt-1">{errors.company}</p>}
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="San Francisco, CA" className="mt-1.5" />
              {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
            </div>
            <div>
              <Label>Job Type</Label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Remote</option>
              </select>
            </div>
            <div>
              <Label>Salary Range</Label>
              <Input value={form.salary} onChange={(e) => update("salary", e.target.value)} placeholder="$120K – $160K" className="mt-1.5" />
            </div>
            <div>
              <Label>Required Skills</Label>
              <Input value={form.skills} onChange={(e) => update("skills", e.target.value)} placeholder="React, TypeScript, Node.js" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the role..." className="mt-1.5 min-h-[120px]" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>
          <Button type="submit" className="gap-2">
            <Send className="w-4 h-4" /> Post Job
          </Button>
        </form>
      )}
    </div>
  );
};

export default JobPostingPage;
