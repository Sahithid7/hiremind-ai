import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileText,
  GripVertical,
  LayoutGrid,
  Loader2,
  Maximize2,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { rewriteResumeAts } from "../services/aiService";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../components/Button";
import SignupModal from "../components/SignupModal";
import { useAuth } from "../context/AuthContext";
import { ResumeDocumentPreview } from "../components/CareerWorkflow";
import { resumeTemplateSamples } from "../data/careerSamples";
import { usePageTitle } from "../hooks/usePageTitle";
import { analyzeResumeText, textFromResumeForm } from "../utils/careerIntelligence";
import { exportElementAsPdf } from "../utils/exportDocument";
import { buildResumeFromForm, emptyResumeForm, parseExperienceText } from "../utils/resumeExtraction";
import { buildResumeTemplateHtml } from "../utils/resumeTemplateExport";

// ── Preset accent colors (matching Enhancv) ────────────────────────────────
const ACCENT_COLORS = [
  "#2563eb", "#475569", "#059669", "#dc2626", "#1e3a5f",
  "#6d28d9", "#ea580c", "#7c3aed", "#0891b2", "#92400e",
];

// ── Section definitions for Rearrange ─────────────────────────────────────
const ALL_SECTIONS = [
  { key: "summary",      label: "Summary"        },
  { key: "experience",   label: "Experience"     },
  { key: "education",    label: "Education"      },
  { key: "skills",       label: "Skills"         },
  { key: "projects",     label: "Projects"       },
  { key: "certifications", label: "Certifications" },
];

// ── Load draft from localStorage ──────────────────────────────────────────
function loadDraft() {
  try {
    const raw = localStorage.getItem("hiremind_resume_draft");
    if (!raw) return null;
    const d = JSON.parse(raw);
    return {
      ...emptyResumeForm,
      name: d.name ?? d.candidate ?? "",
      title: d.headline ?? d.title ?? "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      location: d.location ?? "",
      linkedin: d.linkedin ?? "",
      website: d.website ?? d.github ?? "",
      summary: d.summary ?? "",
      education: d.education ?? "",
      experience: d.experience ?? "",
      skills: d.skills ?? "",
      projects: d.projects ?? "",
      certifications: d.certifications ?? "",
    };
  } catch { return null; }
}

// ────────────────────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  usePageTitle("Resume Builder");
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showSignupGate, setShowSignupGate] = useState(false);

  const paramTemplate = searchParams.get("template") || localStorage.getItem("hiremind_resume_template") || "faang-minimal";
  const validTemplate = resumeTemplateSamples.find((t) => t.id === paramTemplate) ? paramTemplate : "faang-minimal";

  const [templateId, setTemplateId]   = useState(validTemplate);
  const [form, setForm]               = useState(() => loadDraft() ?? emptyResumeForm);

  // Design & Font state
  const [accentColor, setAccentColor] = useState(() => {
    const tpl = resumeTemplateSamples.find((t) => t.id === validTemplate);
    return tpl?.accent ?? "#2563eb";
  });
  const [fontSize,    setFontSize]    = useState("medium");   // small|medium|large
  const [spacing,     setSpacing]     = useState("normal");   // compact|normal|spacious
  const [fitOnePage,  setFitOnePage]  = useState(false);      // scale to fit single page

  // Rearrange state
  const [sectionOrder, setSectionOrder] = useState(ALL_SECTIONS.map((s) => s.key));
  const [dragIndex, setDragIndex]       = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Panel/modal visibility
  const [showDesign,   setShowDesign]   = useState(false);
  const [showRearrange, setShowRearrange] = useState(false);
  const [showImprove,  setShowImprove]  = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);
  const [previewFormat, setPreviewFormat] = useState("pdf"); // pdf|docx

  // Status message
  const [statusMsg, setStatusMsg] = useState("");

  // AI Rewrite modal
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteJd,        setRewriteJd]        = useState("");
  const [rewriting,        setRewriting]         = useState(false);

  // JD Match suggestions (loaded from sessionStorage when coming from JD Analyzer)
  const [jdSuggestions] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hiremind_jd_suggestions");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  });
  const [appliedBullets, setAppliedBullets] = useState(new Set());
  const [showJdPanel, setShowJdPanel] = useState(true);
  const [structuredProjects, setStructuredProjects] = useState(() => {
    try {
      const schema = JSON.parse(localStorage.getItem("hiremind_resume_schema") || "{}");
      if (Array.isArray(schema.projects) && schema.projects.length > 0) {
        return schema.projects.map((p) => ({
          name:    p.name    || "",
          date:    p.date    || p.technologies || "",
          bullets: Array.isArray(p.bullets) ? p.bullets : [],
        }));
      }
    } catch {}
    return [];
  });

  // Open sections in form
  const [openSections, setOpenSections] = useState({
    summary: true, experience: true, education: false,
    skills: true, projects: false, certifications: false,
  });

  const selectedTemplate = useMemo(
    () => resumeTemplateSamples.find((t) => t.id === templateId) ?? resumeTemplateSamples[0],
    [templateId]
  );

  // Build preview with current design overrides
  const customTemplate = useMemo(
    () => ({ ...selectedTemplate, accent: accentColor }),
    [selectedTemplate, accentColor]
  );

  const previewResume = useMemo(
    () => ({ ...buildResumeFromForm(form, customTemplate), experience: parseExperienceText(form.experience) }),
    [form, customTemplate]
  );

  const analysis = useMemo(
    () => analyzeResumeText(textFromResumeForm(form), selectedTemplate.role),
    [form, selectedTemplate.role]
  );

  // ── Page-fit estimation ────────────────────────────────────────────────────
  // Estimate how many Letter pages the resume content needs at normal size.
  // Returns a number like 1.0 (fits), 1.12 (12% over), 1.5 (too long), etc.
  const pageRatio = useMemo(() => {
    const expBullets  = (form.experience || "").split("\n").filter((l) => /^[•\-*]/.test(l.trim())).length;
    const projBullets = (form.projects   || "").split("\n").filter((l) => /^[•\-*]/.test(l.trim())).length;
    const projCount   = (form.projects   || "").split("\n").filter((l) => l.includes("|")).length;
    const skillCount  = (form.skills     || "").split(/[,\n]/).filter(Boolean).length;
    const expJobs     = (form.experience || "").split("\n").filter((l) => l.includes("|") || (l.match(/\d{4}/) && !l.startsWith("•"))).length;
    const summaryChars = (form.summary || "").length;

    const inches =
      0.9                            // name + title + contact
      + Math.ceil(summaryChars / 110) * 0.22 + 0.55  // summary
      + expJobs * 0.28 + expBullets * 0.165 + 0.55  // experience section
      + 0.55 + 0.4                   // education
      + 0.55 + Math.ceil(skillCount / 7) * 0.22  // skills
      + 0.55 + projCount * 0.32 + projBullets * 0.165; // projects

    return inches / 11;
  }, [form]);

  // ── Smart zoom logic ──────────────────────────────────────────────────────
  // auto-fit: if content is 1–20% over 1 page, quietly compress it to 1 page
  // This prevents "1 line on page 2" situations without the user doing anything.
  const AUTO_FIT_MAX = 1.20;  // auto-fit up to 20% overflow
  const AUTO_FIT_MIN_ZOOM = 0.88; // never auto-compress below 88% (preserves readability)

  const isAutoFitRange = !fitOnePage && pageRatio > 1.001 && pageRatio <= AUTO_FIT_MAX;
  const autoZoom       = isAutoFitRange ? Math.max(AUTO_FIT_MIN_ZOOM, 1 / pageRatio) : 1;

  // explicit Fit 1 page: calculate exact zoom (never below 70%)
  const explicitZoom   = fitOnePage ? Math.max(0.70, Math.min(0.99, 1 / pageRatio)) : 1;

  // Final zoom sent to the template: explicit > auto > 1
  const activeZoom     = fitOnePage ? explicitZoom : autoZoom;

  // Warn when content is too long even for explicit fit
  const fitWarning     = fitOnePage && pageRatio > (1 / 0.70); // > ~1.43 pages

  // Export options (used for both preview and download)
  const exportOpts = useMemo(
    () => ({ accentColor, fontSize, spacing, sectionOrder, fitOnePage, fitZoom: activeZoom }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accentColor, fontSize, spacing, sectionOrder, fitOnePage, activeZoom]
  );

  // Live preview HTML — uses the SAME renderer as export so design changes reflect instantly
  const previewHtml = useMemo(
    () => buildResumeTemplateHtml(previewResume, exportOpts),
    [previewResume, exportOpts]
  );

  // ── Field updates ────────────────────────────────────────────────────────
  function update(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    localStorage.setItem("hiremind_resume_draft", JSON.stringify(next));
  }

  function toggleSection(key) {
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  }

  function serializeProjectsToString(projs) {
    return projs
      .map((p) => {
        const header = [p.name, p.date].filter(Boolean).join(" | ");
        const bullets = (p.bullets || []).map((b) => `• ${b}`).join("\n");
        return bullets ? `${header}\n${bullets}` : header;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function onProjectsChange(updated) {
    setStructuredProjects(updated);
    const next = { ...form, projects: serializeProjectsToString(updated) };
    setForm(next);
    localStorage.setItem("hiremind_resume_draft", JSON.stringify(next));
  }

  function clearDraft() {
    if (!window.confirm("Clear all resume content and start over?")) return;
    localStorage.removeItem("hiremind_resume_draft");
    setForm(emptyResumeForm);
    setStatusMsg("Draft cleared.");
  }

  // ── AI Rewrite handler ────────────────────────────────────────────────────
  async function handleAiRewrite() {
    // Build raw resume text from the current form for the API
    const resumeText = [
      form.name, form.title, form.email, form.phone, form.location, form.linkedin, form.website,
      form.summary && `Professional Summary\n${form.summary}`,
      form.experience && `Experience\n${form.experience}`,
      form.education  && `Education\n${form.education}`,
      form.skills     && `Technical Skills\n${form.skills}`,
      form.projects   && `Projects\n${form.projects}`,
      form.certifications && `Certifications\n${form.certifications}`,
    ].filter(Boolean).join("\n\n");

    if (!resumeText.trim()) {
      setStatusMsg("Nothing to rewrite — please fill in your resume first.");
      setShowRewriteModal(false);
      return;
    }

    setRewriting(true);
    setStatusMsg("");
    try {
      const response = await rewriteResumeAts(resumeText, rewriteJd);
      const r = response.rewritten;
      if (!r) throw new Error("Empty response from API.");

      // ── Map JSON → form fields ────────────────────────────────────────────
      const contact = r.contact ?? {};
      const expLines = (r.experience ?? []).map((job) => {
        const header = `${job.title}${job.company ? ` | ${job.company}` : ""}${job.location ? ` · ${job.location}` : ""} | ${job.duration ?? ""}`;
        const bullets = (job.bullets ?? []).map((b) => `• ${b}`).join("\n");
        return `${header}\n${bullets}`;
      }).join("\n\n");

      const eduLines = (r.education ?? []).map((edu) => {
        const lines = [`${edu.degree ?? ""} — ${edu.institution ?? ""}`, edu.duration ?? ""];
        if (edu.gpa)        lines.push(`GPA: ${edu.gpa}`);
        if ((edu.coursework ?? []).length) lines.push(`Coursework: ${edu.coursework.join(", ")}`);
        return lines.filter(Boolean).join("\n");
      }).join("\n\n");

      const projLines = (r.projects ?? []).map((proj) => {
        const header = `${proj.name ?? ""}${proj.date ? ` | ${proj.date}` : ""}`;
        const bullets = (proj.bullets ?? []).map((b) => `• ${b}`).join("\n");
        return `${header}\n${bullets}`;
      }).join("\n\n");

      const skillsObj = r.skills ?? {};
      const skillParts = [
        skillsObj.languages?.length            && `Programming Languages: ${skillsObj.languages.join(", ")}`,
        skillsObj.software_development?.length && `Software Development: ${skillsObj.software_development.join(", ")}`,
        skillsObj.cloud_devops?.length         && `Cloud & DevOps: ${skillsObj.cloud_devops.join(", ")}`,
        skillsObj.databases?.length            && `Databases: ${skillsObj.databases.join(", ")}`,
        skillsObj.ai_ml?.length                && `AI/ML: ${skillsObj.ai_ml.join(", ")}`,
        skillsObj.tools?.length                && `Tools & Platforms: ${skillsObj.tools.join(", ")}`,
      ].filter(Boolean).join("\n");

      const newForm = {
        name:           contact.name      || form.name,
        title:          form.title,
        email:          contact.email     || form.email,
        phone:          contact.phone     || form.phone,
        location:       contact.location  || form.location,
        linkedin:       contact.linkedin  || form.linkedin,
        website:        contact.github    || form.website,
        summary:        r.summary         || form.summary,
        experience:     expLines          || form.experience,
        education:      eduLines          || form.education,
        skills:         skillParts        || form.skills,
        projects:       projLines         || form.projects,
        certifications: form.certifications,
      };

      setForm(newForm);
      localStorage.setItem("hiremind_resume_draft", JSON.stringify(newForm));
      setOpenSections({ summary: true, experience: true, education: true, skills: true, projects: true });

      // Log backend validation result
      const validation = r._validation ?? null;
      if (validation) {
        if (validation.passed) {
          console.info("[AI Rewrite] All completeness checks passed.", validation.checks);
        } else {
          console.warn("[AI Rewrite] Some completeness checks failed (backend retried):", validation.failed);
        }
      }

      const valMsg = validation?.passed === false
        ? `Resume rewritten (backend retried for completeness). ${validation.failed.length} check${validation.failed.length !== 1 ? "s" : ""} still need review — see the form below.`
        : "Resume rewritten successfully. All sections preserved and ATS-optimized.";
      setStatusMsg(valMsg);
      setShowRewriteModal(false);
      setRewriteJd("");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Rewrite failed.";
      if (msg.includes("API key") || msg.includes("503")) {
        setStatusMsg("OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env and restart the backend.");
      } else {
        setStatusMsg(`Rewrite failed: ${msg}`);
      }
      setShowRewriteModal(false);
    } finally {
      setRewriting(false);
    }
  }

  // ── Export actions ───────────────────────────────────────────────────────
  async function doDownloadPdf() {
    if (!user) { setShowSignupGate(true); return; }
    if (!form.name.trim()) { setStatusMsg("Add your name before downloading."); return; }
    setStatusMsg("Generating PDF…");
    setShowPreview(false);
    const html = buildResumeTemplateHtml(previewResume, exportOpts);
    const result = await exportElementAsPdf(`${form.name} Resume`, html);
    setStatusMsg(result.ok ? "PDF downloaded." : "Print dialog opened.");
  }

  function doDownloadDocx() {
    if (!user) { setShowSignupGate(true); return; }
    if (!form.name.trim()) { setStatusMsg("Add your name before downloading."); return; }
    setShowPreview(false);
    const html = buildResumeTemplateHtml(previewResume, exportOpts);
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name.replace(/\s+/g, "_")}_Resume.doc`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatusMsg("DOCX downloaded.");
  }

  function openPreview(format) {
    setPreviewFormat(format);
    setShowPreview(true);
  }

  // ── Rearrange drag ───────────────────────────────────────────────────────
  function onDragStart(i)     { setDragIndex(i); }
  function onDragEnter(i)     { setDragOverIndex(i); }
  function onDragEnd()        { setDragIndex(null); setDragOverIndex(null); }
  function onDropSection(i)   {
    if (dragIndex === null || dragIndex === i) return;
    const updated = [...sectionOrder];
    const [item] = updated.splice(dragIndex, 1);
    updated.splice(i, 0, item);
    setSectionOrder(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  const scoreColor = analysis.atsScore >= 80 ? "text-[#2C1810]" : analysis.atsScore >= 60 ? "text-amber-500" : "text-red-500";

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1600px]">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-signal">Resume Builder</p>
          <h1 className="text-xl font-bold text-ink">
            {searchParams.get("source") === "expert" ? "Your resume — edit & export" : "Live Resume Builder"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={clearDraft} className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-graphite hover:border-red-200 hover:bg-red-50 hover:text-red-600">
            <RotateCcw size={14} /> Clear
          </button>
          <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
        </div>
      </div>

      {/* ── Enhancv-style toolbar ─────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 mb-5 rounded-2xl border border-line bg-paper/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-center divide-x divide-line">
          <ToolbarBtn icon={<Sparkles size={17} />} label="AI Rewrite"
            onClick={() => setShowRewriteModal(true)} accent />
          <ToolbarBtn icon={<Sparkles size={17} className="opacity-60" />} label="Improve Text" active={showImprove}
            onClick={() => { setShowImprove((p) => !p); setShowDesign(false); }} />
          <ToolbarBtn icon={<LayoutGrid size={17} />} label="Rearrange"
            onClick={() => setShowRearrange(true)} />
          <ToolbarBtn icon={<Palette size={17} />} label="Design & Font" active={showDesign}
            onClick={() => { setShowDesign((p) => !p); setShowImprove(false); }} />
          <div className="flex-1" />
          <ToolbarBtn icon={<FileText size={17} />} label="Download DOCX"
            onClick={() => openPreview("docx")} />
          <ToolbarBtn icon={<Download size={17} />} label="Download PDF"
            onClick={() => openPreview("pdf")} accent />
        </div>
      </div>

      {statusMsg && (
        <div className="mb-4 rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/10 px-4 py-3 text-sm font-bold text-[#2C1810]">
          {statusMsg}
        </div>
      )}

      {/* ── JD Match Suggestions Panel ── */}
      {jdSuggestions && (jdSuggestions.suggestions ?? []).length > 0 && (
        <div className="rounded-2xl border border-signal/25 bg-signal/5 shadow-sm overflow-hidden">
          <button type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            onClick={() => setShowJdPanel((p) => !p)}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white">
                <Sparkles size={17} />
              </span>
              <div>
                <p className="font-bold text-ink">JD Match Suggestions</p>
                <p className="text-xs text-graphite">
                  From your JD analysis{jdSuggestions.role ? ` for ${jdSuggestions.role}` : ""}
                  {jdSuggestions.company ? ` at ${jdSuggestions.company}` : ""} —
                  click "Add" to inject bullets into your experience section
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-signal px-2.5 py-0.5 text-xs font-bold text-white">
                {jdSuggestions.suggestions.length} bullets
              </span>
              {showJdPanel ? <ChevronUp size={16} className="text-graphite" /> : <ChevronDown size={16} className="text-graphite" />}
            </div>
          </button>

          {showJdPanel && (
            <div className="border-t border-signal/15 px-5 pb-5 pt-3 space-y-3">
              <p className="text-xs text-graphite">
                Each suggested bullet naturally incorporates a keyword your resume was missing.
                Click "Add to Resume" to append it to your experience section. Review and edit in the form below.
              </p>
              {jdSuggestions.suggestions.map((s) => {
                const applied = appliedBullets.has(s.keyword);
                return (
                  <div key={s.keyword}
                    className={`rounded-xl border p-4 transition ${applied ? "border-[#D4A853]/30 bg-[#D4A853]/5" : "border-line bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="inline-block rounded-full bg-signal/10 px-2.5 py-0.5 text-xs font-bold text-signal mb-2">
                          Missing keyword: {s.keyword}
                        </span>
                        <p className="text-sm leading-6 text-ink">• {s.suggestedBullet}</p>
                      </div>
                      <button
                        type="button"
                        disabled={applied}
                        onClick={() => {
                          const bullet = `• ${s.suggestedBullet}`;
                          setForm((f) => {
                            const existing = (f.experience || "").trimEnd();
                            const updated  = existing ? `${existing}\n${bullet}` : bullet;
                            const next = { ...f, experience: updated };
                            localStorage.setItem("hiremind_resume_draft", JSON.stringify(next));
                            return next;
                          });
                          setAppliedBullets((prev) => new Set([...prev, s.keyword]));
                          setOpenSections((o) => ({ ...o, experience: true }));
                        }}
                        className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                          applied ? "bg-[#2C1810]/10 text-[#2C1810] cursor-default" : "bg-signal text-white hover:bg-signal/90"
                        }`}>
                        {applied ? "Added" : "Add to Resume"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Missing keywords summary */}
              {(jdSuggestions.missingKeywords ?? []).length > 0 && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-700 mb-2">All missing keywords from the JD</p>
                  <div className="flex flex-wrap gap-2">
                    {jdSuggestions.missingKeywords.map((kw) => (
                      <span key={kw} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-700">{kw}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-amber-600">Add these to your Skills section where your experience genuinely supports them.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main editor + preview ─────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* LEFT: Form */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-signal">Contact Information</p>
            <div className="grid gap-3 md:grid-cols-2">
              <F label="Full Name *" name="name"     value={form.name}     onChange={update} />
              <F label="Title"       name="title"    value={form.title}    onChange={update} />
              <F label="Email"       name="email"    value={form.email}    onChange={update} type="email" />
              <F label="Phone"       name="phone"    value={form.phone}    onChange={update} />
              <F label="Location"    name="location" value={form.location} onChange={update} />
              <F label="LinkedIn"    name="linkedin" value={form.linkedin} onChange={update} />
              <F label="GitHub / Portfolio" name="website" value={form.website} onChange={update} className="md:col-span-2" />
            </div>
          </div>

          {/* Template */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-ink">Template</label>
              <Link to="/app/resume-templates" className="text-xs font-semibold text-signal hover:underline">Browse all →</Link>
            </div>
            <select className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
              value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {resumeTemplateSamples.map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {t.role}</option>
              ))}
            </select>
          </div>

          {/* Content sections */}
          {sectionOrder.map((key) => {
            const meta = { summary: { label: "Professional Summary", rows: 4, hint: "3-4 sentences: role, core skills, top achievement." },
              experience: { label: "Work Experience", rows: 8, hint: "Job Title | Company | Jan 2022 – Present\n• Achievement bullet with metric" },
              education: { label: "Education", rows: 3, hint: "B.S. Computer Science — University | 2022 · GPA: 3.8" },
              skills: { label: "Skills", rows: 3, hint: "Python, FastAPI, React, PostgreSQL, AWS, Docker, CI/CD" },
              projects: { label: "Projects", rows: 5, hint: "Project Name | Tech Stack\n• What it does and the measurable result" },
              certifications: { label: "Certifications & Awards", rows: 3, hint: "AWS Solutions Architect – 2023" },
            }[key];
            if (!meta) return null;
            return (
              <div key={key} className="rounded-2xl border border-line bg-white shadow-sm">
                <button type="button" className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() => toggleSection(key)}>
                  <span className="flex items-center gap-2.5 font-bold text-ink">
                    {form[key]?.trim() ? <CheckCircle2 size={16} style={{ color: "#2C1810" }} /> : <div className="h-4 w-4 rounded-full border-2 border-line" />}
                    {meta.label}
                    {form[key]?.trim() && <span className="rounded-full bg-[#2C1810]/10 px-2 py-0.5 text-xs font-bold text-[#2C1810]">filled</span>}
                  </span>
                  {openSections[key] ? <ChevronUp size={16} className="text-graphite" /> : <ChevronDown size={16} className="text-graphite" />}
                </button>
                {openSections[key] && (
                  <div className="border-t border-line px-5 pb-4 pt-3">
                    {key === "projects" && structuredProjects.length > 0 ? (
                      <ProjectsSection
                        projects={structuredProjects}
                        onChange={onProjectsChange}
                      />
                    ) : (
                      <>
                        <p className="mb-2 whitespace-pre-line text-xs text-graphite opacity-60">{meta.hint}</p>
                        <textarea name={key} value={form[key]} onChange={update} rows={meta.rows}
                          className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-6 text-ink" />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Score + preview + export */}
        <aside className="space-y-4">
          {/* ATS score */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">ATS Score</p>
              <p className={`text-3xl font-extrabold ${scoreColor}`}>
                {analysis.atsScore}<span className="text-sm font-semibold text-graphite">/100</span>
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full transition-all" style={{ background: "linear-gradient(to right, #2C1810, #D4A853)", width: `${analysis.atsScore}%` }} />
            </div>
            <p className="mt-2 text-xs text-graphite">
              Predicted: <strong style={{ color: "#2C1810" }}>{analysis.predictedScore}/100</strong>
              &nbsp;·&nbsp;Missing kw: <strong className="text-amber">{analysis.missingKeywords.length}</strong>
            </p>
          </div>

          {/* Live preview — uses same export HTML so design changes show instantly */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Live Preview</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFitOnePage((p) => !p)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${fitOnePage ? "bg-signal text-white" : "border border-line text-graphite hover:bg-slate-50"}`}
                  title="Shrink all content to fit on one page without cutting anything"
                >
                  <Maximize2 size={13} />
                  Fit 1 page
                  {fitOnePage && (
                    <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px]">
                      {Math.round(explicitZoom * 100)}%
                    </span>
                  )}
                </button>
                <span className="flex h-2 w-2 animate-pulse rounded-full" style={{ background: "#D4A853" }} />
              </div>
            </div>
            {isAutoFitRange && !fitOnePage && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/10 px-3 py-2 text-xs font-semibold text-[#2C1810]">
                <span>✓</span>
                <span>Auto-compressed to 1 page ({Math.round(autoZoom * 100)}% zoom — {Math.round((1 - autoZoom) * 100)}% smaller). All content is included.</span>
              </div>
            )}
            {fitWarning && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>
                  Too much content to fit on 1 page at readable size (~{Math.round(pageRatio * 10) / 10} pages). Remove some bullets or use 2-page export.
                </span>
              </div>
            )}
            <ExportHtmlPreview html={previewHtml} fitOnePage={fitOnePage} fitZoom={activeZoom} />
          </div>

          {/* Export */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-ink">Export Resume</p>
            <div className="space-y-2.5">
              <Button className="w-full" variant="signal" onClick={() => openPreview("pdf")}>
                <Download size={16} />Download PDF
              </Button>
              <Button className="w-full" variant="outline" onClick={() => openPreview("docx")}>
                <FileText size={16} />Download DOCX
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── AI REWRITE MODAL ─────────────────────────────────────────────── */}
      {showRewriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">AI Resume Rewrite</h2>
                <p className="text-sm text-graphite">Powered by GPT — preserves all content, ATS-optimizes every bullet</p>
              </div>
              <button type="button" onClick={() => setShowRewriteModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* What it does */}
              <div className="rounded-xl bg-signal/5 border border-signal/20 p-4">
                <p className="text-sm font-bold text-signal mb-2">What this does:</p>
                <ul className="space-y-1.5 text-sm text-graphite">
                  {[
                    "Rewrites every bullet with strong action verbs + metrics",
                    "Preserves ALL jobs, projects, dates, and company names",
                    "Optimizes keywords for ATS scanning",
                    "Ensures consistent tense and formatting",
                    "Does NOT remove or skip any content",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optional JD */}
              <div>
                <label className="block text-sm font-semibold text-ink">
                  Job Description (optional)
                </label>
                <p className="text-xs text-graphite mb-2">If provided, keywords will be tailored to this specific role.</p>
                <textarea
                  value={rewriteJd}
                  onChange={(e) => setRewriteJd(e.target.value)}
                  rows={4}
                  placeholder="Paste the job description here to tailor the rewrite to this specific role…"
                  className="focus-ring w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                Requires OpenAI API key configured in backend/.env as OPENAI_API_KEY.
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setShowRewriteModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleAiRewrite} disabled={rewriting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-signal py-2.5 text-sm font-bold text-white hover:bg-signal/90 disabled:opacity-50">
                {rewriting
                  ? <><Loader2 size={16} className="animate-spin" /> Rewriting…</>
                  : <><Sparkles size={16} /> Rewrite Resume</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN & FONT PANEL ──────────────────────────────────────────── */}
      {showDesign && (
        <div className="fixed right-0 top-14 bottom-0 z-40 flex w-80 flex-col overflow-y-auto border-l border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-ink">Design &amp; Font</h2>
            <button type="button" onClick={() => setShowDesign(false)} className="rounded-lg p-1.5 text-graphite hover:bg-slate-100"><X size={18} /></button>
          </div>

          <div className="flex-1 space-y-6 px-5 py-5">
            {/* Colors */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite">COLORS</p>
              <div className="grid grid-cols-5 gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setAccentColor(color)}
                    className={`relative h-9 w-9 rounded-full border-2 transition hover:scale-110 ${accentColor === color ? "border-white ring-2 ring-offset-1" : "border-transparent"}`}
                    style={{ background: color, outlineColor: color }}>
                    {accentColor === color && <Check size={14} className="absolute inset-0 m-auto text-white font-bold" />}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                <label className="text-sm font-semibold text-signal cursor-pointer">Use custom color</label>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite">FONT SIZE</p>
              <div className="grid grid-cols-3 gap-2">
                {[["small","Small"], ["medium","Medium"], ["large","Large"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setFontSize(val)}
                    className={`rounded-xl border py-2 text-sm font-semibold transition ${fontSize === val ? "border-signal bg-lilac text-signal" : "border-line text-graphite hover:border-signal/40"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Spacing */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite">SECTION SPACING</p>
              <div className="grid grid-cols-3 gap-2">
                {[["compact","Compact"],["normal","Normal"],["spacious","Spacious"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSpacing(val)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${spacing === val ? "border-signal bg-lilac text-signal" : "border-line text-graphite hover:border-signal/40"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template quick switch */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite">COLUMN LAYOUT</p>
              <div className="grid grid-cols-2 gap-3">
                {resumeTemplateSamples.slice(0, 4).map((t) => (
                  <button key={t.id} type="button" onClick={() => { setTemplateId(t.id); setAccentColor(t.accent); }}
                    className={`rounded-xl border p-2 text-xs font-semibold transition ${templateId === t.id ? "border-signal ring-1 ring-signal/30" : "border-line hover:border-signal/40"}`}>
                    <div className="mb-1 h-12 overflow-hidden rounded-lg bg-slate-50">
                      <ResumeDocumentPreview template={t} mode="card" />
                    </div>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPROVE TEXT PANEL ───────────────────────────────────────────── */}
      {showImprove && (
        <div className="fixed right-0 top-14 bottom-0 z-40 flex w-80 flex-col overflow-y-auto border-l border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-ink">Improve Text</h2>
            <button type="button" onClick={() => setShowImprove(false)} className="rounded-lg p-1.5 text-graphite hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-0 divide-y divide-line px-5">
            {/* Language */}
            <div className="py-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-graphite">Document Language</p>
              <select className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
                <option>Autodetected</option>
                <option>English</option>
              </select>
            </div>
            {/* Tailored Suggestions */}
            <ImproveRow label="Tailored Suggestions" description="Get content suggestions tailored to your target role." free />
            {/* Spellcheck */}
            <ImproveRow label="Spellcheck & Grammar" description="Ensure your writing stays professional and error-free." />
            {/* Wording */}
            <ImproveRow label="Wording & Readability" description="Avoid repetition and improve the overall readability." />
            {/* Recommendations */}
            <ImproveRow label="Recommendations" description="Get actionable suggestions to improve your resume content." />
          </div>
        </div>
      )}

      {/* ── REARRANGE MODAL ──────────────────────────────────────────────── */}
      {showRearrange && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Rearrange Sections</h2>
              <button type="button" onClick={() => setShowRearrange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="px-7 py-6">
              <p className="mb-1 text-sm text-slate-500">Hold &amp; drag the boxes to rearrange the sections</p>
              {/* Header — locked */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3.5 text-center font-semibold text-slate-500">
                🔒 Header (locked)
              </div>
              {/* Draggable sections */}
              <div className="mt-3 space-y-2">
                {sectionOrder.map((key, i) => {
                  const sec = ALL_SECTIONS.find((s) => s.key === key);
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragEnter={() => onDragEnter(i)}
                      onDragEnd={onDragEnd}
                      onDrop={() => onDropSection(i)}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex cursor-grab items-center gap-3 rounded-xl border px-5 py-3.5 font-semibold transition select-none active:cursor-grabbing ${
                        dragOverIndex === i && dragIndex !== i
                          ? "border-purple-400 bg-purple-50"
                          : dragIndex === i
                          ? "border-purple-300 bg-purple-50/50 opacity-60"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <GripVertical size={18} className="text-slate-400" />
                      <span className="flex-1 text-slate-700">{sec?.label ?? key}</span>
                      <div className="flex gap-1">
                        <button type="button" disabled={i === 0}
                          onClick={() => { const o = [...sectionOrder]; [o[i-1], o[i]] = [o[i], o[i-1]]; setSectionOrder(o); }}
                          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ChevronUp size={15} />
                        </button>
                        <button type="button" disabled={i === sectionOrder.length - 1}
                          onClick={() => { const o = [...sectionOrder]; [o[i], o[i+1]] = [o[i+1], o[i]]; setSectionOrder(o); }}
                          className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ChevronDown size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-slate-200 px-7 py-4">
              <button type="button" onClick={() => setShowRearrange(false)}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white hover:opacity-90" style={{ background: "#2C1810" }}>
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW + DOWNLOAD MODAL ─────────────────────────────────────── */}
      {showPreview && (
        <PreviewModal
          resume={previewResume}
          exportOpts={exportOpts}
          format={previewFormat}
          candidateName={form.name}
          onClose={() => setShowPreview(false)}
          onDownloadPdf={doDownloadPdf}
          onDownloadDocx={doDownloadDocx}
        />
      )}

      <SignupModal isOpen={showSignupGate} onClose={() => setShowSignupGate(false)} reason="download" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW MODAL — shows resume before downloading
// ─────────────────────────────────────────────────────────────────────────────
function PreviewModal({ resume, exportOpts, format, candidateName, onClose, onDownloadPdf, onDownloadDocx }) {
  const exportHtml = useMemo(
    () => buildResumeTemplateHtml(resume, exportOpts),
    [resume, exportOpts]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Preview Resume</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {candidateName || "Your resume"} · {resume.id ? `${resume.name} template` : "Selected template"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-slate-200 p-6">
          <div className="mx-auto max-w-[816px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <iframe
              srcDoc={exportHtml}
              className="w-full"
              style={{ height: 1056, border: "none", display: "block" }}
              title="Resume Preview"
            />
          </div>
        </div>

        {/* Footer with download options */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              This is exactly how your resume will look when exported.
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Back to editing
              </button>
              <button type="button" onClick={onDownloadDocx}
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                <FileText size={16} /> Download DOCX
              </button>
              <button type="button" onClick={onDownloadPdf}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white hover:opacity-90" style={{ background: "#2C1810" }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export HTML Live Preview ──────────────────────────────────────────────────
// Uses the same HTML as the download so Design/Rearrange/Font changes show live.
// Scale = containerWidth / 816 (Letter width at 96dpi) — computed via ResizeObserver.
const RESUME_W = 816;  // 8.5in @ 96dpi
const RESUME_H = 1056; // 11in  @ 96dpi

function ExportHtmlPreview({ html, fitOnePage = false, fitZoom = 1 }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.offsetWidth;
      if (w > 0) setScale(w / RESUME_W);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When fitOnePage is on: the HTML already has zoom applied via CSS.
  // The iframe content is therefore zoom*100% of normal size.
  // We show exactly 1 page height in the preview.
  // When off: show 1.65 pages so user can see if content overflows.
  const containerH = fitOnePage
    ? Math.round(RESUME_H * scale)          // exactly 1 page
    : Math.round(RESUME_H * scale * 1.65);  // 1.65 pages = overflow visible

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl bg-white" style={{ height: containerH }}>
      <iframe
        srcDoc={html}
        className="pointer-events-none absolute top-0 left-0"
        style={{
          width:           `${RESUME_W}px`,
          height:          `${Math.round(RESUME_H * 1.65)}px`,
          border:          "none",
          transform:       `scale(${scale})`,
          transformOrigin: "top left",
        }}
        title="Resume Preview"
      />
    </div>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarBtn({ icon, label, onClick, active = false, accent = false }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition first:rounded-l-2xl last:rounded-r-2xl ${
        accent
          ? "text-white hover:opacity-90"
          : active
          ? "bg-[#2C1810]/10 text-[#2C1810]"
          : "text-graphite hover:bg-slate-50 hover:text-ink"
      }`}
      style={accent ? { background: "#2C1810" } : {}}>
      {icon}{label}
    </button>
  );
}

// ── Improve Text row ──────────────────────────────────────────────────────────
function ImproveRow({ label, description, free = false }) {
  const [on, setOn] = useState(free);
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink">{label}</p>
          {!free && <span className="text-slate-400">🔒</span>}
        </div>
        <p className="mt-1 text-sm text-graphite">{description}</p>
      </div>
      <label className="relative mt-0.5 inline-flex cursor-pointer items-center">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="peer sr-only" disabled={!free} />
        <div className={`h-6 w-11 rounded-full transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full `} style={on ? { background: "#2C1810" } : {}} />
      </label>
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────
function F({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" {...props} />
    </label>
  );
}

// ── Projects card editor ──────────────────────────────────────────────────────
function ProjectsSection({ projects, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft,      setDraft]      = useState(null);

  function startEdit(i) {
    setEditingIdx(i);
    setDraft({ ...projects[i], bullets: [...(projects[i].bullets ?? [])] });
  }
  function startAdd() { setEditingIdx("new"); setDraft({ name: "", date: "", bullets: [] }); }
  function cancel()   { setEditingIdx(null);  setDraft(null); }

  function save() {
    if (!draft?.name.trim()) { cancel(); return; }
    const updated = editingIdx === "new"
      ? [...projects, draft]
      : projects.map((p, i) => i === editingIdx ? draft : p);
    onChange(updated);
    cancel();
  }

  function handleBullets(text) {
    setDraft((d) => ({
      ...d,
      bullets: text.split("\n").map((b) => b.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean),
    }));
  }

  const inputCls = "focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink";

  const editForm = draft ? (
    <div className="mb-3 rounded-xl border border-[#D4A853]/60 bg-[#FAF7F2] p-4">
      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Project Name</span>
          <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="AI-Powered Log System" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Date / Tech Stack</span>
          <input value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            placeholder="Python, FastAPI | 2024" className={inputCls} />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Bullet Points (one per line)</span>
        <textarea
          value={(draft.bullets ?? []).join("\n")}
          onChange={(e) => handleBullets(e.target.value)}
          rows={Math.max(3, (draft.bullets ?? []).length + 1)}
          placeholder={"Built REST API handling 10,000+ req/day\nReduced latency by 40% via caching"}
          className={`${inputCls} leading-6`}
        />
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={cancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700">
          Cancel
        </button>
        <button type="button" onClick={save}
          className="rounded-lg px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "#2C1810" }}>
          Save
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <button type="button" onClick={startAdd}
        className="mb-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-[#D4A853]/60 px-4 py-2.5 text-sm font-semibold text-[#2C1810] transition hover:bg-[#FAF7F2]">
        <Plus size={14} /> Add Project
      </button>

      {editingIdx === "new" && editForm}

      <div className="space-y-2">
        {projects.map((proj, i) =>
          editingIdx === i ? (
            <div key={i}>{editForm}</div>
          ) : (
            <div key={i} className="flex items-start justify-between rounded-xl border border-line bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {proj.name || <em className="font-normal not-italic opacity-50">Untitled</em>}
                  {proj.date && <span className="ml-2 font-normal text-sm text-graphite">· {proj.date}</span>}
                </p>
                {(proj.bullets ?? []).slice(0, 2).map((b, bi) => (
                  <p key={bi} className="mt-0.5 text-sm leading-relaxed text-graphite">• {b}</p>
                ))}
                {(proj.bullets ?? []).length > 2 && (
                  <p className="mt-0.5 text-xs text-graphite opacity-60">
                    +{(proj.bullets ?? []).length - 2} more bullets
                  </p>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => startEdit(i)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                  <Edit2 size={14} />
                </button>
                <button type="button" onClick={() => onChange(projects.filter((_, idx) => idx !== i))}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
