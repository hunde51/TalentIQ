import { useState } from "react";
import { mockJobs } from "@/data/mockData";
import { PageHeader } from "@/components/shared/PageComponents";
import { Search, MapPin, Briefcase, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const JobListPage = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const filtered = mockJobs.filter((j) => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || j.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchLocation;
  });

  const handleApply = (jobId: string, jobTitle: string) => {
    setAppliedJobs((prev) => new Set(prev).add(jobId));
    toast.success(`Applied to ${jobTitle}!`);
  };

  return (
    <div>
      <PageHeader title="Browse Jobs" subtitle="Find opportunities that match your skills." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, skill, or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="relative w-full sm:w-64">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filter by location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((job) => (
          <div key={job.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">{job.type}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.salary}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{job.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{job.postedAt} • {job.applicants} applicants</span>
              <Button
                size="sm"
                onClick={() => handleApply(job.id, job.title)}
                disabled={appliedJobs.has(job.id)}
                variant={appliedJobs.has(job.id) ? "secondary" : "default"}
              >
                {appliedJobs.has(job.id) ? "Applied ✓" : "Apply Now"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
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
