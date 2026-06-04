import { Bell, Download, Lock, Save, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

const defaultSettings = {
  fullName: "HireMind User",
  email: "guest@hiremind.ai",
  targetRole: "Backend Engineer",
  exportFormat: "PDF first",
  fileNameStyle: "Name_Role_Date",
  notifyAnalysis: true,
  notifyExports: true,
  saveLocalDrafts: true,
  allowAiContext: true
};

export default function Profile() {
  usePageTitle("Settings");
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("hiremind_settings") || "null");
    setSettings({
      ...defaultSettings,
      ...local,
      fullName: local?.fullName ?? user?.full_name ?? defaultSettings.fullName,
      email: local?.email ?? user?.email ?? defaultSettings.email,
      targetRole: local?.targetRole ?? user?.target_role ?? defaultSettings.targetRole
    });
  }, [user]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveSettings() {
    localStorage.setItem("hiremind_settings", JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-white via-white to-lilac/60 p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-signal">Settings</p>
        <h1 className="mt-2 text-4xl font-bold text-ink">Personalize your HireMind workspace</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">
          Manage theme, profile details, export defaults, notifications, and privacy controls for your resume and cover letter workflows.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SettingsCard icon={UserCircle} title="Profile info" description="Used to prefill resume and cover letter drafts.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" name="fullName" value={settings.fullName} onChange={updateField} />
            <Field label="Email" name="email" value={settings.email} onChange={updateField} />
            <Field label="Target role" name="targetRole" value={settings.targetRole} onChange={updateField} />
            <Field label="Location" name="location" value={settings.location ?? ""} onChange={updateField} placeholder="City, ST" />
          </div>
        </SettingsCard>

        <SettingsCard icon={Save} title="Theme preference" description="Switch between light and Deep Midnight dark mode.">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-mist p-4">
            <div>
              <p className="font-bold text-ink">Appearance</p>
              <p className="mt-1 text-sm text-graphite">Your choice is persisted locally across sessions.</p>
            </div>
            <ThemeToggle />
          </div>
        </SettingsCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SettingsCard icon={Download} title="Export preferences" description="Set your preferred download defaults.">
          <label className="block">
            <span className="text-sm font-bold text-ink">Preferred format</span>
            <select className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink" name="exportFormat" value={settings.exportFormat} onChange={updateField}>
              {["PDF first", "DOCX first", "Both PDF and DOCX"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-bold text-ink">File name style</span>
            <select className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink" name="fileNameStyle" value={settings.fileNameStyle} onChange={updateField}>
              {["Name_Role_Date", "Role_Company_Name", "HireMind_Name"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Notifications" description="Control local app reminders and status messages.">
          <Toggle label="Resume analysis complete" name="notifyAnalysis" checked={settings.notifyAnalysis} onChange={updateField} />
          <Toggle label="Export ready messages" name="notifyExports" checked={settings.notifyExports} onChange={updateField} />
        </SettingsCard>

        <SettingsCard icon={Lock} title="Privacy controls" description="Choose how local drafts and AI context behave.">
          <Toggle label="Save local drafts on this device" name="saveLocalDrafts" checked={settings.saveLocalDrafts} onChange={updateField} />
          <Toggle label="Use resume context for AI suggestions" name="allowAiContext" checked={settings.allowAiContext} onChange={updateField} />
        </SettingsCard>
      </div>

      <section className="flex flex-col gap-4 rounded-3xl border border-mint/20 bg-gradient-to-r from-mint/12 to-lilac p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Save your workspace settings</h2>
          <p className="mt-1 text-sm leading-6 text-graphite">These settings are stored locally and can later connect to cloud profile preferences.</p>
        </div>
        <Button variant="mint" onClick={saveSettings}><Save size={17} />{saved ? "Saved" : "Save Settings"}</Button>
      </section>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lilac text-signal">
          <Icon size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-graphite">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink" {...props} />
    </label>
  );
}

function Toggle({ label, ...props }) {
  return (
    <label className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-mist p-4 last:mb-0">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--color-mint))]" {...props} />
    </label>
  );
}
