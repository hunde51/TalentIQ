import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Compass,
  Globe,
  Linkedin,
  MapPin,
  Search,
  Sparkles,
  Star,
  Twitter,
  Users,
  Zap,
  Github,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Job } from "@/lib/api";

const JobSeekerLandingPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleQuery, setTitleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const data = await api.listPublicJobs({ page: 1, size: 12 });
        setJobs(data.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const q = titleQuery.trim().toLowerCase();
    const l = locationQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchTitle =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q));
      const matchLocation = !l || job.location.toLowerCase().includes(l);
      return matchTitle && matchLocation;
    });
  }, [jobs, titleQuery, locationQuery]);

  const inferJobType = (job: Job) => {
    const text = `${job.title} ${job.description} ${job.location}`.toLowerCase();
    if (text.includes("intern")) return "Internship";
    if (text.includes("part-time") || text.includes("part time")) return "Part-time";
    if (text.includes("remote")) return "Remote";
    return "Full-time";
  };

  const salaryLabel = (job: Job) => {
    const text = `${job.title} ${job.description}`;
    const match = text.match(/\$\s?\d+[\d,]*(?:\s?-\s?\$?\d+[\d,]*)?/);
    return match ? match[0] : "Not disclosed";
  };

  const goToJobSeekerLogin = (message: string) => {
    if (message) toast.info(message);
    navigate("/login");
  };

  const handleBrowseJobs = () => goToJobSeekerLogin("Please login first.");

  const handleApply = () => goToJobSeekerLogin("You must login to apply for this job.");

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#f7fafc,#eef3fb)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Talent Intelligence</p>
            <p className="text-lg font-bold">CareerMatch</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#eef6ff,#f5f8ff_45%,#eef4ff)]">
          <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_10%_10%,#bfdbfe55,transparent),radial-gradient(700px_380px_at_90%_20%,#c7d2fe55,transparent)]" />
          <div className="absolute -left-20 top-40 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />

          <div className="relative mx-auto grid min-h-[86vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Premium Hiring Network
              </p>
              <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
                Find Your Dream Job Faster
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                Discover verified opportunities, apply with confidence, and move your career forward with a modern, trusted platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={handleBrowseJobs}>Browse Jobs</Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-slate-500">Open Jobs</p>
                  <p className="mt-1 text-lg font-semibold">{jobs.length || "500+"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-slate-500">Companies</p>
                  <p className="mt-1 text-lg font-semibold">2,400+</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-slate-500">Success Rate</p>
                  <p className="mt-1 text-lg font-semibold">94%</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <h2 className="text-2xl font-semibold">Smart Job Search</h2>
              <p className="mt-2 text-sm text-slate-600">Search by title or location and discover your next role in seconds.</p>
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    aria-label="Job title"
                    placeholder="Job title or keyword"
                    value={titleQuery}
                    onChange={(e) => setTitleQuery(e.target.value)}
                    className="h-11 rounded-xl border-slate-300 bg-white pl-9 transition-all focus-visible:ring-sky-200"
                  />
                </div>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    aria-label="Location"
                    placeholder="Location"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="h-11 rounded-xl border-slate-300 bg-white pl-9 transition-all focus-visible:ring-sky-200"
                  />
                </div>
                <Button className="h-11 w-full">Search Jobs</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-7xl rounded-3xl border border-slate-200 bg-white/85 px-4 py-8 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8" aria-labelledby="featured-jobs">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 id="featured-jobs" className="text-3xl font-semibold tracking-tight">Featured Jobs</h2>
              <p className="mt-1 text-slate-600">Handpicked opportunities from top verified employers.</p>
            </div>
            <p className="text-sm text-slate-600">{filteredJobs.length} jobs</p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 h-24 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredJobs.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.slice(0, 9).map((job) => (
                <article
                  key={job.id}
                  className="group rounded-2xl border border-slate-200 bg-[linear-gradient(to_bottom,#ffffff,#f8fbff)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{job.title}</h3>
                      <p className="truncate text-sm text-slate-600">{job.recruiter_name || job.recruiter_username || "Verified Company"}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      <Briefcase className="h-3.5 w-3.5" />
                      {inferJobType(job)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {salaryLabel(job)}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{job.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleBrowseJobs}>View Details</Button>
                    <Button size="sm" onClick={handleApply}>Apply Now</Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium text-slate-700">No jobs found.</p>
              <p className="mt-1 text-sm text-slate-500">Try adjusting the search inputs.</p>
            </div>
          )}
        </section>

        <section className="mx-auto mt-20 max-w-7xl rounded-3xl border border-slate-200 bg-white/90 px-4 py-8 shadow-sm sm:px-6 lg:px-8" aria-labelledby="why-choose-us">
          <h2 id="why-choose-us" className="text-3xl font-semibold tracking-tight">Why Choose Us</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-100 to-white p-5 shadow-sm">
              <BadgeCheck className="h-5 w-5 text-sky-700" />
              <h3 className="mt-2 font-semibold">Verified Companies</h3>
              <p className="mt-1 text-sm text-slate-600">All employers are screened before posting.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-indigo-100 to-white p-5 shadow-sm">
              <Sparkles className="h-5 w-5 text-indigo-700" />
              <h3 className="mt-2 font-semibold">AI Job Matching</h3>
              <p className="mt-1 text-sm text-slate-600">Get smarter role recommendations faster.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-cyan-100 to-white p-5 shadow-sm">
              <Zap className="h-5 w-5 text-cyan-700" />
              <h3 className="mt-2 font-semibold">Fast Applications</h3>
              <p className="mt-1 text-sm text-slate-600">Apply in minutes with clear workflows.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-200 to-white p-5 shadow-sm">
              <Compass className="h-5 w-5 text-slate-700" />
              <h3 className="mt-2 font-semibold">Career Growth Support</h3>
              <p className="mt-1 text-sm text-slate-600">Track progress and grow with confidence.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-7xl rounded-3xl border border-slate-200 bg-white/90 px-4 py-8 shadow-sm sm:px-6 lg:px-8" aria-labelledby="testimonials">
          <h2 id="testimonials" className="text-3xl font-semibold tracking-tight">What Candidates Say</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { name: "Sarah Ahmed", role: "Frontend Developer", quote: "I found two interviews within a week. The job quality here is excellent." },
              { name: "Daniel Lee", role: "Marketing Specialist", quote: "The platform feels modern and trustworthy. Applying is smooth and quick." },
              { name: "Maya Singh", role: "Data Analyst", quote: "Great role matching and clear company details helped me choose better opportunities." },
            ].map((item) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
                <div className="mt-4 flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center text-white shadow-lg sm:p-12">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to Start Your Career?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-200">
              Join now and unlock access to premium opportunities from trusted employers.
            </p>
            <div className="mt-6">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" asChild>
                <Link to="/signup">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">CareerMatch</p>
            <p className="mt-1 text-xs text-slate-400">Build your future with verified opportunities.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#" className="hover:text-white">About</a>
            <a href="#" className="hover:text-white">Contact</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="LinkedIn" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>
            <a href="#" aria-label="X" className="hover:text-white"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-white"><Github className="h-4 w-4" /></a>
            <a href="#" aria-label="Global" className="hover:text-white"><Globe className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JobSeekerLandingPage;