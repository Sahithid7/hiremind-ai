import { AlertCircle, BarChart3, BriefcaseBusiness, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "../components/Button";
import { CTASection, SectionCard, SparkleLabel } from "../components/PremiumUI";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplication
} from "../services/applicationService";
import { getApiErrorMessage } from "../utils/apiError";

const statuses = ["Applied", "OA", "Interview", "Offer", "Rejected"];
const statusLabels = { OA: "Online Assessment" };
const starterJobs = [
  { id: "1", company: "Stripe", role: "Backend Engineer Intern", link: "https://stripe.com/jobs", status: "Applied", notes: "Tailor API bullets.", dateApplied: "2026-05-12", interviewDate: "" },
  { id: "2", company: "Datadog", role: "Software Engineer", link: "https://datadoghq.com/careers", status: "OA", notes: "Review monitoring concepts.", dateApplied: "2026-05-15", interviewDate: "" },
  { id: "3", company: "Capital One", role: "Cloud Engineer", link: "https://capitalone.com/careers", status: "Interview", notes: "Prepare AWS STAR stories.", dateApplied: "2026-05-18", interviewDate: "2026-05-29" }
];

const emptyForm = { company: "", role: "", link: "", status: "Applied", notes: "", dateApplied: "", interviewDate: "" };

export default function ApplicationTracker() {
  usePageTitle("Applications");
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem("hiremind_applications");
    return saved ? JSON.parse(saved) : starterJobs;
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("hiremind_applications", JSON.stringify(jobs));
    }
  }, [isAuthenticated, jobs]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;
    setIsSyncing(true);
    fetchApplications()
      .then((data) => {
        if (!ignore) {
          setJobs(data.map(fromApiApplication));
          setSyncMessage("");
        }
      })
      .catch((error) => {
        if (!ignore) setSyncMessage(getApiErrorMessage(error, "Unable to load saved applications. Using local tracker for now."));
      })
      .finally(() => {
        if (!ignore) setIsSyncing(false);
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const analytics = useMemo(
    () => statuses.map((status) => ({ status, count: jobs.filter((job) => job.status === status).length })),
    [jobs]
  );

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveJob(event) {
    event.preventDefault();
    if (!form.company || !form.role) return;
    setIsSyncing(true);

    try {
      if (isAuthenticated) {
        if (editingId) {
          const saved = await updateApplication(editingId, toApiApplication(form));
          setJobs((current) => current.map((job) => (job.id === editingId ? fromApiApplication(saved) : job)));
        } else {
          const saved = await createApplication(toApiApplication(form));
          setJobs((current) => [fromApiApplication(saved), ...current]);
        }
        setSyncMessage("");
      } else if (editingId) {
        setJobs((current) => current.map((job) => (job.id === editingId ? { ...form, id: editingId } : job)));
        setSyncMessage("Guest mode: saved in this browser. Sign in to save to the backend.");
      } else {
        setJobs((current) => [{ ...form, id: crypto.randomUUID() }, ...current]);
        setSyncMessage("Guest mode: saved in this browser. Sign in to save to the backend.");
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setSyncMessage(getApiErrorMessage(error, "Unable to save application."));
    } finally {
      setIsSyncing(false);
    }
  }

  function editJob(job) {
    setForm({ company: job.company, role: job.role, link: job.link, status: job.status, notes: job.notes, dateApplied: job.dateApplied, interviewDate: job.interviewDate });
    setEditingId(job.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function deleteJob(id) {
    setIsSyncing(true);
    try {
      if (isAuthenticated) {
        await deleteApplication(id);
      }
      setJobs((current) => current.filter((job) => job.id !== id));
      setSyncMessage(isAuthenticated ? "" : "Guest mode: deleted from this browser.");
    } catch (error) {
      setSyncMessage(getApiErrorMessage(error, "Unable to delete application."));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="rounded-3xl border border-line bg-gradient-to-br from-white via-white to-lilac/70 p-6 shadow-sm md:p-8">
        <SparkleLabel>Pipeline</SparkleLabel>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Application tracker</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">
          Add applications, update statuses, store notes, dates, interview timing, and see dashboard analytics.
        </p>
      </div>
      {syncMessage && (
        <div className="mb-5 flex gap-3 rounded-lg border border-line bg-glass/70 p-4 text-sm font-semibold text-graphite">
          <AlertCircle size={19} className="shrink-0 text-signal" aria-hidden="true" />
          {syncMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        {analytics.map(({ status, count }, index) => (
          <div key={status} className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-graphite">{statusLabels[status] ?? status}</p>
              <BarChart3 size={16} className={index === 3 ? "text-mint" : "text-signal"} aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-ink">{count}</p>
          </div>
        ))}
      </div>

      <form ref={formRef} className="grid gap-4 rounded-2xl border border-line bg-white/90 p-5 shadow-sm lg:grid-cols-6" onSubmit={saveJob}>
        <Field label="Company" name="company" value={form.company} onChange={updateField} />
        <Field label="Role" name="role" value={form.role} onChange={updateField} />
        <Field label="Link" name="link" value={form.link} onChange={updateField} />
        <label>
          <span className="text-sm font-semibold text-ink">Status</span>
          <select className="focus-ring mt-2 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm text-ink" name="status" value={form.status} onChange={updateField}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <Field label="Date applied" name="dateApplied" type="date" value={form.dateApplied} onChange={updateField} />
        <Field label="Interview date" name="interviewDate" type="date" value={form.interviewDate} onChange={updateField} />
        <label className="lg:col-span-5">
          <span className="text-sm font-semibold text-ink">Notes</span>
          <input className="focus-ring mt-2 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm text-ink" name="notes" value={form.notes} onChange={updateField} placeholder="Follow-up, interview round, prep notes..." />
        </label>
        <Button type="submit" variant="signal" className="self-end" disabled={isSyncing}>
          {isSyncing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
          {editingId ? "Update" : "Add job"}
        </Button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-line bg-white/90 shadow-sm">
        <div className="hidden grid-cols-[0.9fr_1fr_0.6fr_0.8fr_0.8fr_0.5fr] border-b border-line bg-glass/60 px-5 py-3 text-sm font-semibold text-graphite lg:grid">
          <span>Company</span>
          <span>Role</span>
          <span>Status</span>
          <span>Date applied</span>
          <span>Interview</span>
          <span>Actions</span>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <BriefcaseBusiness className="mx-auto text-signal" size={34} aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-ink">No applications yet</p>
            <p className="mt-2 text-sm text-graphite">Add your first company above to start tracking the pipeline.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <article key={job.id} className="grid gap-4 border-b border-line px-5 py-4 last:border-b-0 lg:grid-cols-[0.9fr_1fr_0.6fr_0.8fr_0.8fr_0.5fr] lg:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lilac text-signal">
                  <BriefcaseBusiness size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{job.company}</p>
                  {job.link && <a className="text-xs font-semibold text-signal" href={job.link} target="_blank" rel="noreferrer">Job link</a>}
                </div>
              </div>
              <span className="text-sm text-graphite">{job.role}</span>
            <span className="w-fit rounded-full bg-lilac px-3 py-1 text-xs font-semibold text-signal">{statusLabels[job.status] ?? job.status}</span>
              <span className="text-sm text-graphite">{job.dateApplied || "Not set"}</span>
              <span className="text-sm text-graphite">{job.interviewDate || "Not scheduled"}</span>
              <div className="flex gap-2">
                <button className="focus-ring rounded-lg border border-line p-2 text-graphite hover:text-ink" type="button" onClick={() => editJob(job)} aria-label={`Edit ${job.company}`}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button className="focus-ring rounded-lg border border-line p-2 text-coral hover:bg-coral/10" type="button" onClick={() => deleteJob(job.id)} aria-label={`Delete ${job.company}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
              {job.notes && <p className="text-sm leading-6 text-graphite lg:col-span-6">{job.notes}</p>}
            </article>
          ))
        )}
      </section>
      <section className="grid gap-4 lg:grid-cols-5">
        {statuses.map((status) => (
          <SectionCard key={status}>
            <p className="text-sm font-semibold text-ink">{statusLabels[status] ?? status}</p>
            <div className="mt-4 space-y-3">
              {jobs.filter((job) => job.status === status).slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-xl border border-line bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-ink">{job.company}</p>
                  <p className="mt-1 text-xs text-graphite">{job.role}</p>
                </div>
              ))}
              {jobs.filter((job) => job.status === status).length === 0 && <p className="text-sm text-graphite">No applications</p>}
            </div>
          </SectionCard>
        ))}
      </section>
      <CTASection
        title="Keep every opportunity organized."
        description="Track the job link, status, notes, and interview dates so nothing gets lost during your search."
        action={<Button variant="mint" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>Add Application</Button>}
      />
    </div>
  );
}

function fromApiApplication(application) {
  return {
    id: String(application.id),
    company: application.company,
    role: application.role_title,
    link: application.job_url ?? "",
    status: application.status,
    notes: application.notes ?? "",
    dateApplied: application.applied_on ?? "",
    interviewDate: application.next_step_date ?? ""
  };
}

function toApiApplication(job) {
  return {
    company: job.company,
    role_title: job.role,
    job_url: job.link || null,
    status: job.status,
    applied_on: job.dateApplied || null,
    next_step_date: job.interviewDate || null,
    notes: job.notes || null
  };
}

function Field({ label, ...props }) {
  return (
    <label>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input className="focus-ring mt-2 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm text-ink" {...props} />
    </label>
  );
}
