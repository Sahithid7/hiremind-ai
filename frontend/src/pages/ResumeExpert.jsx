import {
  AlertCircle, Check, Edit2, Eye, Loader2,
  Plus, Sparkles, Trash2, UploadCloud, X, CheckCircle2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { RESUME_TEMPLATES, SAMPLE_PERSON, renderResumeHTML } from "../components/ResumeTemplateRenderer";
import SignupModal from "../components/SignupModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  improveSummary   as improveSummaryAi,
  improveBullet    as improveBulletAi,
  getAiReview      as getAiReviewAi,
  rewriteBullets   as rewriteBulletsAi,
} from "../services/aiService";
import { uploadResume } from "../services/resumeService";
import { getApiErrorMessage } from "../utils/apiError";
import { downloadResumePDF } from "../utils/pdfExport";
import {
  emptyResumeSchema,
  extractResumeSchema,
  schemaToForm,
} from "../utils/resumeExtraction";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Reading resume content",
  "Extracting work experience",
  "Identifying skills and education",
  "Analyzing structure",
  "Getting templates ready",
];

const WIZARD_SECTIONS = [
  { key: "heading",        label: "Heading",        step: 1 },
  { key: "education",      label: "Education",       step: 2 },
  { key: "experience",     label: "Experience",      step: 3 },
  { key: "skills",         label: "Skills",          step: 4 },
  { key: "summary",        label: "Summary",         step: 5 },
  { key: "projects",       label: "Projects",        step: 6 },
  { key: "certifications", label: "Certifications",  step: 7 },
  { key: "finalize",       label: "Finalize",        step: 8 },
];

const WIZARD_KEYS = WIZARD_SECTIONS.map((s) => s.key);

const SKILL_CATEGORIES = [
  "Programming Languages",
  "Software Development",
  "Cloud & DevOps",
  "Databases",
  "AI / ML",
  "Tools & Platforms",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function splitName(full = "") {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
}
function joinName(first, last) { return [first, last].filter(Boolean).join(" "); }

function splitLocation(loc = "") {
  const [city = "", ...rest] = loc.split(",").map((s) => s.trim());
  return { city, state: rest.join(", ") };
}
function joinLocation(city, state) { return [city, state].filter(Boolean).join(", "); }

function schemaToRenderPerson(schema) {
  return {
    name:     schema.personal?.name     ?? "",
    title:    schema.personal?.title    ?? "",
    email:    schema.personal?.email    ?? "",
    phone:    schema.personal?.phone    ?? "",
    location: schema.personal?.location ?? "",
    linkedin: schema.personal?.linkedin ?? "",
    website:  schema.personal?.github   ?? "",
    summary:  schema.summary            ?? "",
    experience: (schema.experience ?? []).map((e) => ({
      title:    e.job_title   || "",
      company:  e.company     || "",
      location: e.location    || "",
      start:    e.start_date  || "",
      end:      e.end_date    || "Present",
      bullets:  e.bullets     ?? [],
    })),
    education: (schema.education ?? []).map((e) => ({
      degree:     e.degree          || "",
      school:     e.school          || "",
      duration:   e.graduation_date || "",
      gpa:        e.gpa             || "",
      coursework: typeof e.coursework === "string" ? e.coursework : "",
    })),
    skills:             schema.skills ?? [],
    skills_categorized: schema.skills_categorized ?? {},
    projects:       (schema.projects ?? []).map((p) => ({
      name:    p.name         || "",
      tech:    p.technologies || "",
      bullets: p.bullets      ?? [],
    })),
    certifications: schema.certifications ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text", placeholder = "", isDark, className = "" }) {
  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 focus:border-[#D4A853]/70 focus:ring-[#D4A853]/20"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#D4A853] focus:ring-[#D4A853]/20";
  return (
    <label className={`block ${className}`}>
      <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-1 ${inputCls}`}
      />
    </label>
  );
}

function SectionHeading({ isDark, title, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {subtitle && (
        <p className={`mt-1.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
      )}
    </div>
  );
}

function AddButton({ isDark, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-4 flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-semibold transition ${
        isDark
          ? "border-[#D4A853]/40 text-[#C8A88A] hover:border-[#D4A853]/70 hover:bg-[#D4A853]/10"
          : "border-[#D4A853]/60 text-[#2C1810] hover:border-[#D4A853] hover:bg-[#FAF7F2]"
      }`}
    >
      <Plus size={15} /> {children}
    </button>
  );
}

function CardActions({ isDark, onEdit, onDelete }) {
  return (
    <div className="ml-4 flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className={`rounded-lg p-1.5 transition ${
          isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                 : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <Edit2 size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function SaveCancelButtons({ isDark, onSave, onCancel }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="rounded-lg px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
        style={{ background: "#2C1810" }}
      >
        Save
      </button>
    </div>
  );
}

function EmptyState({ isDark, message }) {
  return (
    <div className={`rounded-xl border-2 border-dashed py-10 text-center ${
      isDark ? "border-slate-700 text-slate-600" : "border-slate-200 text-slate-400"
    }`}>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ResumeExpert() {
  usePageTitle("Build Resume");
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);
  const dropRef      = useRef(null);

  const [stage,             setStage]             = useState("input");
  const [pastedText,        setPastedText]        = useState("");
  const [selectedFile,      setSelectedFile]      = useState(null);
  const [isDragging,        setIsDragging]        = useState(false);
  const [error,             setError]             = useState("");
  const [loadingStep,       setLoadingStep]       = useState(0);
  const [schema,            setSchema]            = useState(null);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [showPreview,       setShowPreview]       = useState(false);

  function onDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }
  function selectFile(file) {
    if (!file.name.match(/\.(pdf|docx)$/i)) { setError("Please upload a PDF or DOCX file."); return; }
    setError(""); setSelectedFile(file);
  }

  async function handleProcess() {
    if (!pastedText.trim() && !selectedFile) {
      setError("Paste your resume text or upload a PDF/DOCX file.");
      return;
    }
    setError(""); setStage("loading"); setLoadingStep(0);

    // Keep cycling through loading steps while gpt-4o processes (can take 30-90s)
    const STEP_MS = 1800;  // slower cycle so animation keeps going for the full wait
    let stepIdx = 0;
    const stepInterval = window.setInterval(() => {
      stepIdx = (stepIdx + 1) % LOADING_STEPS.length;
      setLoadingStep(stepIdx);
    }, STEP_MS);

    try {
      let extracted;
      if (selectedFile) {
        const result = await uploadResume(selectedFile);
        const raw    = result.resume ?? result;
        extracted = extractResumeSchema(raw, selectedFile.name);
      } else {
        extracted = extractResumeSchema({
          parsed_text: pastedText, extracted_skills: [], extracted_experience: [],
          extracted_education: [], extracted_projects: [], certifications: [],
          name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", summary: "",
        }, "");
      }

      window.clearInterval(stepInterval);
      setLoadingStep(LOADING_STEPS.length - 1); // show last step as complete
      await new Promise((r) => window.setTimeout(r, 400));
      setSchema(extracted);
      setStage("heading");
    } catch (err) {
      window.clearInterval(stepInterval);
      const fallback = extractResumeSchema({
        parsed_text: pastedText.trim() || "",
        extracted_skills: [], extracted_experience: [], extracted_education: [],
        extracted_projects: [], certifications: [],
        name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", summary: "",
        diagnostics: { warning: "Backend extraction failed.", error: getApiErrorMessage(err, "") },
      }, selectedFile?.name ?? "");
      await new Promise((r) => window.setTimeout(r, 400));
      setSchema(fallback);
      setStage("heading");
    }
  }

  function handleNext() {
    const curIdx = WIZARD_KEYS.indexOf(stage);
    setCompletedSections((prev) => new Set([...prev, stage]));
    if (curIdx < WIZARD_KEYS.length - 1) {
      setStage(WIZARD_KEYS[curIdx + 1]);
    } else {
      // Finalize → save and go to templates
      const form = schemaToForm(schema);
      localStorage.setItem("hiremind_resume_draft",  JSON.stringify(form));
      localStorage.setItem("hiremind_resume_schema", JSON.stringify(schema));
      setStage("templates");
    }
  }

  function handleBack() {
    const curIdx = WIZARD_KEYS.indexOf(stage);
    setStage(curIdx > 0 ? WIZARD_KEYS[curIdx - 1] : "input");
  }

  function chooseTemplate(id) {
    const form = schemaToForm(schema ?? emptyResumeSchema());
    localStorage.setItem("hiremind_resume_draft",    JSON.stringify(form));
    localStorage.setItem("hiremind_resume_schema",   JSON.stringify(schema ?? emptyResumeSchema()));
    localStorage.setItem("hiremind_resume_template", id);
    navigate(`/app/resume-builder?template=${id}&source=expert`);
  }

  // ── Render stages ────────────────────────────────────────────────────────
  if (stage === "input")    return (
    <InputScreen
      isDark={isDark} pastedText={pastedText} setPastedText={setPastedText}
      selectedFile={selectedFile} isDragging={isDragging} error={error}
      fileInputRef={fileInputRef} dropRef={dropRef}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onFileChange={(e) => selectFile(e.target.files?.[0])}
      onClearFile={() => setSelectedFile(null)}
      onProcess={handleProcess}
    />
  );

  if (stage === "loading") return <LoadingScreen isDark={isDark} activeStep={loadingStep} />;
  if (stage === "templates") return <TemplateScreen isDark={isDark} onChoose={chooseTemplate} />;

  if (WIZARD_KEYS.includes(stage)) {
    const curIdx      = WIZARD_KEYS.indexOf(stage);
    const nextSection = WIZARD_SECTIONS[curIdx + 1];
    const isFinalize  = stage === "finalize";
    const currentSchema = schema ?? emptyResumeSchema();

    return (
      <>
        <div className={`flex h-[calc(100vh-64px)] flex-col ${isDark ? "bg-[#080C15]" : "bg-slate-50"}`}>
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar */}
            <WizardSidebar
              isDark={isDark}
              stage={stage}
              completedSections={completedSections}
              onGoTo={setStage}
            />

            {/* Main content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-12">
              {stage === "heading"        && <HeadingSection        key={currentSchema.personal?.name ?? ""} isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "education"      && <EducationSection      isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "experience"     && <ExperienceSection     isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "skills"         && <SkillsSection         isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "summary"        && <SummarySection        isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "projects"       && <ProjectsSection       isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "certifications" && <CertificationsSection isDark={isDark} schema={currentSchema} onSchema={setSchema} />}
              {stage === "finalize"       && (
                <FinalizeSection
                  isDark={isDark}
                  schema={currentSchema}
                  completedSections={completedSections}
                  onGoTo={setStage}
                  onShowPreview={() => setShowPreview(true)}
                />
              )}
            </div>
          </div>

          {/* Bottom navigation bar */}
          <div className={`flex items-center justify-between border-t px-6 py-4 ${
            isDark ? "bg-[#10141F] border-slate-700/60" : "bg-white border-slate-200"
          }`}>
            <button
              type="button"
              onClick={handleBack}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                isDark
                  ? "border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:border-slate-400"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                <Eye size={15} /> Preview
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#2C1810" }}
              >
                {isFinalize ? "Choose Template →" : `Next: ${nextSection?.label} →`}
              </button>
            </div>
          </div>
        </div>

        {showPreview && (
          <PreviewModal
            isDark={isDark}
            schema={currentSchema}
            onClose={() => setShowPreview(false)}
          />
        )}
      </>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1: Input
// ─────────────────────────────────────────────────────────────────────────────

function InputScreen({ isDark, pastedText, setPastedText, selectedFile, isDragging, error, fileInputRef, dropRef, onDragOver, onDragLeave, onDrop, onFileChange, onClearFile, onProcess }) {
  // Brown/cream palette — dark mode falls back to original dark style
  const bg       = isDark ? "bg-[#080C15]"  : "bg-[#FAF7F2]";
  const cardBg   = isDark ? "bg-[#10141F]"  : "bg-white";
  const cardBdr  = isDark ? "border-[#2C1810]/30" : "border-[#E8DDD4]";
  const textMain = isDark ? "text-white"    : "text-[#1A0F0A]";
  const textSub  = isDark ? "text-slate-400" : "text-[#6B4C3B]";
  const textareaBase = isDark
    ? "bg-[#0d1121] border-slate-600 text-slate-200 placeholder-slate-600 focus:border-[#D4A853]/70 focus:ring-[#D4A853]/30"
    : "bg-white border-[#E8DDD4] text-[#1A0F0A] placeholder-[#A89080] focus:border-[#D4A853] focus:ring-[#D4A853]/20";
  const dropBase = isDragging
    ? "border-[#D4A853] bg-[#D4A853]/10"
    : selectedFile
    ? "border-[#D4A853]/50 bg-[#D4A853]/5"
    : isDark
    ? "border-slate-600 hover:border-slate-500 hover:bg-slate-800/40"
    : "border-[#E8DDD4] hover:border-[#8B4513]/40 hover:bg-[#FAF7F2]";
  const iconBg   = isDark ? "bg-[#2C1810]/60" : "bg-[#2C1810]/10";
  const divider  = isDark ? "bg-slate-700/60" : "bg-[#E8DDD4]";
  const uploadBg = isDark ? "bg-slate-700/70" : "bg-[#FAF7F2]";

  return (
    <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 ${bg}`}>
      <div className="w-full max-w-2xl">
        <div className={`rounded-2xl border p-7 shadow-lg ${cardBdr} ${cardBg}`}
          style={{ boxShadow: isDark ? undefined : "0 4px 24px rgba(44,24,16,0.07)" }}>

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#C8A88A" : "#2C1810"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 className={`text-lg font-bold ${textMain}`}>Your Resume</h1>
              <p className={`text-sm ${textSub}`}>Paste text or upload a PDF / DOCX</p>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume text here... Include your work experience, education, skills, and any other relevant sections."
            className={`w-full resize-none rounded-xl border px-4 py-3.5 text-sm leading-7 outline-none transition focus:ring-1 ${textareaBase}`}
            rows={10}
          />

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className={`h-px flex-1 ${divider}`} />
            <span className={`text-xs font-semibold ${textSub}`}>or</span>
            <div className={`h-px flex-1 ${divider}`} />
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${dropBase}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx" onChange={onFileChange} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 size={20} style={{ color: "#2C1810" }} />
                <span className={`font-semibold ${isDark ? "text-[#C8A88A]" : "text-[#2C1810]"}`}>{selectedFile.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onClearFile(); }}
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${uploadBg}`}>
                  <UploadCloud size={22} style={{ color: isDark ? "#C8A88A" : "#6B4C3B" }} />
                </div>
                <p className={`font-semibold ${textMain}`}>Drag &amp; drop PDF or click to upload</p>
                <p className={`mt-1 text-sm ${textSub}`}>PDF or DOCX files only</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={onProcess}
            disabled={!pastedText.trim() && !selectedFile}
            className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "#2C1810" }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#4A2318")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2C1810")}
          >
            Continue →
          </button>
        </div>
        <p className={`mt-5 text-center text-xs ${isDark ? "text-slate-600" : "text-[#9A8070]"}`}>
          Your data stays private and is never shared with third parties.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2: Loading
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen({ isDark, activeStep }) {
  const bg = isDark ? "bg-[#080C15]" : "bg-slate-50";
  return (
    <div className={`flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 ${bg}`}>
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(44,24,16,0.12)" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "#2C1810" }} />
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-[#1A0F0A]"}`}>
          Analyzing your resume…
        </h2>
        <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-[#6B4C3B]"}`}>
          This only takes a few seconds.
        </p>
      </div>
      <div className="w-full max-w-md space-y-3">
        {LOADING_STEPS.map((step, i) => (
          <div key={step} className={`flex items-center gap-3 rounded-xl px-5 py-3.5 transition-all duration-500 ${
            i < activeStep
              ? isDark ? "bg-[#2C1810]/20 text-[#C8A88A]" : "bg-[#2C1810]/10 text-[#2C1810]"
              : i === activeStep
              ? isDark ? "bg-[#D4A853]/20 text-[#D4A853]" : "bg-[#D4A853]/15 text-[#2C1810]"
              : isDark ? "bg-[#10141F] text-slate-600" : "bg-white text-slate-400"
          }`}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < activeStep ? "text-white"
                : i === activeStep ? "text-[#2C1810]"
                : "bg-slate-200 text-slate-500"
              }`}
              style={i < activeStep ? { background: "#2C1810" } : i === activeStep ? { background: "#D4A853" } : {}}
            >
              {i < activeStep ? "✓" : i + 1}
            </span>
            <span className="text-sm font-semibold">{step}</span>
            {i === activeStep && <Loader2 size={14} className="ml-auto animate-spin" style={{ color: "#2C1810" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function WizardSidebar({ isDark, stage, completedSections, onGoTo }) {
  return (
    <aside className={`w-52 shrink-0 overflow-y-auto py-8 px-3 ${
      isDark ? "bg-[#10141F] border-r border-slate-700/60" : "bg-white border-r border-slate-200"
    }`}>
      <p className={`mb-4 px-3 text-xs font-bold uppercase tracking-widest ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}>
        Resume Sections
      </p>
      <nav className="space-y-0.5">
        {WIZARD_SECTIONS.map((s) => {
          const isActive = stage === s.key;
          const isDone   = completedSections.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onGoTo(s.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition text-left ${
                isActive
                  ? isDark ? "bg-[#2C1810]/40 text-[#C8A88A]" : "bg-[#2C1810]/10 text-[#2C1810]"
                  : isDone
                  ? isDark ? "text-[#D4A853] hover:bg-slate-800" : "text-[#2C1810] hover:bg-[#FAF7F2]"
                  : isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-500 hover:bg-[#FAF7F2] hover:text-[#2C1810]"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isActive ? "text-white"
                  : isDone  ? "text-[#2C1810]"
                  : isDark  ? "bg-slate-700 text-slate-400"
                             : "bg-slate-100 text-slate-500"
                }`}
                style={isActive ? { background: "#2C1810" } : isDone ? { background: "#D4A853" } : {}}
              >
                {isDone && !isActive ? <Check size={11} /> : s.step}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Heading (Contact Info)
// ─────────────────────────────────────────────────────────────────────────────

function HeadingSection({ isDark, schema, onSchema }) {
  const p = schema.personal ?? {};
  const { firstName, lastName } = splitName(p.name);
  const { city, state }         = splitLocation(p.location);

  const [fn, setFn] = useState(firstName);
  const [ln, setLn] = useState(lastName);
  const [ct, setCt] = useState(city);
  const [st, setSt] = useState(state);

  function upPersonal(field, val) {
    onSchema({ ...schema, personal: { ...p, [field]: val } });
  }
  function handleFn(v) { setFn(v); upPersonal("name",     joinName(v, ln)); }
  function handleLn(v) { setLn(v); upPersonal("name",     joinName(fn, v)); }
  function handleCt(v) { setCt(v); upPersonal("location", joinLocation(v, st)); }
  function handleSt(v) { setSt(v); upPersonal("location", joinLocation(ct, v)); }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        isDark={isDark}
        title="Contact Information"
        subtitle="This appears at the top of your resume. Make sure it's accurate."
      />
      <div className="grid grid-cols-2 gap-4">
        <Field isDark={isDark} label="First Name"          value={fn}             onChange={handleFn} />
        <Field isDark={isDark} label="Last Name"           value={ln}             onChange={handleLn} />
        <Field isDark={isDark} label="Email"               value={p.email    ?? ""} onChange={(v) => upPersonal("email",   v)} type="email" />
        <Field isDark={isDark} label="Phone"               value={p.phone    ?? ""} onChange={(v) => upPersonal("phone",   v)} placeholder="(555) 000-0000" />
        <Field isDark={isDark} label="City"                value={ct}             onChange={handleCt} />
        <Field isDark={isDark} label="State / Country"     value={st}             onChange={handleSt} />
        <Field isDark={isDark} label="LinkedIn URL"        value={p.linkedin ?? ""} onChange={(v) => upPersonal("linkedin", v)} placeholder="linkedin.com/in/yourname" />
        <Field isDark={isDark} label="GitHub / Portfolio"  value={p.github   ?? ""} onChange={(v) => upPersonal("github",  v)} placeholder="github.com/yourname" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Education
// ─────────────────────────────────────────────────────────────────────────────

function EducationSection({ isDark, schema, onSchema }) {
  const education = schema.education ?? [];
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft,      setDraft]      = useState(null);

  const cardBg     = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";
  const editCardBg = isDark ? "bg-[#1A0A04] border-[#D4A853]/40" : "bg-[#FAF7F2] border-[#D4A853]/60";

  function startAdd()   { setEditingIdx("new"); setDraft({ school: "", degree: "", gpa: "", graduation_date: "", coursework: "" }); }
  function startEdit(i) { setEditingIdx(i);     setDraft({ ...education[i] }); }
  function cancel()     { setEditingIdx(null);  setDraft(null); }

  function save() {
    const c = { ...draft, school: (draft.school ?? "").trim(), degree: (draft.degree ?? "").trim() };
    if (!c.school && !c.degree) { cancel(); return; }
    const updated = editingIdx === "new"
      ? [...education, c]
      : education.map((e, i) => i === editingIdx ? c : e);
    onSchema({ ...schema, education: updated });
    cancel();
  }

  function del(i) { onSchema({ ...schema, education: education.filter((_, idx) => idx !== i) }); }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading isDark={isDark} title="Education" subtitle="Add your degrees, schools, and graduation dates." />
      <AddButton isDark={isDark} onClick={startAdd}>Add Education</AddButton>

      {editingIdx === "new" && (
        <div className={`mb-3 rounded-xl border p-5 ${editCardBg}`}>
          <EduForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        </div>
      )}

      <div className="space-y-3">
        {education.map((edu, i) =>
          editingIdx === i ? (
            <div key={i} className={`rounded-xl border p-5 ${editCardBg}`}>
              <EduForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            </div>
          ) : (
            <div key={i} className={`flex items-start justify-between rounded-xl border p-4 ${cardBg}`}>
              <div>
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {edu.degree || <em className="opacity-50 not-italic">Degree not specified</em>}
                </p>
                <p className={`mt-0.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {[edu.school, edu.graduation_date && `Graduated: ${edu.graduation_date}`, edu.gpa && `GPA: ${edu.gpa}`].filter(Boolean).join(" · ")}
                </p>
                {edu.coursework && (
                  <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {String(edu.coursework).length > 90 ? String(edu.coursework).slice(0, 90) + "…" : edu.coursework}
                  </p>
                )}
              </div>
              <CardActions isDark={isDark} onEdit={() => startEdit(i)} onDelete={() => del(i)} />
            </div>
          )
        )}
      </div>

      {education.length === 0 && editingIdx === null && (
        <EmptyState isDark={isDark} message="No education entries yet. Click 'Add Education' above." />
      )}
    </div>
  );
}

function EduForm({ isDark, draft, setDraft, onSave, onCancel }) {
  const up = (f) => (v) => setDraft((d) => ({ ...d, [f]: v }));
  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 outline-none"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 outline-none";
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field isDark={isDark} label="School / University" value={draft.school}          onChange={up("school")}          placeholder="University of Texas at Austin" />
        <Field isDark={isDark} label="Degree"              value={draft.degree}          onChange={up("degree")}          placeholder="B.S. Computer Science" />
        <Field isDark={isDark} label="Graduation Date"     value={draft.graduation_date} onChange={up("graduation_date")} placeholder="May 2024" />
        <Field isDark={isDark} label="GPA (optional)"      value={draft.gpa}             onChange={up("gpa")}             placeholder="3.8" />
      </div>
      <div className="mt-3">
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Relevant Coursework (optional)
          </span>
          <input
            value={draft.coursework ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, coursework: e.target.value }))}
            placeholder="Data Structures, Machine Learning, Algorithms…"
            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition ${inputCls}`}
          />
        </label>
      </div>
      <SaveCancelButtons isDark={isDark} onSave={onSave} onCancel={onCancel} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Work Experience
// ─────────────────────────────────────────────────────────────────────────────

function ExperienceSection({ isDark, schema, onSchema }) {
  const experience = schema.experience ?? [];
  const [editingIdx,   setEditingIdx]   = useState(null);
  const [draft,        setDraft]        = useState(null);
  const [expandedExp,  setExpandedExp]  = useState({});

  function toggleExp(i) { setExpandedExp((p) => ({ ...p, [i]: !p[i] })); }

  const [improvingBullet, setImprovingBullet] = useState({});
  const [bulletDone,      setBulletDone]      = useState({});
  const [rewritingCard,   setRewritingCard]   = useState({});

  async function handleImproveBullet(expIdx, bulletIdx, bullet) {
    const key = `${expIdx}-${bulletIdx}`;
    setImprovingBullet((p) => ({ ...p, [key]: true }));
    try {
      const exp = experience[expIdx];
      const result = await improveBulletAi(bullet, exp?.job_title || "", exp?.company || "");
      if (result?.improved_bullet) {
        const newBullets = [...(exp.bullets ?? [])];
        newBullets[bulletIdx] = result.improved_bullet;
        onSchema({ ...schema, experience: experience.map((e, i) => i === expIdx ? { ...e, bullets: newBullets } : e) });
        setBulletDone((p) => ({ ...p, [key]: true }));
        window.setTimeout(() => setBulletDone((p) => ({ ...p, [key]: false })), 2500);
      }
    } catch {}
    finally { setImprovingBullet((p) => ({ ...p, [key]: false })); }
  }

  async function handleRewriteAll(expIdx) {
    setRewritingCard((p) => ({ ...p, [expIdx]: true }));
    try {
      const exp = experience[expIdx];
      const result = await rewriteBulletsAi(exp.bullets ?? [], exp.job_title || "", exp.company || "");
      if (result?.rewritten_bullets?.length) {
        onSchema({ ...schema, experience: experience.map((e, i) => i === expIdx ? { ...e, bullets: result.rewritten_bullets } : e) });
      }
    } catch {}
    finally { setRewritingCard((p) => ({ ...p, [expIdx]: false })); }
  }

  const cardBg     = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";
  const editCardBg = isDark ? "bg-[#1A0A04] border-[#D4A853]/40" : "bg-[#FAF7F2] border-[#D4A853]/60";

  function startAdd()   { setEditingIdx("new"); setDraft({ job_title: "", company: "", location: "", start_date: "", end_date: "", bullets: [] }); }
  function startEdit(i) { setEditingIdx(i);     setDraft({ ...experience[i], bullets: [...(experience[i].bullets ?? [])] }); }
  function cancel()     { setEditingIdx(null);  setDraft(null); }

  function save() {
    const c = { ...draft, job_title: (draft.job_title ?? "").trim(), company: (draft.company ?? "").trim() };
    if (!c.job_title && !c.company) { cancel(); return; }
    const updated = editingIdx === "new"
      ? [...experience, c]
      : experience.map((e, i) => i === editingIdx ? c : e);
    onSchema({ ...schema, experience: updated });
    cancel();
  }

  function del(i) { onSchema({ ...schema, experience: experience.filter((_, idx) => idx !== i) }); }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading isDark={isDark} title="Work Experience" subtitle="Add your work history, most recent first. Include quantified achievements." />
      <AddButton isDark={isDark} onClick={startAdd}>Add Experience</AddButton>

      {editingIdx === "new" && (
        <div className={`mb-3 rounded-xl border p-5 ${editCardBg}`}>
          <ExpForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        </div>
      )}

      <div className="space-y-3">
        {experience.map((exp, i) =>
          editingIdx === i ? (
            <div key={i} className={`rounded-xl border p-5 ${editCardBg}`}>
              <ExpForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            </div>
          ) : (
            <div key={i} className={`flex items-start justify-between rounded-xl border p-4 ${cardBg}`}>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {exp.job_title || <em className="opacity-50 not-italic">Title not specified</em>}
                  {exp.company && (
                    <span className={`ml-2 font-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      @ {exp.company}
                    </span>
                  )}
                </p>
                <p className={`mt-0.5 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {[
                    exp.location,
                    [exp.start_date, exp.end_date || "Present"].filter(Boolean).join(" – "),
                  ].filter(Boolean).join(" · ")}
                </p>
                {(expandedExp[i] ? (exp.bullets ?? []) : (exp.bullets ?? []).slice(0, 2)).map((b, bi) => {
                    const bKey = `${i}-${bi}`;
                    return (
                      <div key={bi} className="mt-1 flex items-start gap-1">
                        <span className={`flex-shrink-0 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>•</span>
                        <p className={`flex-1 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{b}</p>
                        {editingIdx !== i && (
                          bulletDone[bKey] ? (
                            <span className="flex-shrink-0 text-xs font-bold" style={{ color: "#2C1810" }}>✓</span>
                          ) : (
                            <button type="button" onClick={() => handleImproveBullet(i, bi, b)}
                              disabled={!!improvingBullet[bKey] || !!rewritingCard[i]}
                              title="Improve this bullet with AI"
                              className={`flex-shrink-0 rounded px-1 py-0.5 text-xs transition disabled:opacity-40 ${isDark ? "text-slate-500 hover:text-[#D4A853]" : "text-slate-400 hover:text-[#8B4513]"}`}>
                              {improvingBullet[bKey] ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                {(exp.bullets ?? []).length > 2 && (
                  <button type="button" onClick={() => toggleExp(i)}
                    className={`mt-1 text-xs font-medium underline transition ${isDark ? "text-[#D4A853] hover:text-[#C8A88A]" : "text-[#8B4513] hover:text-[#2C1810]"}`}>
                    {expandedExp[i] ? "Show less" : `+${(exp.bullets ?? []).length - 2} more bullets`}
                  </button>
                )}
                {(exp.bullets ?? []).length > 0 && editingIdx !== i && (
                  <button type="button" onClick={() => handleRewriteAll(i)}
                    disabled={!!rewritingCard[i]}
                    className={`mt-2 flex items-center gap-1 text-xs font-medium transition disabled:opacity-50 ${isDark ? "text-[#D4A853] hover:text-[#C8A88A]" : "text-[#8B4513] hover:text-[#2C1810]"}`}>
                    {rewritingCard[i] ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {rewritingCard[i] ? "Rewriting…" : "Rewrite All"}
                  </button>
                )}
              </div>
              <CardActions isDark={isDark} onEdit={() => startEdit(i)} onDelete={() => del(i)} />
            </div>
          )
        )}
      </div>

      {experience.length === 0 && editingIdx === null && (
        <EmptyState isDark={isDark} message="No experience entries yet. Click 'Add Experience' above." />
      )}
    </div>
  );
}

function ExpForm({ isDark, draft, setDraft, onSave, onCancel }) {
  const up = (f) => (v) => setDraft((d) => ({ ...d, [f]: v }));
  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 outline-none"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 outline-none";

  function handleBullets(text) {
    setDraft((d) => ({
      ...d,
      bullets: text.split("\n").map((b) => b.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean),
    }));
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field isDark={isDark} label="Job Title"  value={draft.job_title}  onChange={up("job_title")}  placeholder="Software Engineer" />
        <Field isDark={isDark} label="Company"    value={draft.company}    onChange={up("company")}    placeholder="Google" />
        <Field isDark={isDark} label="Location"   value={draft.location}   onChange={up("location")}   placeholder="Austin, TX" />
        <div className="grid grid-cols-2 gap-2">
          <Field isDark={isDark} label="Start Date" value={draft.start_date} onChange={up("start_date")} placeholder="Jan 2022" />
          <Field isDark={isDark} label="End Date"   value={draft.end_date}   onChange={up("end_date")}   placeholder="Present" />
        </div>
      </div>
      <div className="mt-3">
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Bullet Points (one per line)
          </span>
          <textarea
            value={(draft.bullets ?? []).join("\n")}
            onChange={(e) => handleBullets(e.target.value)}
            rows={Math.max(3, (draft.bullets ?? []).length + 1)}
            placeholder={"Led development of payment API reducing latency by 45%\nManaged team of 4 engineers delivering quarterly roadmap on time"}
            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm leading-6 transition ${inputCls}`}
          />
          <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            One bullet per line. Bullet markers (•) are optional.
          </p>
        </label>
      </div>
      <SaveCancelButtons isDark={isDark} onSave={onSave} onCancel={onCancel} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Skills
// ─────────────────────────────────────────────────────────────────────────────

function SkillsSection({ isDark, schema, onSchema }) {
  const skillsCat = schema.skills_categorized ?? {};
  const [inputs, setInputs] = useState(() =>
    Object.fromEntries(SKILL_CATEGORIES.map((c) => [c, ""]))
  );

  function removeSkill(cat, skill) {
    const updated = { ...skillsCat, [cat]: (skillsCat[cat] ?? []).filter((s) => s !== skill) };
    onSchema({ ...schema, skills_categorized: updated, skills: Object.values(updated).flat() });
  }

  function addSkill(cat) {
    const val = (inputs[cat] ?? "").trim();
    if (!val) return;
    const existing = skillsCat[cat] ?? [];
    if (existing.map((s) => s.toLowerCase()).includes(val.toLowerCase())) {
      setInputs((p) => ({ ...p, [cat]: "" }));
      return;
    }
    const updated = { ...skillsCat, [cat]: [...existing, val] };
    onSchema({ ...schema, skills_categorized: updated, skills: Object.values(updated).flat() });
    setInputs((p) => ({ ...p, [cat]: "" }));
  }

  const cardBg   = isDark ? "bg-[#10141F] border-slate-700/60" : "bg-white border-slate-200";
  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 outline-none"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 outline-none";

  const totalSkills = Object.values(skillsCat).flat().length;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        isDark={isDark}
        title="Skills"
        subtitle={`${totalSkills} skill${totalSkills !== 1 ? "s" : ""} added. Organize by category for better ATS scanning.`}
      />

      <div className="space-y-4">
        {SKILL_CATEGORIES.map((cat) => {
          const catSkills = skillsCat[cat] ?? [];
          return (
            <div key={cat} className={`rounded-xl border p-4 ${cardBg}`}>
              <p className={`mb-3 text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{cat}</p>
              <div className="mb-3 flex min-h-[28px] flex-wrap gap-2">
                {catSkills.length === 0 && (
                  <span className={`text-xs italic ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                    No skills yet — type below to add
                  </span>
                )}
                {catSkills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold" style={{ background: "#FAF7F2", color: "#2C1810", borderColor: "#E8DDD4" }}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(cat, skill)}
                      className="ml-1 rounded-full text-[#9A8070] hover:text-[#2C1810]"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={inputs[cat] ?? ""}
                  onChange={(e) => setInputs((p) => ({ ...p, [cat]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(cat); } }}
                  placeholder={`Add to ${cat}…`}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => addSkill(cat)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: "#2C1810" }}
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Summary
// ─────────────────────────────────────────────────────────────────────────────

function SummarySection({ isDark, schema, onSchema }) {
  const [improving,    setImproving]    = useState(false);
  const [improveError, setImproveError] = useState("");

  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 focus:border-[#D4A853]/70 focus:ring-[#D4A853]/20"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#D4A853] focus:ring-[#D4A853]/20";

  async function handleImprove() {
    setImproving(true); setImproveError("");
    try {
      const result = await improveSummaryAi(
        schema.summary || "",
        schema.personal?.title || "",
        schema.skills ?? [],
      );
      if (result?.improved_summary) {
        onSchema({ ...schema, summary: result.improved_summary });
      }
    } catch {
      setImproveError("AI improve failed. Check your API key in backend/.env.");
    } finally {
      setImproving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        isDark={isDark}
        title="Professional Summary"
        subtitle="A compelling 3–4 sentence overview of your experience and unique value."
      />

      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Summary
        </span>
        <button
          type="button"
          onClick={handleImprove}
          disabled={improving}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50"
          style={{ background: "rgba(44,24,16,0.1)", color: "#2C1810" }}
        >
          {improving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {improving ? "Improving…" : "✨ Improve with AI"}
        </button>
      </div>

      <textarea
        value={schema.summary ?? ""}
        onChange={(e) => onSchema({ ...schema, summary: e.target.value })}
        rows={9}
        placeholder="Results-driven Software Engineer with 4+ years of experience building scalable systems. Led cross-functional teams delivering high-impact features used by 2M+ users. Passionate about clean architecture and developer experience."
        className={`w-full rounded-xl border px-4 py-3 text-sm leading-7 outline-none transition focus:ring-1 ${inputCls}`}
      />

      {improveError && (
        <p className="mt-2 text-xs font-semibold text-red-500">{improveError}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: Certifications
// ─────────────────────────────────────────────────────────────────────────────

function CertificationsSection({ isDark, schema, onSchema }) {
  const certs = schema.certifications ?? [];
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft,      setDraft]      = useState("");

  const cardBg     = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";
  const editCardBg = isDark ? "bg-[#1A0A04] border-[#D4A853]/40" : "bg-[#FAF7F2] border-[#D4A853]/60";
  const inputCls   = isDark
    ? "bg-[#0d1121] border-slate-600 text-white outline-none"
    : "bg-white border-slate-300 text-slate-900 outline-none";

  function startAdd()   { setEditingIdx("new"); setDraft(""); }
  function startEdit(i) { setEditingIdx(i);     setDraft(certs[i]); }
  function cancel()     { setEditingIdx(null);  setDraft(""); }

  function save() {
    if (!draft.trim()) { cancel(); return; }
    const updated = editingIdx === "new"
      ? [...certs, draft.trim()]
      : certs.map((c, i) => i === editingIdx ? draft.trim() : c);
    onSchema({ ...schema, certifications: updated });
    cancel();
  }

  function del(i) {
    onSchema({ ...schema, certifications: certs.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        isDark={isDark}
        title="Certifications & Licenses"
        subtitle="Add professional certifications, licenses, and training credentials."
      />
      <AddButton isDark={isDark} onClick={startAdd}>Add Certification</AddButton>

      {editingIdx === "new" && (
        <div className={`mb-3 rounded-xl border p-4 ${editCardBg}`}>
          <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Certification Name
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            placeholder="AWS Certified Solutions Architect – Associate · 2024"
            className={`w-full rounded-lg border px-3 py-2 text-sm transition ${inputCls}`}
            autoFocus
          />
          <SaveCancelButtons isDark={isDark} onSave={save} onCancel={cancel} />
        </div>
      )}

      <div className="space-y-2">
        {certs.map((cert, i) =>
          editingIdx === i ? (
            <div key={i} className={`rounded-xl border p-4 ${editCardBg}`}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition ${inputCls}`}
                autoFocus
              />
              <SaveCancelButtons isDark={isDark} onSave={save} onCancel={cancel} />
            </div>
          ) : (
            <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${cardBg}`}>
              <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cert}</p>
              <CardActions isDark={isDark} onEdit={() => startEdit(i)} onDelete={() => del(i)} />
            </div>
          )
        )}
      </div>

      {certs.length === 0 && editingIdx === null && (
        <EmptyState isDark={isDark} message="No certifications yet. Click 'Add Certification' above." />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: Projects
// ─────────────────────────────────────────────────────────────────────────────

function ProjectsSection({ isDark, schema, onSchema }) {
  const projects = schema.projects ?? [];
  const [editingIdx,   setEditingIdx]   = useState(null);
  const [draft,        setDraft]        = useState(null);
  const [expandedProj, setExpandedProj] = useState({});

  function toggleProj(i) { setExpandedProj((p) => ({ ...p, [i]: !p[i] })); }

  const cardBg     = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";
  const editCardBg = isDark ? "bg-[#1A0A04] border-[#D4A853]/40" : "bg-[#FAF7F2] border-[#D4A853]/60";

  function startAdd()   { setEditingIdx("new"); setDraft({ name: "", date: "", bullets: [] }); }
  function startEdit(i) { setEditingIdx(i);     setDraft({ ...projects[i], bullets: [...(projects[i].bullets ?? [])] }); }
  function cancel()     { setEditingIdx(null);  setDraft(null); }

  function save() {
    const c = { ...draft, name: (draft.name ?? "").trim() };
    if (!c.name) { cancel(); return; }
    const updated = editingIdx === "new"
      ? [...projects, c]
      : projects.map((p, i) => i === editingIdx ? c : p);
    onSchema({ ...schema, projects: updated });
    cancel();
  }

  function del(i) { onSchema({ ...schema, projects: projects.filter((_, idx) => idx !== i) }); }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading isDark={isDark} title="Projects" subtitle="Add your personal and professional projects." />
      <AddButton isDark={isDark} onClick={startAdd}>Add Project</AddButton>

      {editingIdx === "new" && (
        <div className={`mb-3 rounded-xl border p-5 ${editCardBg}`}>
          <ProjForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        </div>
      )}

      <div className="space-y-3">
        {projects.map((proj, i) =>
          editingIdx === i ? (
            <div key={i} className={`rounded-xl border p-5 ${editCardBg}`}>
              <ProjForm isDark={isDark} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            </div>
          ) : (
            <div key={i} className={`flex items-start justify-between rounded-xl border p-4 ${cardBg}`}>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {proj.name || <em className="opacity-50 not-italic">Name not specified</em>}
                  {proj.date && (
                    <span className={`ml-2 font-normal text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      · {proj.date}
                    </span>
                  )}
                </p>
                {(expandedProj[i] ? (proj.bullets ?? []) : (proj.bullets ?? []).slice(0, 2)).map((b, bi) => (
                  <p key={bi} className={`mt-1 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    • {b}
                  </p>
                ))}
                {(proj.bullets ?? []).length > 2 && (
                  <button type="button" onClick={() => toggleProj(i)}
                    className={`mt-1 text-xs font-medium underline transition ${isDark ? "text-[#D4A853] hover:text-[#C8A88A]" : "text-[#8B4513] hover:text-[#2C1810]"}`}>
                    {expandedProj[i] ? "Show less" : `+${(proj.bullets ?? []).length - 2} more bullets`}
                  </button>
                )}
              </div>
              <CardActions isDark={isDark} onEdit={() => startEdit(i)} onDelete={() => del(i)} />
            </div>
          )
        )}
      </div>

      {projects.length === 0 && editingIdx === null && (
        <EmptyState isDark={isDark} message="No projects yet. Click '+ Add Project' to add one." />
      )}
    </div>
  );
}

function ProjForm({ isDark, draft, setDraft, onSave, onCancel }) {
  const up = (f) => (v) => setDraft((d) => ({ ...d, [f]: v }));
  const inputCls = isDark
    ? "bg-[#0d1121] border-slate-600 text-white placeholder-slate-600 outline-none"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 outline-none";

  function handleBullets(text) {
    setDraft((d) => ({
      ...d,
      bullets: text.split("\n").map((b) => b.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean),
    }));
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field isDark={isDark} label="Project Name" value={draft.name} onChange={up("name")} placeholder="AI Log Intelligence System" />
        <Field isDark={isDark} label="Date"         value={draft.date} onChange={up("date")} placeholder="Mar 2026" />
      </div>
      <div className="mt-3">
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Bullet Points (one per line)
          </span>
          <textarea
            value={(draft.bullets ?? []).join("\n")}
            onChange={(e) => handleBullets(e.target.value)}
            rows={Math.max(3, (draft.bullets ?? []).length + 1)}
            placeholder={"Built REST API handling 10,000+ requests/day\nReduced latency by 40% via caching"}
            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm leading-6 transition ${inputCls}`}
          />
          <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            One bullet per line. Bullet markers (•) are optional.
          </p>
        </label>
      </div>
      <SaveCancelButtons isDark={isDark} onSave={onSave} onCancel={onCancel} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: Finalize
// ─────────────────────────────────────────────────────────────────────────────

function FinalizeSection({ isDark, schema, completedSections, onGoTo, onShowPreview }) {
  const { user } = useAuth();
  const reviewSections = WIZARD_SECTIONS.slice(0, -1);
  const allDone = reviewSections.every((s) => completedSections.has(s.key));
  const cardBg  = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";
  const [downloading,    setDownloading]    = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [aiReview,      setAiReview]      = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError,   setReviewError]   = useState("");

  async function handleGetAiReview() {
    setLoadingReview(true); setReviewError(""); setAiReview(null);
    try {
      const resumeData = {
        name:    schema.personal?.name    || "",
        title:   schema.personal?.title   || "",
        summary: schema.summary           || "",
        experience: (schema.experience ?? []).map((e) => ({
          title:   e.job_title || "",
          company: e.company   || "",
          bullets: e.bullets   || [],
        })),
        skills:   schema.skills ?? [],
        projects: (schema.projects ?? []).map((p) => ({
          name:    p.name    || "",
          bullets: p.bullets || [],
        })),
      };
      const result = await getAiReviewAi(resumeData);
      setAiReview(result);
    } catch {
      setReviewError("AI review failed. Make sure the backend is running on port 8011.");
    } finally {
      setLoadingReview(false);
    }
  }

  async function handleDownloadPDF() {
    if (!user) { setShowSignupGate(true); return; }
    setDownloading(true);
    try {
      await downloadResumePDF(schema);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        isDark={isDark}
        title="Finalize Your Resume"
        subtitle="Review all sections, preview your resume, then download or choose a template."
      />

      <div className="mb-8 grid grid-cols-2 gap-3">
        {reviewSections.map((s) => {
          const done = completedSections.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onGoTo(s.key)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${cardBg}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  done ? "" : isDark ? "bg-slate-700" : "bg-slate-100"
                }`}
                style={done ? { background: "#2C1810" } : {}}
              >
                {done
                  ? <Check size={16} className="text-white" />
                  : <span className={`text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.step}</span>
                }
              </span>
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{s.label}</p>
                <p className={`text-xs ${done ? "text-[#2C1810]" : isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {done ? "Completed ✓" : "Click to review"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onShowPreview}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold transition ${
            isDark
              ? "border-slate-600 text-slate-300 hover:border-slate-400"
              : "border-slate-200 text-slate-600 hover:border-slate-400"
          }`}
        >
          <Eye size={17} /> Preview
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#2C1810" }}
        >
          {downloading
            ? <><Loader2 size={17} className="animate-spin" /> Generating PDF…</>
            : <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
          }
        </button>
      </div>

      {!allDone && (
        <p className={`mt-5 flex items-center gap-2 text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}>
          <AlertCircle size={15} />
          You haven&apos;t reviewed all sections yet. Click each card above to confirm the data before downloading.
        </p>
      )}

      <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Or click <strong>Choose Template →</strong> in the bar below to pick a visual template.
      </p>

      <SignupModal isOpen={showSignupGate} onClose={() => setShowSignupGate(false)} reason="download" />

      {/* ── AI Review Panel ── */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGetAiReview}
            disabled={loadingReview}
            className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
            style={{ borderColor: "#D4A853", color: "#2C1810" }}
          >
            {loadingReview ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loadingReview ? "Analyzing resume…" : "🤖 Get AI Review"}
          </button>
          {aiReview && (
            <button type="button" onClick={() => setAiReview(null)}
              className={`text-xs ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
              Dismiss
            </button>
          )}
        </div>

        {reviewError && <p className="mt-2 text-sm font-semibold text-red-500">{reviewError}</p>}

        {aiReview && (
          <div className={`mt-4 rounded-xl border p-5 space-y-4 ${isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200"}`}>
            {/* Score */}
            <div className="flex items-center justify-between">
              <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>AI Resume Review</h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Overall Score</span>
                <span className="rounded-lg px-3 py-1 text-lg font-bold text-white"
                  style={{ background: (aiReview.overall_score ?? 0) >= 80 ? "#2C1810" : (aiReview.overall_score ?? 0) >= 60 ? "#D4A853" : "#dc2626" }}>
                  {aiReview.overall_score ?? "–"}/100
                </span>
              </div>
            </div>

            {/* Strengths */}
            {(aiReview.strengths ?? []).length > 0 && (
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>✅ Strengths</p>
                {aiReview.strengths.map((s, i) => (
                  <p key={i} className={`mt-0.5 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>• {s}</p>
                ))}
              </div>
            )}

            {/* Improvements */}
            {(aiReview.improvements ?? []).length > 0 && (
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>⚠️ Improvements</p>
                {aiReview.improvements.map((imp, i) => (
                  <div key={i} className={`mt-1.5 rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-[#FAF7F2]"}`}>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{imp.section}: {imp.issue}</p>
                    <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>→ {imp.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Missing keywords */}
            {(aiReview.missing_keywords ?? []).length > 0 && (
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>🔍 Missing Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiReview.missing_keywords.map((kw, i) => (
                    <span key={i} className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      style={{ borderColor: "#E8DDD4", color: "#2C1810", background: "#FAF7F2" }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Tips */}
            {(aiReview.ats_tips ?? []).length > 0 && (
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>💡 ATS Tips</p>
                {aiReview.ats_tips.map((tip, i) => (
                  <p key={i} className={`mt-0.5 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>• {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview Modal
// ─────────────────────────────────────────────────────────────────────────────

function PreviewModal({ isDark, schema, onClose }) {
  const [templateId, setTemplateId] = useState("ats-clean");
  const person = schemaToRenderPerson(schema);
  const html   = renderResumeHTML(person, templateId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Resume Preview</h2>
          <div className="flex items-center gap-3">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none"
            >
              {RESUME_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview iframe */}
        <div className="overflow-auto bg-slate-100 p-4">
          <iframe
            srcDoc={html}
            className="w-full rounded-lg bg-white shadow"
            style={{ minHeight: "900px", border: "none" }}
            title="Resume Preview"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4: Template Selection
// ─────────────────────────────────────────────────────────────────────────────

function TemplateScreen({ isDark, onChoose }) {
  const [hoverId, setHoverId] = useState(null);
  const bg     = isDark ? "bg-[#080C15]"   : "bg-white";
  const heading = isDark ? "text-white"    : "text-slate-900";
  const sub     = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg  = isDark ? "bg-[#10141F] border-slate-700" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="px-8 pb-6 pt-12 text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          Please select a template for your resume.<br />
          <span className={`font-normal ${sub}`}>You can always change it later.</span>
        </h1>
        <p className={`mx-auto mt-4 max-w-2xl text-base ${sub}`}>
          Yes, modern ATS systems do read double column templates and do not care about colors.
          Recruiters appreciate readability and one-page resumes, though.
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pb-16">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {RESUME_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cardBg}`}
              onMouseEnter={() => setHoverId(tpl.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onChoose(tpl.id)}
            >
              <div className="relative overflow-hidden bg-white" style={{ height: 320 }}>
                <TemplateThumbnail tpl={tpl} />
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${hoverId === tpl.id ? "bg-black/50" : "bg-transparent"}`}>
                  {hoverId === tpl.id && (
                    <button type="button" className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90" style={{ background: "#2C1810" }}>
                      Use This Template
                    </button>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xs font-bold text-slate-700 shadow">
                  ATS
                </div>
              </div>
              <div className={`border-t px-4 py-3 ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                <p className={`text-center text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{tpl.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateThumbnail({ tpl }) {
  const html = (() => {
    try { return renderResumeHTML(SAMPLE_PERSON, tpl.id); } catch { return ""; }
  })();

  if (!html) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: tpl.bg || "#f8fafc" }}
      >
        <div className="text-center px-4">
          <div className="mx-auto mb-2 h-6 w-14 rounded" style={{ background: tpl.accent, opacity: 0.4 }} />
          <div className="space-y-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${60 + (i % 3) * 20}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: "340%", height: "1100px", border: "none", transform: "scale(0.294)", transformOrigin: "top left" }}
      title={tpl.name}
    />
  );
}
