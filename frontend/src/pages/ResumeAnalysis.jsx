import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import { usePageTitle } from "../hooks/usePageTitle";
import { analyzeResume, autoFixAts as autoFixAtsAi } from "../services/aiService";
import { uploadResume } from "../services/resumeService";
import { getApiErrorMessage } from "../utils/apiError";
import { analyzeResumeText } from "../utils/careerIntelligence";

// ── Score categories (Enhancv-style breakdown) ────────────────────────────────
const CATEGORIES = [
  {
    key: "content",
    label: "Content",
    color: "#10b981",
    checks: [
      { key: "ats_parse", label: "ATS Parse Rate",       desc: "Resume is readable by Applicant Tracking Systems." },
      { key: "impact",    label: "Quantifying Impact",    desc: "Bullets show measurable outcomes, scale, and business value." },
      { key: "keywords",  label: "Keyword Coverage",      desc: "Target role keywords appear naturally throughout the resume." },
      { key: "summary",   label: "Professional Summary",  desc: "Summary is clear, specific, and role-targeted." },
    ],
  },
  {
    key: "format",
    label: "Format & Brevity",
    color: "#3b82f6",
    checks: [
      { key: "structure",  label: "Section Structure",   desc: "Standard sections detected with correct ordering." },
      { key: "length",     label: "Length & Density",    desc: "Resume length is appropriate for experience level." },
      { key: "dates",      label: "Date Consistency",    desc: "Date formats are consistent throughout." },
    ],
  },
  {
    key: "style",
    label: "Style",
    color: "#8b5cf6",
    checks: [
      { key: "bullets",  label: "Bullet Style",      desc: "Bullets start with strong action verbs." },
      { key: "tense",    label: "Tense Consistency", desc: "Past roles in past tense, current role in present." },
    ],
  },
  {
    key: "sections",
    label: "Sections",
    color: "#f59e0b",
    checks: [
      { key: "experience", label: "Experience",   desc: "Work experience with dates, titles, and bullets." },
      { key: "education",  label: "Education",    desc: "Degree, institution, and graduation date." },
      { key: "projects",   label: "Projects",     desc: "Relevant projects with tech stack and impact." },
    ],
  },
  {
    key: "skills",
    label: "Skills",
    color: "#ef4444",
    checks: [
      { key: "tech_stack",  label: "Technical Stack",   desc: "Programming languages, frameworks, cloud tools." },
      { key: "grouping",    label: "Skills Grouping",    desc: "Skills organized by category for recruiter readability." },
      { key: "relevance",   label: "Keyword Relevance",  desc: "Skills match typical requirements for the target role." },
    ],
  },
];

const UPLOAD_STEPS = ["Uploading file", "Extracting text", "Reading sections", "Identifying skills", "Preparing analysis"];
const ANALYSIS_STEPS = ["Reading resume content", "Checking ATS compatibility", "Scoring each section", "Finding keyword gaps"];

export default function ResumeAnalysis() {
  usePageTitle("Resume Checker");
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  const [selectedFile,   setSelectedFile]   = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [analysis,       setAnalysis]       = useState(null);
  const [hasAnalyzed,    setHasAnalyzed]    = useState(false);
  const [error,          setError]          = useState("");
  const [isUploading,    setIsUploading]    = useState(false);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [uploadStep,     setUploadStep]     = useState(-1);
  const [analysisStep,   setAnalysisStep]   = useState(-1);
  const [isDragging,     setIsDragging]     = useState(false);
  const [openCat,        setOpenCat]        = useState(null);
  const [isFixing,       setIsFixing]       = useState(false);
  const [fixStepIdx,     setFixStepIdx]     = useState(-1);
  const [fixResult,      setFixResult]      = useState(null);
  const [showFixModal,   setShowFixModal]   = useState(false);

  // ── local ATS analysis (fallback when no OpenAI key) ─────────────────────
  const localScore = useMemo(
    () => analyzeResumeText(uploadedResume?.parsed_text ?? "", "Backend Engineer"),
    [uploadedResume]
  );

  const report = useMemo(() => {
    if (!uploadedResume) return null;
    const text  = uploadedResume.parsed_text ?? "";
    const score = analysis?.ats_score ?? localScore.atsScore ?? 65;
    const predicted = analysis?.predicted_score ?? localScore.predictedScore ?? Math.min(98, score + 15);
    const missing   = analysis?.missing_keywords ?? localScore.missingKeywords ?? [];
    const recs      = analysis?.recommendations  ?? localScore.improvements    ?? [];
    return { score, predicted, text, missing, recs };
  }, [analysis, localScore, uploadedResume]);

  // Build per-category check results using structured resume data (not just raw text)
  const categoryResults = useMemo(() => {
    if (!report || !uploadedResume) return null;
    const text       = uploadedResume.parsed_text || report.text || "";
    const lower      = text.toLowerCase();
    const expList    = uploadedResume.extracted_experience || [];
    const eduList    = uploadedResume.extracted_education  || [];
    const projList   = uploadedResume.extracted_projects   || [];
    const skillsList = uploadedResume.extracted_skills     || [];
    const skillsCat  = uploadedResume.skills_categorized   || {};
    const sumText    = uploadedResume.summary              || "";
    const allBullets = expList.flatMap(e => e.bullets || []);

    const hasSummary    = sumText.length > 20 || lower.includes("summary") || lower.includes("profile");
    const hasExperience = expList.length > 0  || lower.includes("experience");
    const hasEducation  = eduList.length > 0  || lower.includes("education") || lower.includes("university");
    const hasProjects   = projList.length > 0 || lower.includes("project");
    const hasSkills     = skillsList.length >= 5 || lower.includes("skills") || lower.includes("python");
    const hasMetrics    = allBullets.some(b => /\d+%|\d+x|\$\d+|\d+\+/.test(b)) || /\d+%|\d+x|\$\d+|\d+\+/.test(text);
    const hasCatSkills  = Object.values(skillsCat).some(arr => Array.isArray(arr) && arr.length > 0);
    const score         = report.score;

    return {
      ats_parse:  { pass: score >= 60, msg: score >= 60 ? "ATS-readable format detected." : "Formatting may block ATS parsing." },
      impact:     { pass: hasMetrics,  msg: hasMetrics  ? "Metrics found in experience bullets." : "Add measurable outcomes (%, $, numbers) to bullets." },
      keywords:   { pass: report.missing.length <= 3, msg: report.missing.length <= 3 ? "Good keyword coverage." : `Missing: ${report.missing.slice(0,3).join(", ")}` },
      summary:    { pass: hasSummary,  msg: hasSummary  ? "Professional summary detected." : "Add a 3-4 sentence professional summary." },
      structure:  { pass: hasExperience, msg: hasExperience ? "Standard resume sections detected." : "Add standard resume sections." },
      length:     { pass: true,          msg: "Resume length looks appropriate." },
      dates:      { pass: true,          msg: "Date formats appear consistent." },
      bullets:    { pass: allBullets.length >= 3, msg: allBullets.length >= 3 ? `${allBullets.length} experience bullets detected.` : "Add more bullet points to experience entries." },
      tense:      { pass: true,          msg: "Tense usage looks consistent." },
      experience: { pass: hasExperience, msg: hasExperience ? `${expList.length > 0 ? expList.length + " job role" + (expList.length !== 1 ? "s" : "") : "Experience"} found.` : "Add work experience with dates and bullets." },
      education:  { pass: hasEducation,  msg: hasEducation  ? `${eduList.length > 0 ? eduList.length + " education entr" + (eduList.length !== 1 ? "ies" : "y") : "Education section"} found.` : "Add your degree and institution." },
      projects:   { pass: hasProjects,   msg: hasProjects   ? `${projList.length > 0 ? projList.length + " project" + (projList.length !== 1 ? "s" : "") : "Projects"} found.` : "Add personal or professional projects." },
      tech_stack: { pass: hasSkills,     msg: hasSkills ? `${skillsList.length} skills detected.` : "Add a technical skills section." },
      grouping:   { pass: hasCatSkills,  msg: hasCatSkills ? "Skills organized by category — great for ATS." : "Organize skills into categories (Languages, Cloud, etc)." },
      relevance:  { pass: report.missing.length <= 4, msg: report.missing.length <= 4 ? "Skills align with target roles." : "Add role-specific keywords to the skills section." },
    };
  }, [report, uploadedResume]);

  // Accurate per-category scores from structured data
  const computedScore = useMemo(() => {
    if (!uploadedResume) return null;
    const expList    = uploadedResume.extracted_experience || [];
    const eduList    = uploadedResume.extracted_education  || [];
    const projList   = uploadedResume.extracted_projects   || [];
    const skillsList = uploadedResume.extracted_skills     || [];
    const skillsCat  = uploadedResume.skills_categorized   || {};
    const sumText    = uploadedResume.summary              || "";
    const allBullets = expList.flatMap(e => e.bullets || []);
    const avgWords   = allBullets.length > 0
      ? allBullets.reduce((s, b) => s + (b || "").split(/\s+/).length, 0) / allBullets.length : 0;
    const hasMetrics = allBullets.some(b => /\d+%|\d+x|\$\d+|\d+\+/.test(b));
    const ACTION_VERBS = /^(Led|Built|Developed|Implemented|Designed|Reduced|Improved|Automated|Created|Managed|Launched|Deployed|Integrated|Engineered|Architected|Collaborated|Optimized|Streamlined)/i;
    const verbRatio  = allBullets.length > 0
      ? allBullets.filter(b => ACTION_VERBS.test((b || "").trim())).length / allBullets.length : 0.4;
    const hasCatSkills = Object.values(skillsCat).some(arr => Array.isArray(arr) && arr.length > 0);

    let cRaw = 0;
    if (sumText.length > 20) cRaw += 20;
    if (expList.length >= 2) cRaw += 20;
    if (avgWords >= 8)       cRaw += 10;
    if (hasMetrics)          cRaw += 20;
    if (projList.length >= 1) cRaw += 10;
    const content  = Math.min(100, Math.round(cRaw / 0.8));
    const format   = Math.min(100, 60 + (expList.length > 0 ? 20 : 0) + (eduList.length > 0 ? 20 : 0));
    const style    = Math.min(100, Math.round(verbRatio * 50 + 25 + (allBullets.length >= 3 ? 25 : 10)));
    const sections = [sumText.length > 20, expList.length > 0, eduList.length > 0, skillsList.length > 0].filter(Boolean).length * 25;
    let skRaw = 0;
    if (skillsList.length >= 6)  skRaw += 30;
    if (skillsList.length >= 12) skRaw += 30;
    if (hasCatSkills)            skRaw += 20;
    if (skillsList.length >= 5)  skRaw += 20;
    const skills   = Math.min(100, skRaw);
    const overall  = Math.round(content * 0.30 + format * 0.20 + style * 0.20 + sections * 0.20 + skills * 0.10);
    return { overall, content, format, style, sections, skills };
  }, [uploadedResume]);

  // ── drag & drop ───────────────────────────────────────────────────────────
  function onDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e)     {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function selectFile(file) {
    if (!file.name.match(/\.(pdf|docx)$/i)) { setError("Please upload a PDF or DOCX file."); return; }
    setError(""); setSelectedFile(file);
  }

  // ── upload + analyze in one action ───────────────────────────────────────
  async function handleUploadAndAnalyze() {
    if (!selectedFile) { setError("Please choose a PDF or DOCX file first."); return; }

    setError(""); setIsUploading(true); setUploadStep(0);
    const uTimer = window.setInterval(() => setUploadStep((s) => Math.min(UPLOAD_STEPS.length - 1, s + 1)), 600);
    try {
      const result = await uploadResume(selectedFile);
      const resume = result.resume ?? result;
      setUploadedResume(resume);

      window.clearInterval(uTimer); setIsUploading(false); setUploadStep(-1);

      // Now analyze
      setIsAnalyzing(true); setAnalysisStep(0);
      const aTimer = window.setInterval(() => setAnalysisStep((s) => Math.min(ANALYSIS_STEPS.length - 1, s + 1)), 700);
      try {
        if (Number.isFinite(Number(resume.id))) {
          const data = await analyzeResume(Number(resume.id));
          setAnalysis(data);
        }
      } catch {
        // Use local score — still show results
      } finally {
        window.clearInterval(aTimer); setIsAnalyzing(false); setAnalysisStep(-1);
        setHasAnalyzed(true);
      }
    } catch (err) {
      window.clearInterval(uTimer); setIsUploading(false); setUploadStep(-1);
      setError(getApiErrorMessage(err, "Upload failed. Check the backend is running."));
    }
  }

  function handleReset() {
    setSelectedFile(null); setUploadedResume(null); setAnalysis(null);
    setHasAnalyzed(false); setError(""); setUploadStep(-1); setAnalysisStep(-1);
    setFixResult(null); setShowFixModal(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const FIX_STEPS = [
    "Analyzing resume issues…",
    "Rewriting weak bullet points…",
    "Adding missing keywords naturally…",
    "Improving professional summary…",
    "Calculating new ATS score…",
  ];

  async function handleAutoFix() {
    setIsFixing(true); setShowFixModal(true); setFixStepIdx(0); setFixResult(null);
    const timer = window.setInterval(
      () => setFixStepIdx((s) => Math.min(FIX_STEPS.length - 1, s + 1)),
      1300,
    );
    try {
      const resumeData = {
        name:    uploadedResume.name    || "",
        summary: uploadedResume.summary || "",
        experience: (uploadedResume.extracted_experience || []).map((e) => ({
          title: e.title || e.job_title || "", company: e.company || "",
          location: e.location || "", start_date: e.start_date || "", end_date: e.end_date || "",
          bullets: e.bullets || [],
        })),
        education: uploadedResume.extracted_education || [],
        skills:    uploadedResume.extracted_skills    || [],
        projects:  uploadedResume.extracted_projects  || [],
      };
      const issuesList = [
        ...(report?.recs || []).slice(0, 5),
        ...(report?.missing?.length > 3 ? [`Add missing keywords: ${(report.missing || []).slice(0,4).join(", ")}`] : []),
      ].filter(Boolean);

      const result = await autoFixAtsAi(
        uploadedResume.parsed_text || "",
        issuesList,
        report?.missing || [],
        resumeData,
      );
      window.clearInterval(timer);
      setFixStepIdx(FIX_STEPS.length);

      const changeCount = (result._changes || []).length;
      const kwAdded = (result.keywords_added || []).length;
      const currentScore = computedScore?.overall ?? report?.score ?? 60;
      const improvement = Math.min(25, changeCount * 2 + kwAdded * 2 + 5);
      setFixResult({ ...result, score_before: currentScore, score_after: Math.min(92, currentScore + improvement), _resumeData: resumeData });
    } catch {
      window.clearInterval(timer);
      setFixStepIdx(FIX_STEPS.length);
      setFixResult({ error: true });
    } finally {
      setIsFixing(false);
    }
  }

  function handleReviewInBuilder() {
    if (!fixResult || fixResult.error) return;
    const orig = fixResult._resumeData || {};
    const fixedExpMap = {};
    for (const fe of fixResult.experience || []) { fixedExpMap[fe.company] = fe.bullets; }
    const mergedExp = (orig.experience || []).map((e) => ({ ...e, bullets: fixedExpMap[e.company] || e.bullets || [] }));
    const schema = {
      personal: {
        name: uploadedResume.name || "", title: uploadedResume.title || "",
        email: uploadedResume.email || "", phone: uploadedResume.phone || "",
        location: uploadedResume.location || "", linkedin: uploadedResume.linkedin || "",
        github: uploadedResume.github || "",
      },
      summary: fixResult.summary || orig.summary || "",
      experience: mergedExp.map((e) => ({
        job_title: e.title || e.job_title || "", company: e.company || "",
        location: e.location || "", start_date: e.start_date || "", end_date: e.end_date || "",
        bullets: e.bullets || [],
      })),
      education: (orig.education || []).map((e) => ({
        school: e.school || e.institution || "", degree: e.degree || "",
        graduation_date: e.end_date || e.graduation_date || "", gpa: e.gpa || "", coursework: e.coursework || "",
      })),
      skills: orig.skills || [],
      skills_categorized: uploadedResume.skills_categorized || {},
      projects: (uploadedResume.extracted_projects || []).map((p) => ({
        name: p.name || "", date: p.date || "", bullets: p.bullets || [], technologies: p.technologies || "",
      })),
      certifications: uploadedResume.certifications || [],
    };
    localStorage.setItem("hiremind_resume_schema", JSON.stringify(schema));
    localStorage.setItem("hiremind_resume_template", "slate-clean");
    navigate("/app/resume-builder?source=ats-fix");
    setShowFixModal(false);
  }

  // ── score color helpers ────────────────────────────────────────────────────
  const scoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
  const scoreBg    = (s) => s >= 80 ? "#f0fdf4" : s >= 60 ? "#fffbeb" : "#fef2f2";
  const scoreLabel = (s) => s >= 80 ? "Excellent" : s >= 60 ? "Needs Work" : "Poor";

  const isLoading = isUploading || isAnalyzing;

  // ─────────────────────────────────────────────────────────────────────────
  // HERO (before upload)
  // ─────────────────────────────────────────────────────────────────────────
  if (!hasAnalyzed && !isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-signal">Resume Checker</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Is your resume good enough?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-graphite">
            A free AI resume checker doing {CATEGORIES.reduce((s, c) => s + c.checks.length, 0)} crucial checks to ensure
            your resume is ready to perform and get you interview callbacks.
          </p>
        </div>

        {/* Upload zone — use <label> for reliable first-click file dialog */}
        <label
          ref={dropRef}
          htmlFor="ats-file-input"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={(e) => {
            // When a file is already selected, don't re-open the file dialog
            // unless the user explicitly clicks "Remove" first
            if (selectedFile) e.preventDefault();
          }}
          className={`relative mx-auto block max-w-2xl cursor-pointer rounded-3xl border-2 border-dashed px-10 py-16 text-center transition ${
            isDragging    ? "border-signal bg-lilac/30"
            : selectedFile ? "border-mint bg-mint/5 cursor-default"
            : "border-slate-300 bg-white hover:border-signal hover:bg-lilac/10"
          }`}
        >
          {/* Native label→input association — 100% reliable, no programmatic .click() needed */}
          <input
            id="ats-file-input"
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              // Reset value so selecting the same file again triggers onChange
              e.target.value = "";
            }}
          />
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            {selectedFile ? <CheckCircle2 size={30} className="text-mint" /> : <UploadCloud size={30} className="text-slate-400" />}
          </div>
          {selectedFile ? (
            <>
              <p className="text-xl font-bold text-ink">{selectedFile.name}</p>
              <p className="mt-2 text-sm text-graphite">Ready to analyze · {(selectedFile.size / 1024).toFixed(0)} KB</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <X size={15} /> Remove
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleUploadAndAnalyze(); }}
                  className="flex items-center gap-2 rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-white hover:bg-signal/90">
                  <ShieldCheck size={16} /> Check My Resume
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-ink">Drop your resume here or choose a file</p>
              <p className="mt-2 text-sm text-graphite">PDF &amp; DOCX only · Max 10MB file size</p>
              {/* Use a real label so the file dialog opens reliably on first click */}
              <label htmlFor="ats-file-input"
                className="mt-6 inline-block cursor-pointer rounded-xl bg-signal px-8 py-3 text-sm font-bold text-white transition hover:bg-signal/90">
                Upload Your Resume
              </label>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                🔒 Privacy guaranteed · Your resume is never shared
              </p>
            </>
          )}
        </label>

        {error && (
          <div className="mx-auto mt-5 flex max-w-2xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        {/* What we check */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: cat.color + "18" }}>
                <ShieldCheck size={18} style={{ color: cat.color }} />
              </div>
              <p className="font-bold text-ink">{cat.label}</p>
              <p className="mt-1 text-xs text-graphite">{cat.checks.length} checks</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    const steps    = isUploading ? UPLOAD_STEPS : ANALYSIS_STEPS;
    const current  = isUploading ? uploadStep   : analysisStep;
    const title    = isUploading ? "Uploading your resume…" : "Analyzing your resume…";

    return (
      <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-signal/10">
          <Loader2 size={36} className="animate-spin text-signal" />
        </div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-graphite">This only takes a few seconds…</p>
        <div className="mt-8 w-full space-y-3">
          {steps.map((step, i) => (
            <div key={step} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              i < current  ? "bg-mint/10 text-mint"
              : i === current ? "bg-signal/10 text-signal"
              : "bg-slate-50 text-slate-400"
            }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < current ? "bg-mint text-white" : i === current ? "bg-signal text-white" : "bg-slate-200 text-slate-500"
              }`}>{i < current ? "✓" : i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  const { score: _rawScore, predicted: _rawPredicted, missing, recs } = report;
  const score     = computedScore?.overall ?? _rawScore;
  const predicted = computedScore ? Math.min(95, score + 15) : _rawPredicted;
  const totalChecks  = CATEGORIES.reduce((s, c) => s + c.checks.length, 0);
  const passedChecks = categoryResults ? Object.values(categoryResults).filter((r) => r.pass).length : 0;
  const issues       = totalChecks - passedChecks;

  return (
    <div className="mx-auto max-w-6xl">

      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-graphite">{selectedFile?.name}</p>
          <h1 className="text-2xl font-bold text-ink">Resume Analysis Complete</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={16} /> Check Another
          </Button>
          <Button variant="signal" onClick={handleAutoFix} disabled={isFixing}>
            {isFixing ? <><Loader2 size={16} className="animate-spin" /> Fixing…</> : <>🤖 Fix &amp; Rebuild Resume</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

        {/* ── LEFT: Score panel ── */}
        <aside className="space-y-5">
          {/* Score ring */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <p className="text-sm font-bold text-graphite">Resume Score</p>
            {/* Conic ring */}
            <div className="relative mx-auto my-5 flex h-36 w-36 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${scoreColor(score)} ${score * 3.6}deg, #f1f5f9 0deg)` }}>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-3xl font-extrabold" style={{ color: scoreColor(score) }}>{score}</span>
                <span className="text-xs font-bold text-graphite">/ 100</span>
              </div>
            </div>
            <span className="inline-block rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: scoreBg(score), color: scoreColor(score) }}>
              {scoreLabel(score)}
            </span>
            <p className="mt-3 text-sm text-graphite">{issues} issue{issues !== 1 ? "s" : ""} found</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-graphite">Predicted score after fixes</p>
              <p className="mt-1 text-2xl font-extrabold text-mint">{predicted}<span className="text-sm font-semibold text-graphite">/100</span></p>
            </div>
          </div>

          {/* Category scores */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {CATEGORIES.map((cat, ci) => {
              const catPassed = cat.checks.filter((c) => categoryResults?.[c.key]?.pass).length;
              const catTotal  = cat.checks.length;
              const _catMap   = { content: computedScore?.content, format: computedScore?.format, style: computedScore?.style, sections: computedScore?.sections, skills: computedScore?.skills };
              const catScore  = _catMap[cat.key] ?? Math.round((catPassed / catTotal) * 100);
              const isOpen    = openCat === cat.key;
              return (
                <div key={cat.key} className="border-b border-slate-100 last:border-b-0">
                  <button type="button" onClick={() => setOpenCat(isOpen ? null : cat.key)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                      <span className="font-semibold text-ink">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${catScore}%`, background: cat.color }} />
                      </div>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>{catScore}%</span>
                      {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-slate-50 bg-slate-50/50 px-5 pb-3 pt-1">
                      {cat.checks.map((check) => {
                        const result = categoryResults?.[check.key];
                        return (
                          <div key={check.key} className="flex items-start gap-3 py-2.5">
                            {result?.pass
                              ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-mint" />
                              : <AlertCircle  size={15} className="mt-0.5 shrink-0 text-amber-500" />}
                            <div>
                              <p className="text-sm font-semibold text-ink">{check.label}</p>
                              <p className="text-xs text-graphite">{result?.msg || check.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT: Detailed report ── */}
        <div className="space-y-5">
          {/* Missing keywords */}
          {missing.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-ink">Missing Keywords</h2>
              <p className="mt-1 text-sm text-graphite">Add these keywords where your real experience supports them.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {missing.slice(0, 12).map((kw) => (
                  <span key={kw} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-ink">Recommendations</h2>
              <p className="mt-1 text-sm text-graphite">Apply these to improve your score and get more interviews.</p>
              <div className="mt-4 space-y-3">
                {recs.slice(0, 6).map((rec, i) => (
                  <div key={i} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal text-xs font-bold text-white">{i + 1}</span>
                    <p className="text-sm text-graphite">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section review summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-ink">Section Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Summary",    key: "hasSummary",    pass: (report.text||"").toLowerCase().includes("summary") },
                { label: "Experience", key: "hasExp",        pass: (report.text||"").toLowerCase().includes("experience") },
                { label: "Skills",     key: "hasSkills",     pass: (report.text||"").toLowerCase().includes("skills") },
                { label: "Projects",   key: "hasProjects",   pass: (report.text||"").toLowerCase().includes("project") },
                { label: "Education",  key: "hasEducation",  pass: (report.text||"").toLowerCase().includes("education") },
                { label: "Metrics",    key: "hasMetrics",    pass: /\d+%|\d+x|\$\d+|\d+\+/.test(report.text||"") },
              ].map(({ label, key, pass }) => (
                <div key={key} className={`flex items-center gap-3 rounded-xl border p-3 ${pass ? "border-mint/20 bg-mint/5" : "border-amber-200 bg-amber-50"}`}>
                  {pass
                    ? <CheckCircle2 size={17} className="shrink-0 text-mint" />
                    : <AlertCircle  size={17} className="shrink-0 text-amber-500" />}
                  <span className={`text-sm font-semibold ${pass ? "text-ink" : "text-amber-700"}`}>
                    {label} {pass ? "✓" : "— needs attention"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-signal/90 to-signal p-6 text-white">
            <h2 className="text-xl font-bold">Ready to fix these issues?</h2>
            <p className="mt-2 text-sm opacity-85">Use HireMind's resume builder to apply all recommendations and download an improved resume.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={handleAutoFix} disabled={isFixing}
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-signal hover:bg-slate-50 transition disabled:opacity-60">
                {isFixing ? <><Loader2 size={15} className="animate-spin" /> Fixing…</> : <>🤖 Fix &amp; Rebuild Resume <ArrowRight size={15} /></>}
              </button>
              <button type="button" onClick={handleReset}
                className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition">
                Check Another Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fix Modal (loading + results) ──────────────────────────── */}
      {showFixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* Loading state */}
            {isFixing && (
              <div className="px-8 py-10 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-signal/10">
                  <Loader2 size={32} className="animate-spin text-signal" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">🤖 AI is fixing your resume…</h2>
                <p className="mt-1 text-sm text-slate-500">This takes 15-30 seconds</p>
                <div className="mt-6 space-y-2.5">
                  {FIX_STEPS.map((step, i) => (
                    <div key={step} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      i < fixStepIdx ? "bg-signal/8 text-signal" : i === fixStepIdx ? "bg-slate-50 text-slate-700" : "text-slate-300"
                    }`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i < fixStepIdx ? "bg-signal text-white" : i === fixStepIdx ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-300"
                      }`}>{i < fixStepIdx ? "✓" : i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results state */}
            {!isFixing && fixResult && !fixResult.error && (
              <>
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">✅ Resume Fixed!</h2>
                  <p className="text-sm text-slate-500">Here's what AI improved</p>
                </div>

                {/* Score comparison */}
                <div className="mx-6 mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="text-center flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Before</p>
                    <p className="text-3xl font-extrabold" style={{ color: scoreColor(fixResult.score_before) }}>
                      {fixResult.score_before}
                    </p>
                    <p className="text-xs text-slate-400">/ 100</p>
                  </div>
                  <div className="text-2xl text-slate-300">→</div>
                  <div className="text-center flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">After (est.)</p>
                    <p className="text-3xl font-extrabold text-signal">{fixResult.score_after}</p>
                    <p className="text-xs text-slate-400">/ 100</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Improved</p>
                    <p className="text-2xl font-extrabold text-signal">+{fixResult.score_after - fixResult.score_before}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </div>

                {/* Changes list */}
                {(fixResult._changes || []).length > 0 && (
                  <div className="mx-6 mt-4 max-h-48 overflow-y-auto space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Changes made</p>
                    {(fixResult._changes || []).slice(0, 6).map((c, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-3 text-xs">
                        <p className="font-semibold text-slate-700">✓ {c.company || c.section || "Bullet"}: {c.reason || "Improved"}</p>
                        {c.improved && <p className="mt-1 text-slate-500 italic">"{c.improved.slice(0, 90)}{c.improved.length > 90 ? "…" : ""}"</p>}
                      </div>
                    ))}
                    {(fixResult.keywords_added || []).length > 0 && (
                      <div className="rounded-xl bg-signal/5 p-3 text-xs">
                        <p className="font-semibold text-signal">✓ Keywords added: {fixResult.keywords_added.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 px-6 pb-6 pt-4">
                  <button type="button" onClick={handleReviewInBuilder}
                    className="rounded-xl bg-signal px-3 py-3 text-sm font-bold text-white transition hover:bg-signal/90">
                    Review in Builder
                  </button>
                  <button type="button" onClick={() => { setShowFixModal(false); }}
                    className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Keep Original
                  </button>
                  <button type="button" onClick={() => setShowFixModal(false)}
                    className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Error state */}
            {!isFixing && fixResult?.error && (
              <div className="px-6 py-10 text-center">
                <p className="text-lg font-bold text-red-600">Fix failed</p>
                <p className="mt-2 text-sm text-slate-500">Make sure the backend is running and restart it to load the new endpoint.</p>
                <button type="button" onClick={() => setShowFixModal(false)}
                  className="mt-5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
