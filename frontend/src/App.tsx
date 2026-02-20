import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import UsersPage from "./pages/UsersPage";
import AuditLogPage from "./pages/AuditLogPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  switch (user.role) {
    case "job_seeker": return <JobSeekerDashboard />;
    case "recruiter": return <RecruiterDashboard />;
    case "admin": return <AdminDashboard />;
  }
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobListPage /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
      <Route path="/cover-letter" element={<ProtectedRoute><CoverLetterPage /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
      <Route path="/post-job" element={<ProtectedRoute><JobPostingPage /></ProtectedRoute>} />
      <Route path="/applicants" element={<ProtectedRoute><ApplicantReviewPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
