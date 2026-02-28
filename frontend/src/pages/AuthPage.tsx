import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";

const AuthPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(identifier, password);
      const me = await api.me();
      if (me.role !== "admin") {
        logout();
        toast.error("Only admins can use this login page.");
        return;
      }
      toast.success("Admin signed in");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-8 border-b border-slate-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Talent Intelligence</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Admin Login</h2>
            <p className="mt-2 text-sm text-slate-600">Restricted access for platform administrators.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="identifier" className="text-xs uppercase tracking-wide text-slate-600">
                Username or Email
              </Label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin username or email"
                  className="h-11 border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-900"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wide text-slate-600">
                Password
              </Label>
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  minLength={8}
                  className="h-11 border-slate-300 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-900"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-sky-600 font-semibold text-white hover:bg-sky-700"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Login as Admin"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">Job Seeker / Recruiter? Use /login</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
