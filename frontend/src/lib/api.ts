export type UserRole = "job_seeker" | "recruiter" | "admin";
export type SignupRole = "job_seeker" | "recruiter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const ACCESS_TOKEN_KEY = "ti_access_token";
const REFRESH_TOKEN_KEY = "ti_refresh_token";

export interface ApiUser {
  id: string;
  username: string;
  name: string;
  sex: string;
  age: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

export interface UserListItem {
  id: string;
  username: string;
  name: string;
  sex: string;
  age: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

export interface UserListResponse {
  page: number;
  size: number;
  total: number;
  items: UserListItem[];
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogListResponse {
  page: number;
  size: number;
  total: number;
  items: AuditLogItem[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  recruiter_name?: string;
  recruiter_username?: string;
  title: string;
  description: string;
  skills: string[];
  location: string;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  page: number;
  size: number;
  total: number;
  items: Job[];
}

export type ApplicationStatus = "applied" | "interview" | "rejected";

export interface Application {
  id: string;
  job_id: string;
  job_title?: string;
  user_id: string;
  applicant_name?: string;
  applicant_username?: string;
  resume_id?: string | null;
  cover_letter_id?: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadResponse {
  id: string;
  original_filename: string;
  file_path: string;
  storage_backend: string;
  content_type: string;
  file_size: number;
  processing_status: string;
  processing_task_id: string | null;
}

export interface ResumeParseResult {
  id: string;
  resume_id: string;
  skills: string[];
  experience: string[];
  education: string[];
  entities: Record<string, unknown>[];
  parser_source: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeFeedback {
  id: string;
  resume_id: string;
  skills_feedback: string;
  phrasing_feedback: string;
  formatting_feedback: string;
  overall_feedback: string;
  generator_source: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeFeedbackTaskResponse {
  task_id: string;
  status: string;
}

export interface CoverLetterResponse {
  id: string;
  user_id: string;
  resume_id: string;
  job_description: string;
  generated_text: string;
  generator_source: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsResponse {
  applications_per_job: { job_id: string; title: string; application_count: number }[];
  popular_skills: { skill: string; count: number }[];
}

export interface JobMatchResponse {
  resume_id: string;
  model_name: string;
  generated_at: string;
  matches: {
    job_id: string;
    title: string;
    location: string;
    skills: string[];
    similarity_score: number;
    rank: number;
  }[];
}

export interface ChatRoomItem {
  application_id: string;
  job_id: string;
  job_title: string;
  applicant_id: string;
  applicant_name?: string;
  applicant_username?: string;
  recruiter_id: string;
  recruiter_name?: string;
  recruiter_username?: string;
}

export interface ChatMessage {
  id: string;
  application_id: string;
  sender_id: string;
  sender_name?: string;
  sender_username?: string;
  content: string;
  created_at: string;
}

export type PreferredJobType = "remote" | "hybrid" | "onsite";
export type ResumeTone = "professional" | "creative" | "technical";
export type AiFeedbackLevel = "basic" | "detailed" | "advanced";
export type ResumeVisibility = "private" | "recruiters_only" | "public";

export interface AccountSettings {
  full_name: string;
  phone_number?: string | null;
  location?: string | null;
  profile_picture_url?: string | null;
  professional_title?: string | null;
  years_of_experience?: number | null;
  preferred_job_type?: PreferredJobType | null;
  expected_salary_min?: number | null;
  expected_salary_max?: number | null;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  active_sessions: number;
  password_changed_at?: string | null;
}

export interface ActiveSessionItem {
  id: string;
  issued_at: string;
  expires_at: string;
  user_agent?: string | null;
  ip_address?: string | null;
  is_current: boolean;
}

export interface AiPreferences {
  resume_tone: ResumeTone;
  auto_cover_letter_generation: boolean;
  ai_feedback_level: AiFeedbackLevel;
  preferred_skill_emphasis: string[];
}

export interface NotificationSettings {
  email_job_matches: boolean;
  application_status_updates: boolean;
  recruiter_messages: boolean;
  weekly_job_digest: boolean;
  marketing_emails: boolean;
}

export interface PrivacySettings {
  resume_visibility: ResumeVisibility;
  allow_resume_download: boolean;
  default_resume_id?: string | null;
  auto_embedding_refresh: boolean;
}

function authHeaders() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function downloadFile(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return response.blob();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return response.json();
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return response.json();
}

export const tokenStorage = {
  save(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  hasAccessToken() {
    return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  },
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

export const api = {
  signup(payload: { username: string; name: string; sex: string; age: number; email: string; password: string; role: SignupRole }) {
    return request<AuthTokens>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(identifier: string, password: string) {
    const normalized = identifier.trim();
    const isEmail = normalized.includes("@");
    return request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(isEmail ? { email: normalized, password } : { username: normalized, password }),
    });
  },
  refresh(refreshToken: string) {
    return request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  me() {
    return request<ApiUser>("/users/me");
  },
  listUsers(params?: { page?: number; size?: number; role?: UserRole; is_active?: boolean; q?: string }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.size) search.set("size", String(params.size));
    if (params?.role) search.set("role", params.role);
    if (params?.is_active !== undefined) search.set("is_active", String(params.is_active));
    if (params?.q) search.set("q", params.q);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<UserListResponse>(`/admin/users${suffix}`);
  },
  updateUser(userId: string, payload: { role?: UserRole; is_active?: boolean }) {
    return request<{ user: UserListItem; message: string }>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  listJobs(params: { page?: number; size?: number; skill?: string; location?: string; q?: string }) {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.size) search.set("size", String(params.size));
    if (params.skill) search.set("skill", params.skill);
    if (params.location) search.set("location", params.location);
    if (params.q) search.set("q", params.q);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<JobListResponse>(`/job/list${suffix}`);
  },
  listPublicJobs(params: { page?: number; size?: number; skill?: string; location?: string; q?: string }) {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.size) search.set("size", String(params.size));
    if (params.skill) search.set("skill", params.skill);
    if (params.location) search.set("location", params.location);
    if (params.q) search.set("q", params.q);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<JobListResponse>(`/job/public-list${suffix}`);
  },
  createJob(payload: { title: string; description: string; skills: string[]; location: string }) {
    return request<Job>("/job/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateJob(jobId: string, payload: { title?: string; description?: string; skills?: string[]; location?: string }) {
    return request<Job>(`/job/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteJob(jobId: string) {
    return request<{ message: string }>(`/job/${jobId}`, {
      method: "DELETE",
    });
  },
  matchJobs(payload: { resume_id: string; top_k?: number }) {
    return request<JobMatchResponse>("/job/match", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createApplication(payload: {
    job_id: string;
    user_id: string;
    resume_id?: string;
    cover_letter_id?: string;
    status?: ApplicationStatus;
  }) {
    return request<Application>("/application/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  listApplications(params?: { status?: ApplicationStatus; job_id?: string; user_id?: string }) {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.job_id) search.set("job_id", params.job_id);
    if (params?.user_id) search.set("user_id", params.user_id);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Application[]>(`/application/list${suffix}`);
  },
  updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    return request<Application>(`/application/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return uploadRequest<ResumeUploadResponse>("/resume/upload", formData);
  },
  getLatestResume() {
    return request<ResumeUploadResponse>("/resume/latest");
  },
  getParsedResume(resumeId: string) {
    return request<ResumeParseResult>(`/resume/${resumeId}/parsed`);
  },
  getResumeFeedback(resumeId: string) {
    return request<ResumeFeedback>("/resume/feedback", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
    });
  },
  getResumeFeedbackAsync(resumeId: string) {
    return request<ResumeFeedbackTaskResponse>("/resume/feedback/async", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
    });
  },
  getTaskStatus(taskId: string) {
    return request<Record<string, unknown>>(`/tasks/${taskId}/status`);
  },
  generateCoverLetter(payload: { resume_id: string; job_description: string }) {
    return request<CoverLetterResponse>("/cover-letter/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  uploadCoverLetter(payload: { resume_id: string; job_description?: string; file: File }) {
    const formData = new FormData();
    formData.append("resume_id", payload.resume_id);
    formData.append("job_description", payload.job_description || "");
    formData.append("file", payload.file);
    return uploadRequest<CoverLetterResponse>("/cover-letter/upload", formData);
  },
  getCoverLetter(coverLetterId: string) {
    return request<CoverLetterResponse>(`/cover-letter/${coverLetterId}`);
  },
  analytics(topSkills = 10) {
    return request<AnalyticsResponse>(`/analytics?top_skills=${topSkills}`);
  },
  listAuditLogs(params?: { page?: number; size?: number; user_id?: string; method?: string; status_code?: number }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.size) search.set("size", String(params.size));
    if (params?.user_id) search.set("user_id", params.user_id);
    if (params?.method) search.set("method", params.method);
    if (params?.status_code !== undefined) search.set("status_code", String(params.status_code));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<AuditLogListResponse>(`/admin/audit-logs${suffix}`);
  },
  listChatRooms() {
    return request<{ items: ChatRoomItem[] }>("/chat/rooms");
  },
  listChatMessages(applicationId: string) {
    return request<ChatMessage[]>(`/chat/${applicationId}/messages`);
  },
  postChatMessage(applicationId: string, content: string) {
    return request<ChatMessage>(`/chat/${applicationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
  searchJobs(q: string, page = 1, size = 10, semantic = false) {
    const params = new URLSearchParams({ q, page: String(page), size: String(size), semantic: String(semantic) });
    return request<{ page: number; size: number; total: number; items: Job[] }>(`/search/jobs?${params.toString()}`);
  },
  downloadResumeFile(resumeId: string) {
    return downloadFile(`/file/resume/${resumeId}/download`);
  },
  downloadCoverLetterFile(coverLetterId: string) {
    return downloadFile(`/file/cover-letter/${coverLetterId}/download`);
  },
  getAccountSettings() {
    return request<AccountSettings>("/settings/account");
  },
  patchAccountSettings(payload: Partial<AccountSettings>) {
    return request<AccountSettings>("/settings/account", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  getSecuritySettings() {
    return request<SecuritySettings>("/settings/security");
  },
  patchSecuritySettings(payload: { two_factor_enabled: boolean }) {
    return request<SecuritySettings>("/settings/security", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload: { current_password: string; new_password: string }) {
    return request<{ message: string }>("/settings/security/change-password", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  listActiveSessions(refreshToken?: string) {
    return request<{ items: ActiveSessionItem[] }>("/settings/security/sessions", {
      headers: refreshToken ? { "X-Refresh-Token": refreshToken } : undefined,
    });
  },
  logoutAllDevices() {
    return request<{ message: string }>("/settings/security/logout-all", { method: "POST" });
  },
  getAiPreferences() {
    return request<AiPreferences>("/settings/ai-preferences");
  },
  patchAiPreferences(payload: Partial<AiPreferences>) {
    return request<AiPreferences>("/settings/ai-preferences", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  getNotificationSettings() {
    return request<NotificationSettings>("/settings/notifications");
  },
  patchNotificationSettings(payload: Partial<NotificationSettings>) {
    return request<NotificationSettings>("/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  getPrivacySettings() {
    return request<PrivacySettings>("/settings/privacy");
  },
  patchPrivacySettings(payload: Partial<PrivacySettings>) {
    return request<PrivacySettings>("/settings/privacy", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteAccount() {
    return request<{ message: string }>("/settings/account", { method: "DELETE" });
  },
};
