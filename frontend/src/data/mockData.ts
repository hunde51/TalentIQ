// Mock data for the entire application

export type UserRole = "job_seeker" | "recruiter" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  skills: string[];
  salary: string;
  postedAt: string;
  description: string;
  applicants: number;
}

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: "applied" | "interview" | "rejected" | "offered";
  appliedAt: string;
  skill: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  appliedAt: string;
  status: "new" | "shortlisted" | "interview" | "rejected";
  matchScore: number;
  skills: string[];
  experience: string;
  aiFeedback: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export const mockCurrentUser: User = {
  id: "u1",
  name: "Alex Johnson",
  email: "alex@example.com",
  role: "job_seeker",
  status: "active",
  joinedAt: "2024-11-01",
};

export const mockResume: ResumeData = {
  name: "Alex Johnson",
  email: "alex@example.com",
  phone: "+1 (555) 123-4567",
  summary:
    "Full-stack developer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, TypeScript, and cloud technologies. Passionate about clean code and user-centric design.",
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "PostgreSQL", "GraphQL", "Docker", "Tailwind CSS", "Next.js"],
  experience: [
    {
      title: "Senior Frontend Engineer",
      company: "TechCorp Inc.",
      duration: "2022 – Present",
      description: "Led frontend architecture for a SaaS platform serving 50K+ users. Reduced page load times by 40%.",
    },
    {
      title: "Full-Stack Developer",
      company: "StartupXYZ",
      duration: "2020 – 2022",
      description: "Built and maintained microservices architecture. Implemented CI/CD pipelines and automated testing.",
    },
    {
      title: "Junior Developer",
      company: "WebAgency",
      duration: "2019 – 2020",
      description: "Developed responsive web applications for enterprise clients using React and Node.js.",
    },
  ],
  education: [
    { degree: "B.S. Computer Science", school: "MIT", year: "2019" },
    { degree: "AWS Solutions Architect", school: "Amazon Web Services", year: "2021" },
  ],
};

export const mockJobs: Job[] = [
  { id: "j1", title: "Senior React Developer", company: "Google", location: "Mountain View, CA", type: "Full-time", skills: ["React", "TypeScript", "GraphQL"], salary: "$150K – $200K", postedAt: "2 days ago", description: "Join our team to build next-generation web applications.", applicants: 45 },
  { id: "j2", title: "Full-Stack Engineer", company: "Stripe", location: "San Francisco, CA", type: "Remote", skills: ["Node.js", "React", "PostgreSQL"], salary: "$140K – $180K", postedAt: "5 days ago", description: "Build payment infrastructure used by millions.", applicants: 78 },
  { id: "j3", title: "Frontend Architect", company: "Netflix", location: "Los Gatos, CA", type: "Full-time", skills: ["React", "TypeScript", "AWS"], salary: "$170K – $220K", postedAt: "1 week ago", description: "Design scalable frontend systems for streaming.", applicants: 32 },
  { id: "j4", title: "Python Backend Engineer", company: "OpenAI", location: "San Francisco, CA", type: "Full-time", skills: ["Python", "Docker", "AWS"], salary: "$160K – $210K", postedAt: "3 days ago", description: "Work on cutting-edge AI infrastructure.", applicants: 120 },
  { id: "j5", title: "DevOps Engineer", company: "Spotify", location: "New York, NY", type: "Remote", skills: ["Docker", "AWS", "Node.js"], salary: "$130K – $170K", postedAt: "1 day ago", description: "Scale infrastructure for 500M+ users.", applicants: 56 },
  { id: "j6", title: "UI/UX Developer", company: "Figma", location: "San Francisco, CA", type: "Full-time", skills: ["React", "Tailwind CSS", "TypeScript"], salary: "$120K – $160K", postedAt: "4 days ago", description: "Create beautiful design tool interfaces.", applicants: 38 },
];

export const mockApplications: Application[] = [
  { id: "a1", jobTitle: "Senior React Developer", company: "Google", status: "interview", appliedAt: "2025-01-15", skill: "React" },
  { id: "a2", jobTitle: "Full-Stack Engineer", company: "Stripe", status: "applied", appliedAt: "2025-01-20", skill: "Node.js" },
  { id: "a3", jobTitle: "Frontend Architect", company: "Netflix", status: "offered", appliedAt: "2025-01-10", skill: "React" },
  { id: "a4", jobTitle: "Python Backend Engineer", company: "OpenAI", status: "rejected", appliedAt: "2025-01-05", skill: "Python" },
  { id: "a5", jobTitle: "DevOps Engineer", company: "Spotify", status: "applied", appliedAt: "2025-01-22", skill: "Docker" },
  { id: "a6", jobTitle: "UI/UX Developer", company: "Figma", status: "interview", appliedAt: "2025-01-18", skill: "React" },
];

export const mockApplicants: Applicant[] = [
  { id: "ap1", name: "Sarah Chen", email: "sarah@example.com", appliedAt: "2025-01-20", status: "new", matchScore: 94, skills: ["React", "TypeScript", "Node.js"], experience: "5 years", aiFeedback: "Excellent match. Strong React expertise with relevant project experience." },
  { id: "ap2", name: "James Wilson", email: "james@example.com", appliedAt: "2025-01-19", status: "shortlisted", matchScore: 87, skills: ["React", "Python", "AWS"], experience: "3 years", aiFeedback: "Good technical skills. Could benefit from more TypeScript experience." },
  { id: "ap3", name: "Maria Garcia", email: "maria@example.com", appliedAt: "2025-01-18", status: "interview", matchScore: 91, skills: ["TypeScript", "GraphQL", "Docker"], experience: "7 years", aiFeedback: "Strong candidate with extensive full-stack experience." },
  { id: "ap4", name: "David Kim", email: "david@example.com", appliedAt: "2025-01-17", status: "rejected", matchScore: 62, skills: ["Python", "Django"], experience: "2 years", aiFeedback: "Limited frontend experience. Better suited for backend roles." },
  { id: "ap5", name: "Emma Thompson", email: "emma@example.com", appliedAt: "2025-01-16", status: "new", matchScore: 88, skills: ["React", "Next.js", "Tailwind CSS"], experience: "4 years", aiFeedback: "Great UI/UX sensibility with solid React fundamentals." },
];

export const mockUsers: User[] = [
  { id: "u1", name: "Alex Johnson", email: "alex@example.com", role: "job_seeker", status: "active", joinedAt: "2024-11-01" },
  { id: "u2", name: "Sarah Chen", email: "sarah@example.com", role: "job_seeker", status: "active", joinedAt: "2024-10-15" },
  { id: "u3", name: "James Wilson", email: "james@example.com", role: "recruiter", status: "active", joinedAt: "2024-09-20" },
  { id: "u4", name: "Maria Garcia", email: "maria@example.com", role: "recruiter", status: "inactive", joinedAt: "2024-08-05" },
  { id: "u5", name: "David Kim", email: "david@example.com", role: "admin", status: "active", joinedAt: "2024-07-01" },
  { id: "u6", name: "Emma Thompson", email: "emma@example.com", role: "job_seeker", status: "active", joinedAt: "2024-12-01" },
  { id: "u7", name: "Liam Brown", email: "liam@example.com", role: "job_seeker", status: "inactive", joinedAt: "2024-06-10" },
  { id: "u8", name: "Olivia Davis", email: "olivia@example.com", role: "recruiter", status: "active", joinedAt: "2024-11-20" },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "al1", user: "Alex Johnson", action: "Uploaded resume", target: "resume_v3.pdf", timestamp: "2025-01-22 14:30" },
  { id: "al2", user: "Sarah Chen", action: "Applied to job", target: "Senior React Developer @ Google", timestamp: "2025-01-22 13:15" },
  { id: "al3", user: "James Wilson", action: "Posted job", target: "Full-Stack Engineer", timestamp: "2025-01-22 11:00" },
  { id: "al4", user: "Maria Garcia", action: "Shortlisted applicant", target: "Emma Thompson", timestamp: "2025-01-21 16:45" },
  { id: "al5", user: "David Kim", action: "Deactivated user", target: "Liam Brown", timestamp: "2025-01-21 10:20" },
  { id: "al6", user: "Alex Johnson", action: "Generated cover letter", target: "Netflix application", timestamp: "2025-01-20 09:30" },
  { id: "al7", user: "Emma Thompson", action: "Applied to job", target: "UI/UX Developer @ Figma", timestamp: "2025-01-20 08:15" },
  { id: "al8", user: "James Wilson", action: "Rejected applicant", target: "David Kim", timestamp: "2025-01-19 15:00" },
];

export const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the Senior React Developer position at Google. With over 5 years of experience in full-stack web development and a deep expertise in React, TypeScript, and modern frontend architecture, I am confident I would be a valuable addition to your team.

In my current role as Senior Frontend Engineer at TechCorp Inc., I have led the frontend architecture for a SaaS platform serving over 50,000 users, achieving a 40% reduction in page load times through performance optimization and modern build tooling. My experience with GraphQL, state management, and component-driven development aligns perfectly with the requirements of this position.

I am particularly excited about the opportunity to work on next-generation web applications at Google, where I can leverage my skills in building scalable, performant, and accessible user interfaces. My background in both frontend and backend development enables me to collaborate effectively across teams and deliver end-to-end solutions.

I would welcome the opportunity to discuss how my experience and passion for web development can contribute to your team's success.

Best regards,
Alex Johnson`;

export const skillDemandData = [
  { skill: "React", demand: 340, growth: 12 },
  { skill: "TypeScript", demand: 290, growth: 18 },
  { skill: "Python", demand: 310, growth: 15 },
  { skill: "Node.js", demand: 250, growth: 8 },
  { skill: "AWS", demand: 220, growth: 22 },
  { skill: "Docker", demand: 180, growth: 14 },
];

export const applicationsBySkill = [
  { skill: "React", count: 3 },
  { skill: "Node.js", count: 1 },
  { skill: "Python", count: 1 },
  { skill: "Docker", count: 1 },
];

export const trendingJobsData = [
  { month: "Sep", jobs: 120 },
  { month: "Oct", jobs: 145 },
  { month: "Nov", jobs: 160 },
  { month: "Dec", jobs: 135 },
  { month: "Jan", jobs: 190 },
  { month: "Feb", jobs: 210 },
];
