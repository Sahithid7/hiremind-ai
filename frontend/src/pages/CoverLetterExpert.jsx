import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Download,
  Edit3,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  UploadCloud,
  X
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import Button from "../components/Button";
import {
  buildCoverLetterTemplateHtml,
  CoverLetterTemplate,
  coverLetterTemplateOptions
} from "../components/CoverLetterTemplateEngine";
import { usePageTitle } from "../hooks/usePageTitle";
import { uploadResume } from "../services/resumeService";
import { getApiErrorMessage } from "../utils/apiError";
import { exportElementAsPdf } from "../utils/exportDocument";
import { emptyResumeForm, extractResumeProfile } from "../utils/resumeExtraction";

// ── Stages: landing → input → loading → templates → preview ──────────────────
const UPLOAD_STAGES  = ["Uploading resume", "Reading experience", "Extracting skills", "Matching job keywords", "Building cover letter draft"];
const GEN_STAGES     = ["Reading resume context", "Matching job keywords", "Writing tailored paragraphs", "Applying template"];

// Sample letter used for previews (never injected into real output)
const SAMPLE_LETTER = {
  name: "Ava Martinez", title: "Software Engineer",
  company: "Hiring Company", manager: "Hiring Manager",
  date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  location: "St. Louis, MO", phone: "(314) 555-0184",
  email: "ava.martinez@example.com", linkedin: "linkedin.com/in/avamartinez",
  companyLocation: "",
  paragraphs: [
    "I am excited to apply for this role. My background in software engineering, backend services, and product-focused collaboration aligns well with the team's needs.",
    "In recent work, I have built full-stack applications, improved API reliability, and translated ambiguous product requirements into overseeable engineering solutions.",
    "I would welcome the opportunity to bring clear communication, ownership, and practical execution to your team.",
  ]
};

export default function CoverLetterExpert() {
  usePageTitle("Cover Letter");
  const resumeInputRef = useRef(null);

  const [stage,              setStage]              = useState("landing");
  const [resumeFile,         setResumeFile]         = useState(null);
  const [isDragging,         setIsDragging]         = useState(false);
  const [uploadedResume,     setUploadedResume]     = useState(null);
  const [uploadStep,         setUploadStep]         = useState(-1);
  const [genStep,            setGenStep]            = useState(-1);
  const [selectedTemplateId, setSelectedTemplateId] = useState("modern-minimal");
  const [hoveredTemplateId,  setHoveredTemplateId]  = useState(null);
  const [previewModalId,     setPreviewModalId]     = useState(null);
  const [error,              setError]              = useState("");
  const [draftText,          setDraftText]          = useState("");
  const [isEditing,          setIsEditing]          = useState(false);
  const [statusMessage,      setStatusMessage]      = useState("");
  const [form, setForm] = useState({
    name: "", title: "", email: "", phone: "", location: "", linkedin: "",
    summary: "", experience: "", skills: "",
    company: "", manager: "Hiring Manager", role: "", tone: "Professional",
    jobDescription: ""
  });

  const selectedTemplate = coverLetterTemplateOptions.find((t) => t.id === selectedTemplateId) ?? coverLetterTemplateOptions[0];
  const letter = useMemo(() => buildLetterObject(form, draftText), [form, draftText]);

  function updateField(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  // ── File drag/drop ─────────────────────────────────────────────────────────
  function onDrop(e) { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }
  function handleFile(file) {
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx)$/i)) { setError("Please upload a PDF or DOCX file."); return; }
    setError(""); setResumeFile(file);
  }

  // ── Process: upload resume + enter JD → loading → templates ──────────────
  async function handleProcess() {
    if (!resumeFile) { setError("Please upload your resume first."); return; }
    if (!form.jobDescription.trim()) { setError("Please paste a job description."); return; }

    setError(""); setStage("loading"); setUploadStep(0);
    const uTimer = window.setInterval(() => setUploadStep((s) => Math.min(UPLOAD_STAGES.length - 1, s + 1)), 600);

    try {
      const result = await uploadResume(resumeFile);
      const raw = result.resume ?? result;
      setUploadedResume(raw);
      const profile = extractResumeProfile(raw, resumeFile.name);
      setForm((f) => ({
        ...f,
        name: profile.name || f.name,
        title: profile.title || f.title,
        email: profile.email || f.email,
        phone: profile.phone || f.phone,
        location: profile.location || f.location,
        linkedin: profile.linkedin || f.linkedin,
        summary: profile.summary || f.summary,
        experience: profile.experience || f.experience,
        skills: profile.skills || f.skills,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Upload failed. You can still continue with manual entry."));
    } finally {
      window.clearInterval(uTimer); setUploadStep(-1);
    }

    // Animate into templates
    window.setTimeout(() => { setStage("templates"); }, 400);
  }

  // ── Generate cover letter ─────────────────────────────────────────────────
  function generateLetter() {
    setStage("generating"); setGenStep(0);
    const gTimer = window.setInterval(() => setGenStep((s) => Math.min(GEN_STAGES.length - 1, s + 1)), 500);
    window.setTimeout(() => {
      window.clearInterval(gTimer); setGenStep(-1);
      const text = makeCoverLetterText(form, resumeFile?.name ?? "");
      setDraftText(text);
      setStage("preview");
    }, 2200);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  async function downloadPdf() {
    setStatusMessage("Preparing PDF…");
    const result = await exportElementAsPdf(`${letter.name} Cover Letter`, buildCoverLetterTemplateHtml(letter, selectedTemplate));
    setStatusMessage(result.ok ? "PDF downloaded." : "Print dialog opened.");
  }
  function downloadDocx() {
    const html = buildCoverLetterTemplateHtml(letter, selectedTemplate);
    const blob = new Blob([html], { type: "application/msword" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `${letter.name.replace(/\s+/g,"_")}_Cover_Letter.doc`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatusMessage("DOCX downloaded.");
  }
  async function copyText() {
    const plain = toPlainText(letter);
    try { await navigator.clipboard.writeText(plain); setStatusMessage("Copied to clipboard."); }
    catch { setStatusMessage(plain); }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function handleReset() {
    setStage("landing"); setResumeFile(null); setUploadedResume(null);
    setDraftText(""); setError(""); setStatusMessage("");
    setForm({ name:"", title:"", email:"", phone:"", location:"", linkedin:"",
              summary:"", experience:"", skills:"",
              company:"", manager:"Hiring Manager", role:"", tone:"Professional", jobDescription:"" });
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: Landing
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "landing") {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="grid min-h-[calc(100vh-120px)] gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">

          {/* Left: copy */}
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-graphite">
              <span className="h-2 w-2 rounded-full" style={{ background: "#D4A853" }} />
              ATS Friendly · Multiple Templates · Export PDF &amp; DOCX
            </p>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-ink md:text-6xl">
              Create your AI<br />Cover Letter
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-graphite">
              Upload your resume and HireMind will generate a recruiter-ready cover letter personalized to your experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="signal" onClick={() => setStage("input")} className="px-8 text-base">
                Build Cover Letter <ArrowRight size={18} />
              </Button>
              <Button variant="outline" onClick={() => setStage("templates-browse")} className="px-6 text-base">
                Browse Templates
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {["ATS Friendly", "Multiple Templates", "Export PDF & DOCX"].map((f) => (
                <div key={f} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                  <CheckCircle2 size={18} style={{ color: "#2C1810" }} />
                  <p className="mt-3 text-sm font-bold text-ink">{f}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: full cover letter preview */}
          <div className="relative hidden lg:block">
            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-2xl">
              <CoverLetterTemplate template={coverLetterTemplateOptions[0]} letter={SAMPLE_LETTER} mode="builder" />
            </div>
            {/* Quality score badge */}
            <div className="absolute -right-4 top-8 rounded-2xl border border-line bg-white px-5 py-4 shadow-xl">
              <p className="text-sm font-bold text-graphite">Quality Score</p>
              <p className="mt-1 text-4xl font-extrabold" style={{ color: "#2C1810" }}>91</p>
            </div>
            {/* ATS badge */}
            <div className="absolute -left-4 bottom-12 rounded-2xl border border-line bg-white px-4 py-3 shadow-xl">
              <p className="text-xs font-bold text-graphite">ATS Score</p>
              <p className="text-2xl font-extrabold text-signal">96%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1b: Browse templates (before building)
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "templates-browse") {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">Cover Letter Templates</h1>
            <p className="mt-1 text-graphite">Choose a style for your cover letter. You can change it any time.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStage("landing")}>← Back</Button>
            <Button variant="signal" onClick={() => setStage("input")}>Build Cover Letter <ArrowRight size={16} /></Button>
          </div>
        </div>
        <TemplateGrid
          templates={coverLetterTemplateOptions}
          selectedId={selectedTemplateId}
          hoveredId={hoveredTemplateId}
          previewModalId={previewModalId}
          onHover={setHoveredTemplateId}
          onPreview={setPreviewModalId}
          onSelect={(id) => { setSelectedTemplateId(id); setStage("input"); }}
          sampleLetter={SAMPLE_LETTER}
        />
        {previewModalId && (
          <TemplatePreviewModal
            template={coverLetterTemplateOptions.find((t) => t.id === previewModalId)}
            letter={SAMPLE_LETTER}
            onClose={() => setPreviewModalId(null)}
            onSelect={(id) => { setSelectedTemplateId(id); setPreviewModalId(null); setStage("input"); }}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2: Input — resume upload + job description
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "input") {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <button type="button" onClick={() => setStage("landing")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-graphite hover:text-ink">
            ← Back
          </button>
          <h1 className="text-3xl font-extrabold text-ink">Build Your Cover Letter</h1>
          <p className="mt-2 text-graphite">Upload your resume and paste the job description. We'll generate a personalized cover letter.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT: Resume upload */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-bold text-signal">Step 1</p>
              <h2 className="text-xl font-bold text-ink">Upload your resume</h2>
              <p className="mt-1 text-sm text-graphite">We'll extract your name, experience, and skills automatically.</p>
            </div>

            {/* Drop zone */}
            <label htmlFor="cl-resume-input"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
                isDragging   ? "border-signal bg-lilac/30"
                : resumeFile  ? "border-[#D4A853] bg-[#D4A853]/5 cursor-default"
                : "border-slate-300 hover:border-signal hover:bg-lilac/10"
              }`}
            >
              <input id="cl-resume-input" ref={resumeInputRef} type="file" className="hidden" accept=".pdf,.docx"
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
              {resumeFile ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <CheckCircle2 size={32} style={{ color: "#2C1810" }} />
                  <p className="font-bold text-ink">{resumeFile.name}</p>
                  <p className="text-sm text-graphite">{(resumeFile.size/1024).toFixed(0)} KB · Ready</p>
                  <button type="button" onClick={(e) => { e.preventDefault(); setResumeFile(null); setUploadedResume(null); }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <UploadCloud size={24} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-ink">Drag &amp; drop your resume</p>
                  <p className="text-sm text-graphite">PDF or DOCX · Max 10MB</p>
                  <span className="mt-2 rounded-xl bg-signal px-5 py-2 text-sm font-bold text-white">Choose File</span>
                </div>
              )}
            </label>

            {/* Quick fields */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <F label="Target Role" name="role" value={form.role} onChange={updateField} placeholder="Software Engineer" />
              <F label="Company" name="company" value={form.company} onChange={updateField} placeholder="Google" />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-semibold text-ink">Tone</label>
              <select name="tone" value={form.tone} onChange={updateField}
                className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink">
                {["Professional", "Confident", "Friendly", "Concise"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* RIGHT: Job description */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-bold text-signal">Step 2</p>
              <h2 className="text-xl font-bold text-ink">Paste the job description</h2>
              <p className="mt-1 text-sm text-graphite">We'll match your experience to the role's requirements.</p>
            </div>
            <textarea name="jobDescription" value={form.jobDescription} onChange={updateField} rows={14}
              placeholder="Paste the full job description here…&#10;&#10;Example:&#10;We're looking for a Software Engineer to join our backend team. You'll build scalable APIs, work with cloud infrastructure, and collaborate with product teams..."
              className="focus-ring w-full resize-none rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-ink" />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setStage("landing")}>Cancel</Button>
          <Button variant="signal" onClick={handleProcess}
            disabled={!resumeFile || !form.jobDescription.trim()} className="px-8">
            Continue to Templates <ArrowRight size={17} />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3: Loading
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "loading") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(44,24,16,0.1)" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "#2C1810" }} />
        </div>
        <h2 className="text-2xl font-bold text-ink">Processing your resume…</h2>
        <p className="mt-2 text-sm text-graphite">Extracting experience and matching job keywords</p>
        <div className="mt-8 w-full space-y-3">
          {UPLOAD_STAGES.map((step, i) => (
            <div key={step} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              i < uploadStep  ? "bg-[#2C1810]/10 text-[#2C1810]"
              : i === uploadStep ? "bg-[#D4A853]/15 text-[#2C1810]"
              : "bg-slate-50 text-slate-400"
            }`}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < uploadStep ? "text-white" : i === uploadStep ? "text-[#2C1810]" : "bg-slate-200 text-slate-500"
                }`}
                style={i < uploadStep ? { background: "#2C1810" } : i === uploadStep ? { background: "#D4A853" } : {}}
              >{i < uploadStep ? "✓" : i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4: Template selection (10 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "templates") {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-ink">Choose your cover letter style</h1>
          <p className="mt-2 text-graphite">Pick a design that fits your industry and personality. You can change it any time.</p>
        </div>

        <TemplateGrid
          templates={coverLetterTemplateOptions}
          selectedId={selectedTemplateId}
          hoveredId={hoveredTemplateId}
          previewModalId={previewModalId}
          onHover={setHoveredTemplateId}
          onPreview={setPreviewModalId}
          onSelect={(id) => { setSelectedTemplateId(id); setPreviewModalId(null); generateLetter(); }}
          sampleLetter={SAMPLE_LETTER}
          showSelectButton
        />

        {previewModalId && (
          <TemplatePreviewModal
            template={coverLetterTemplateOptions.find((t) => t.id === previewModalId)}
            letter={SAMPLE_LETTER}
            onClose={() => setPreviewModalId(null)}
            onSelect={(id) => { setSelectedTemplateId(id); setPreviewModalId(null); generateLetter(); }}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4b: Generating
  // ═══════════════════════════════════════════════════════════════════════════
  if (stage === "generating") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(44,24,16,0.1)" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "#2C1810" }} />
        </div>
        <h2 className="text-2xl font-bold text-ink">Writing your cover letter…</h2>
        <p className="mt-2 text-sm text-graphite">Tailoring your experience to the job description</p>
        <div className="mt-8 w-full space-y-3">
          {GEN_STAGES.map((step, i) => (
            <div key={step} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              i < genStep  ? "bg-[#2C1810]/10 text-[#2C1810]" : i === genStep ? "bg-[#D4A853]/15 text-[#2C1810]" : "bg-slate-50 text-slate-400"
            }`}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < genStep ? "text-white" : i === genStep ? "text-[#2C1810]" : "bg-slate-200 text-slate-500"
                }`}
                style={i < genStep ? { background: "#2C1810" } : i === genStep ? { background: "#D4A853" } : {}}
              >{i < genStep ? "✓" : i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 5: Preview + download
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Your Cover Letter</h1>
          <p className="text-sm text-graphite">{selectedTemplate.name} template · {letter.name || "Review before downloading"}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStage("templates")}>← Change Template</Button>
          <Button variant="outline" onClick={handleReset}>Start Over</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cover letter preview */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 size={16} />{isEditing ? "Done Editing" : "Edit"}
              </Button>
              <Button variant="outline" onClick={() => { setDraftText(makeCoverLetterText(form, resumeFile?.name ?? "")); setIsEditing(false); }}>
                <RefreshCw size={16} /> Regenerate
              </Button>
            </div>
            {statusMessage && <span className="text-sm font-bold" style={{ color: "#2C1810" }}>{statusMessage}</span>}
          </div>
          {isEditing ? (
            <textarea className="focus-ring min-h-96 w-full rounded-2xl border border-line bg-white p-5 text-sm leading-7 text-ink"
              value={draftText} onChange={(e) => setDraftText(e.target.value)} />
          ) : (
            <CoverLetterTemplate template={selectedTemplate} letter={letter} mode="builder" />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-ink">Export</p>
            <div className="space-y-2.5">
              <Button className="w-full" variant="signal" onClick={downloadPdf}><Download size={16} />Download PDF</Button>
              <Button className="w-full" variant="outline" onClick={downloadDocx}><FileText size={16} />Download DOCX</Button>
              <Button className="w-full" variant="outline" onClick={copyText}><Clipboard size={16} />Copy Text</Button>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm space-y-3">
            <p className="text-sm font-bold text-ink">Cover Letter Details</p>
            <F label="Your Name"    name="name"    value={form.name}    onChange={updateField} />
            <F label="Target Role"  name="role"    value={form.role}    onChange={updateField} />
            <F label="Company"      name="company" value={form.company} onChange={updateField} />
            <F label="Hiring Mgr"   name="manager" value={form.manager} onChange={updateField} />
          </div>

          <div className="rounded-2xl border p-4 text-sm text-graphite" style={{ borderColor: "#D4A853", background: "#FAF7F2" }}>
            <CheckCircle2 size={16} className="mb-2" style={{ color: "#2C1810" }} />
            <p className="font-bold text-ink">ATS-friendly format</p>
            <p className="mt-1">Generated from your real resume content.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Template grid (shared between landing browse + template selection) ────────
function TemplateGrid({ templates, selectedId, hoveredId, previewModalId, onHover, onPreview, onSelect, sampleLetter, showSelectButton = false }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {templates.map((tpl) => (
        <article key={tpl.id}
          className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
            selectedId === tpl.id ? "border-signal ring-2 ring-signal/20" : "border-slate-200"
          }`}
          onMouseEnter={() => onHover(tpl.id)}
          onMouseLeave={() => onHover(null)}>
          {/* Preview */}
          <div className="relative overflow-hidden bg-slate-50" style={{ height: 260 }}>
            <div className="pointer-events-none absolute top-0 left-0"
              style={{ transform: "scale(0.38)", transformOrigin: "top left", width: "263%", height: "684px" }}>
              <CoverLetterTemplate template={tpl} letter={sampleLetter} mode="builder" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${hoveredId === tpl.id ? "bg-slate-900/50" : "bg-transparent"}`}>
              {hoveredId === tpl.id && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => onPreview(tpl.id)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-50">
                    Preview
                  </button>
                  {showSelectButton && (
                    <button type="button" onClick={() => onSelect(tpl.id)}
                      className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg hover:opacity-90" style={{ background: "#2C1810" }}>
                      Use This
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Footer */}
          <div className="border-t border-slate-100 p-4">
            <p className="font-bold text-slate-900">{tpl.name}</p>
            <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: tpl.accent + "18", color: tpl.accent }}>{tpl.category}</span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onPreview(tpl.id)}
                className="rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Preview</button>
              <button type="button" onClick={() => onSelect(tpl.id)}
                className="rounded-lg py-2 text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: tpl.accent }}>
                {showSelectButton ? "Use Template" : "Select"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Template preview modal ────────────────────────────────────────────────────
function TemplatePreviewModal({ template, letter, onClose, onSelect }) {
  if (!template) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{template.name}</h2>
            <p className="text-sm text-slate-400">{template.category} template</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onSelect(template.id)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: template.accent }}>
              Use This Template →
            </button>
            <button type="button" onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <CoverLetterTemplate template={template} letter={letter} mode="modal" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function F({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" {...props} />
    </label>
  );
}

// ── Cover letter text generator ───────────────────────────────────────────────
function makeCoverLetterText(form, resumeFile) {
  const role    = (form.role    || "this position").trim();
  const company = (form.company || "your company").trim();
  const tone    = (form.tone    || "Professional").toLowerCase();

  // Clean skills into a readable comma list (up to 5)
  const skillList = (form.skills || "")
    .split(/[\n,;|·•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 50)
    .slice(0, 5)
    .join(", ");

  // Professional summary — use first 2 sentences
  const summaryClean = (form.summary || "").replace(/\n+/g, " ").trim();
  const summarySentences = summaryClean.match(/[^.!?]+[.!?]+/g) || [];
  const summaryOpener = summarySentences.slice(0, 2).join(" ").trim();

  // Experience — take first sentence/clause as a highlight
  const expClean = (form.experience || "").replace(/\n+/g, " ").trim();
  const expFirstClause = expClean.length > 40
    ? expClean.split(/[.!?]/)[0].trim().slice(0, 250)
    : "";

  // Quality keywords from JD — filter stop words and keep tech/domain terms
  const STOP = new Set([
    "with","that","this","role","will","your","from","have","work","team","able",
    "also","been","into","they","were","more","very","just","when","than","what",
    "some","each","both","must","such","over","back","only","like","even","most",
    "many","the","and","for","are","was","has","its","all","can","our","not","you",
    "but","use","new","any","may","their","about","which","these","those","should",
    "would","could","using","based","ensure","strong","within","other","provide",
    "support","build","manage","seeking","looking","position","candidate","company",
    "experience","skills","required","preferred","including","responsibilities",
  ]);
  const jdKeywords = [...new Set((form.jobDescription || "")
    .match(/\b[A-Z][a-z]{2,}|\b[a-z]{4,}\b/g) ?? [])]
    .filter((w) => !STOP.has(w.toLowerCase()) && w.length >= 4 && !/^\d/.test(w))
    .slice(0, 3);
  const kwPhrase = jdKeywords.length >= 2 ? jdKeywords.slice(0, 3).join(", ") : "";

  // ── Paragraph 1: Opening — role, company, professional intro ─────────────
  let para1;
  if (summaryOpener) {
    para1 = `I am writing to express my strong interest in the ${role} position at ${company}. ${summaryOpener}`;
  } else if (skillList) {
    para1 = `I am writing to express my strong interest in the ${role} position at ${company}. With hands-on expertise in ${skillList}, I am confident in my ability to contribute meaningfully to your team from day one.`;
  } else {
    para1 = `I am writing to express my strong interest in the ${role} position at ${company}. My background and commitment to delivering high-quality work make me a strong candidate for this opportunity.`;
  }

  // ── Paragraph 2: Specific experience + relevant skills ───────────────────
  let para2;
  if (expFirstClause && skillList) {
    const clauseLower = expFirstClause.charAt(0).toLowerCase() + expFirstClause.slice(1);
    para2 = `In my professional experience, ${clauseLower}. I have developed strong expertise in ${skillList}, enabling me to deliver scalable and maintainable solutions${kwPhrase ? ` — directly aligned with the ${kwPhrase} focus of this role` : ""}. I thrive in ${tone}-paced, collaborative environments and consistently drive results that align with business goals.`;
  } else if (expFirstClause) {
    const clauseLower = expFirstClause.charAt(0).toLowerCase() + expFirstClause.slice(1);
    para2 = `In my professional experience, ${clauseLower}. I bring a ${tone} communication style and a proven track record of delivering on time, collaborating across teams, and solving complex problems${kwPhrase ? ` — particularly around ${kwPhrase}` : ""}.`;
  } else if (skillList) {
    para2 = `I bring proven expertise in ${skillList}. I am known for writing clean, reliable solutions, working effectively with cross-functional teams, and delivering on schedule.${kwPhrase ? ` The emphasis on ${kwPhrase} in this role closely aligns with my day-to-day experience.` : " I am highly motivated to apply these skills in a fast-paced, impact-driven environment."}`;
  } else {
    para2 = `I bring a ${tone} communication style, a strong work ethic, and a track record of solving complex problems and delivering results. I am highly adaptable and eager to contribute from day one at ${company}.`;
  }

  // ── Paragraph 3: Closing ─────────────────────────────────────────────────
  const para3 = `I am genuinely excited about the opportunity to join ${company} and contribute to your ${role} team. I would welcome the chance to discuss how my experience and skills align with your needs. Thank you sincerely for your time and consideration — I look forward to hearing from you.`;

  return [para1, para2, para3].join("\n\n");
}

function buildLetterObject(form, generatedText) {
  const paragraphs = generatedText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return {
    name: form.name, title: form.role, company: form.company,
    manager: form.manager || "Hiring Manager",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    location: form.location, phone: form.phone, email: form.email,
    linkedin: form.linkedin, companyLocation: "",
    paragraphs,
  };
}

function canExport(letter) {
  return Boolean((letter?.name || "").trim() && (letter?.email || "").trim());
}

function extractKeywords(text) {
  return [...new Set((text || "").match(/[A-Za-z][A-Za-z+#./-]{3,}/g) ?? [])]
    .filter((w) => !["with","that","this","role","will","your","from","have","work","team"].includes(w.toLowerCase()));
}

function toPlainText(letter) {
  return [
    `${letter.name}\n${letter.title}\n${letter.location} | ${letter.phone} | ${letter.email}`,
    `${letter.date}\n${letter.manager}\n${letter.company}`,
    `Dear ${letter.manager},`,
    ...(letter.paragraphs || []),
    `Sincerely,\n${letter.name}`,
  ].join("\n\n");
}
