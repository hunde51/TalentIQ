import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const JobSeekerAuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(location.pathname === "/signup" ? "signup" : "login");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [role, setRole] = useState<"job_seeker" | "recruiter">("job_seeker");

  useEffect(() => {
    setMode(location.pathname === "/signup" ? "signup" : "login");
  }, [location.pathname]);

  const loginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(identifier, password);
      const me = await api.me();
      if (me.role === "admin") {
        logout();
        toast.error("No account found with these credentials.");
        return;
      }
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const signupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        name,
        username,
        email,
        password,
        age: Number(age),
        sex,
        role,
      });
      const me = await api.me();
      if (me.role === "admin") {
        logout();
        toast.error("Invalid signup role.");
        return;
      }
      if (me.role === "recruiter" && !me.is_active) {
        logout();
        toast.success("Recruiter account created. Waiting for admin approval.");
        navigate("/login");
        return;
      }
      toast.success("Account created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg rounded-xl border border-slate-300 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-8 border-b border-slate-200 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Talent Intelligence</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {mode === "login" ? "Log in" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === "login" ? "Shared login for Job Seekers and Recruiters." : "Choose role and create your account."}
            </p>
          </div>

          {mode === "login" ? (
            <form onSubmit={loginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-xs uppercase tracking-wide text-slate-600">Username or Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username (or email)"
                    className="border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-xs uppercase tracking-wide text-slate-600">Password</Label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="border-slate-300 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-md bg-sky-600 text-white hover:bg-sky-700" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupSubmit} className="space-y-4">
              <div>
                <Label htmlFor="role" className="text-xs uppercase tracking-wide text-slate-600">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "job_seeker" | "recruiter")}
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="job_seeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="text-xs uppercase tracking-wide text-slate-600">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="username" className="text-xs uppercase tracking-wide text-slate-600">Username</Label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs uppercase tracking-wide text-slate-600">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" required />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-slate-600">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wide text-slate-600">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-slate-300 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="age" className="text-xs uppercase tracking-wide text-slate-600">Age</Label>
                  <Input id="age" type="number" min={16} value={age} onChange={(e) => setAge(e.target.value)} className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" required />
                </div>
                <div>
                  <Label htmlFor="sex" className="text-xs uppercase tracking-wide text-slate-600">Sex</Label>
                  <select
                    id="sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-md bg-sky-600 text-white hover:bg-sky-700" disabled={submitting}>
                {submitting ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <div className="mt-6 grid gap-2">
              <Button variant="outline" type="button" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => toast.info("Google login will be available soon")}>
                Continue with Google
              </Button>
              <Button variant="outline" type="button" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => toast.info("LinkedIn login will be available soon")}>
                Continue with LinkedIn
              </Button>
            </div>
          )}

          {mode === "login" ? (
            <p className="mt-5 text-center text-xs text-slate-500">
              Don&apos;t have an account? <Link to="/signup" className="font-semibold text-slate-700 underline">Continue with Sign Up</Link>.
            </p>
          ) : (
            <p className="mt-5 text-center text-xs text-slate-500">
              Already have an account? <Link to="/login" className="font-semibold text-slate-700 underline">Continue with Login</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerAuthPage;
