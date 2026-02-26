import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import AppLayout from "@/components/AppLayout";
import AuthPage from "./pages/AuthPage";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import JobListPage from "./pages/JobListPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import CoverLetterPage from "./pages/CoverLetterPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import JobPostingPage from "./pages/JobPostingPage";
import ApplicantReviewPage from "./pages/ApplicantReviewPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import UsersPage from "./pages/UsersPage";
import AuditLogPage from "./pages/AuditLogPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import JobSeekerLandingPage from "./pages/JobSeekerLandingPage";
import JobSeekerAuthPage from "./pages/JobSeekerAuthPage";
import RecruiterJobsPage from "./pages/RecruiterJobsPage";

const queryClient = new QueryClient();

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case "job_seeker": return <JobSeekerDashboard />;
    case "recruiter": return <RecruiterDashboard />;
    case "admin": return <Navigate to="/admin/dashboard" />;
  }
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  if (isLoadingAuth) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const { isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;

  return (
    <Routes>
      <Route path="/" element={<JobSeekerLandingPage />} />
      <Route path="/login" element={<JobSeekerAuthPage />} />
      <Route path="/signup" element={<JobSeekerAuthPage />} />
      <Route path="/admin/login" element={<AuthPage />} />
      <Route path="/auth" element={<Navigate to="/admin/login" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobListPage /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
      <Route path="/cover-letter" element={<ProtectedRoute><CoverLetterPage /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
      <Route path="/post-job" element={<ProtectedRoute><JobPostingPage /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute><RecruiterJobsPage /></ProtectedRoute>} />
      <Route path="/applicants" element={<ProtectedRoute><ApplicantReviewPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/users" element={<AdminOnlyRoute><UsersPage /></AdminOnlyRoute>} />
      <Route path="/audit-log" element={<AdminOnlyRoute><AuditLogPage /></AdminOnlyRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="ti-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
