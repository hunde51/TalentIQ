import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import {
  api,
  tokenStorage,
  type AccountSettings,
  type AiPreferences,
  type NotificationSettings,
  type PrivacySettings,
  type SecuritySettings,
} from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";

const Section = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <section className="bg-card border border-border rounded-xl p-5 space-y-4">
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {children}
  </section>
);

const SettingsPage = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    run: () => Promise<void>;
  } | null>(null);

  const [account, setAccount] = useState<AccountSettings | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [ai, setAi] = useState<AiPreferences | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [sessions, setSessions] = useState<{ id: string; user_agent?: string | null; is_current: boolean }[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const load = async () => {
    try {
      const [a, s, aiPrefs, n, p, sessionData] = await Promise.all([
        api.getAccountSettings(),
        api.getSecuritySettings(),
        api.getAiPreferences(),
        api.getNotificationSettings(),
        api.getPrivacySettings(),
        api.listActiveSessions(tokenStorage.getRefreshToken() || undefined),
      ]);
      setAccount(a);
      setSecurity(s);
      setAi(aiPrefs);
      setNotifications(n);
      setPrivacy(p);
      setSessions(sessionData.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settings");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const askConfirm = (payload: {
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    run: () => Promise<void>;
  }) => {
    setPendingAction(payload);
    setConfirmOpen(true);
  };

  if (!account || !security || !ai || !notifications || !privacy) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage account, security, AI behavior, notifications, and privacy." />

      <Section title="Account Settings" subtitle="Profile and job preference information.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={account.full_name} onChange={(e) => setAccount({ ...account, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={account.phone_number || ""} onChange={(e) => setAccount({ ...account, phone_number: e.target.value })} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={account.location || ""} onChange={(e) => setAccount({ ...account, location: e.target.value })} />
          </div>
          <div>
            <Label>Profile Picture URL</Label>
            <Input value={account.profile_picture_url || ""} onChange={(e) => setAccount({ ...account, profile_picture_url: e.target.value })} />
          </div>
          <div>
            <Label>Professional Title</Label>
            <Input value={account.professional_title || ""} onChange={(e) => setAccount({ ...account, professional_title: e.target.value })} />
          </div>
          <div>
            <Label>Years of Experience</Label>
            <Input
              type="number"
              value={account.years_of_experience ?? ""}
              onChange={(e) => setAccount({ ...account, years_of_experience: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <Label>Preferred Job Type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={account.preferred_job_type || ""}
              onChange={(e) => setAccount({ ...account, preferred_job_type: (e.target.value || null) as AccountSettings["preferred_job_type"] })}
            >
              <option value="">Not set</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <div>
            <Label>Expected Salary Min</Label>
            <Input
              type="number"
              value={account.expected_salary_min ?? ""}
              onChange={(e) => setAccount({ ...account, expected_salary_min: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <Label>Expected Salary Max</Label>
            <Input
              type="number"
              value={account.expected_salary_max ?? ""}
              onChange={(e) => setAccount({ ...account, expected_salary_max: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>
        <Button
          onClick={async () => {
            askConfirm({
              title: "Save Account Settings",
              description: "You are about to update your profile and job preference information.",
              confirmLabel: "Save",
              run: async () => {
                const saved = await api.patchAccountSettings(account);
                setAccount(saved);
                toast.success("Account settings updated");
              },
            });
          }}
        >
          Save Account Settings
        </Button>
      </Section>

      <Section title="Security Settings" subtitle="Password, sessions, and account protection.">
        <div className="flex items-center gap-3">
          <input
            id="twofa"
            type="checkbox"
            checked={security.two_factor_enabled}
            onChange={(e) => setSecurity({ ...security, two_factor_enabled: e.target.checked })}
          />
          <Label htmlFor="twofa">Enable Two-Factor Authentication</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              askConfirm({
                title: "Save Security Settings",
                description: "You are updating security preferences including two-factor authentication.",
                confirmLabel: "Save",
                run: async () => {
                  const saved = await api.patchSecuritySettings({ two_factor_enabled: security.two_factor_enabled });
                  setSecurity(saved);
                  toast.success("Security settings updated");
                },
              });
            }}
          >
            Save Security Settings
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              askConfirm({
                title: "Change Password",
                description: "Your current password will be replaced and existing sessions may be revoked.",
                confirmLabel: "Change Password",
                run: async () => {
                  await api.changePassword({ current_password: currentPassword, new_password: newPassword });
                  setCurrentPassword("");
                  setNewPassword("");
                  toast.success("Password changed");
                },
              });
            }}
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              askConfirm({
                title: "Logout All Devices",
                description: "This will revoke all active sessions across all your devices.",
                confirmLabel: "Logout All",
                run: async () => {
                  await api.logoutAllDevices();
                  toast.success("Logged out from all devices");
                  await load();
                },
              });
            }}
          >
            Logout All Devices
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Active sessions: {sessions.length}
          <ul className="mt-2 space-y-1">
            {sessions.map((s) => (
              <li key={s.id}>{s.is_current ? "Current" : "Device"} - {s.user_agent || "Unknown"}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="AI Preferences" subtitle="Control AI-generated outputs and emphasis.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Resume Tone</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={ai.resume_tone}
              onChange={(e) => setAi({ ...ai, resume_tone: e.target.value as AiPreferences["resume_tone"] })}
            >
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div>
            <Label>AI Feedback Level</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={ai.ai_feedback_level}
              onChange={(e) => setAi({ ...ai, ai_feedback_level: e.target.value as AiPreferences["ai_feedback_level"] })}
            >
              <option value="basic">Basic</option>
              <option value="detailed">Detailed</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Preferred Skill Emphasis (comma separated)</Label>
            <Input
              value={ai.preferred_skill_emphasis.join(", ")}
              onChange={(e) => setAi({ ...ai, preferred_skill_emphasis: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="autocl"
              type="checkbox"
              checked={ai.auto_cover_letter_generation}
              onChange={(e) => setAi({ ...ai, auto_cover_letter_generation: e.target.checked })}
            />
            <Label htmlFor="autocl">Auto cover letter generation</Label>
          </div>
        </div>
        <Button
          onClick={async () => {
            askConfirm({
              title: "Save AI Preferences",
              description: "These preferences will affect future AI-generated outputs.",
              confirmLabel: "Save",
              run: async () => {
                const saved = await api.patchAiPreferences(ai);
                setAi(saved);
                toast.success("AI preferences updated");
              },
            });
          }}
        >
          Save AI Preferences
        </Button>
      </Section>

      <Section title="Notification Settings" subtitle="Choose what updates you receive.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(notifications).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
              />
              {key.replaceAll("_", " ")}
            </label>
          ))}
        </div>
        <Button
          onClick={async () => {
            askConfirm({
              title: "Save Notification Settings",
              description: "You are changing the notifications you receive.",
              confirmLabel: "Save",
              run: async () => {
                const saved = await api.patchNotificationSettings(notifications);
                setNotifications(saved);
                toast.success("Notification settings updated");
              },
            });
          }}
        >
          Save Notification Settings
        </Button>
      </Section>

      <Section title="Resume Privacy & Visibility" subtitle="Control resume access and visibility.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Resume Visibility</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={privacy.resume_visibility}
              onChange={(e) => setPrivacy({ ...privacy, resume_visibility: e.target.value as PrivacySettings["resume_visibility"] })}
            >
              <option value="private">Private</option>
              <option value="recruiters_only">Recruiters Only</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div>
            <Label>Default Resume ID</Label>
            <Input value={privacy.default_resume_id || ""} onChange={(e) => setPrivacy({ ...privacy, default_resume_id: e.target.value || null })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={privacy.allow_resume_download}
              onChange={(e) => setPrivacy({ ...privacy, allow_resume_download: e.target.checked })}
            />
            Allow Resume Download
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={privacy.auto_embedding_refresh}
              onChange={(e) => setPrivacy({ ...privacy, auto_embedding_refresh: e.target.checked })}
            />
            Auto-embedding refresh
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              askConfirm({
                title: "Save Privacy Settings",
                description: "This will update your resume visibility and privacy controls.",
                confirmLabel: "Save",
                run: async () => {
                  const saved = await api.patchPrivacySettings(privacy);
                  setPrivacy(saved);
                  toast.success("Privacy settings updated");
                },
              });
            }}
          >
            Save Privacy Settings
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              askConfirm({
                title: "Delete Account",
                description: "This action deactivates your account. Your data is kept and only admin can reactivate it.",
                confirmLabel: "Delete Account",
                destructive: true,
                run: async () => {
                  await api.deleteAccount();
                  tokenStorage.clear();
                  toast.success("Account deactivated. Contact admin to reactivate.");
                  window.location.href = "/login";
                },
              });
            }}
          >
            Delete Account
          </Button>
        </div>
      </Section>

      <ConfirmActionDialog
        open={confirmOpen}
        title={pendingAction?.title || "Confirm Action"}
        description={pendingAction?.description || "Please confirm this action."}
        confirmLabel={pendingAction?.confirmLabel || "Confirm"}
        destructive={pendingAction?.destructive}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
        onConfirm={async () => {
          if (pendingAction) {
            await pendingAction.run();
          }
        }}
      />
    </div>
  );
};

export default SettingsPage;
