import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

import Button from "./Button";
import { CoverLetterTemplate, coverLetterTemplateOptions } from "./CoverLetterTemplateEngine";
import { NiaAvatar, ScoreCard } from "./PremiumUI";
import { renderResumeHTML, SAMPLE_PERSON } from "./ResumeTemplateRenderer";

// ─── AiAvatarIntro ────────────────────────────────────────────────────────────
// Used by: ResumeExpert, ResumeAnalysis, CoverLetterExpert, JobMatch
// Props: title (ReactNode), subtitle (string), panel (ReactNode), avatarRole (string)

export function AiAvatarIntro({ title, subtitle, panel, avatarRole = "Your AI Resume Expert" }) {
  return (
    <section className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[160px_1fr] lg:items-center">
        <NiaAvatar size="sm" subtitle={avatarRole} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">{subtitle}</p>
        </div>
      </div>
      {panel && <div className="mt-6">{panel}</div>}
    </section>
  );
}

// ─── StepperFlow ─────────────────────────────────────────────────────────────
// Used by: ResumeExpert, CoverLetterExpert
// Props: steps (string[]), activeStep (number)

export function StepperFlow({ steps, activeStep }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
              index <= activeStep
                ? "bg-gradient-to-br from-mint to-signal text-white shadow-sm"
                : "bg-slate-100 text-graphite"
            }`}
          >
            {index < activeStep ? <CheckCircle2 size={16} /> : index + 1}
          </span>
          <span
            className={`hidden text-sm font-semibold md:block ${
              index <= activeStep ? "text-ink" : "text-graphite"
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <ChevronRight size={16} className="hidden text-line xl:block" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── LoadingProgress ─────────────────────────────────────────────────────────
// Used by: ResumeExpert, CoverLetterExpert, JobMatch
// Props: steps (string[]), activeStep (number)

export function LoadingProgress({ steps, activeStep }) {
  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal text-white">
          <Loader2 size={17} className="animate-spin" aria-hidden="true" />
        </span>
        <p className="font-bold text-ink">Processing… please keep this page open.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-xl border p-3 text-sm font-bold transition ${
              index <= activeStep
                ? "border-signal/30 bg-lilac text-ink"
                : "border-line bg-slate-50 text-graphite"
            }`}
          >
            <span
              className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                index < activeStep
                  ? "bg-mint text-white"
                  : index === activeStep
                  ? "bg-signal text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {index < activeStep ? "✓" : index + 1}
            </span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ResumeDocumentPreview ────────────────────────────────────────────────────
// Used by: Home, ResumeExpert (step 2 + step 3), JobMatch (optimized preview)
// Props: template (template object OR resume-with-template-id), resume (form resume), mode ("card"|"builder")

// Scale factor keeps iframe width == container width: 1/0.325 ≈ 307%
// Full A4 page at 96 DPI = 1122px tall. At scale 0.325 → 365px visible.
const PREVIEW_SCALE = 0.325;
const A4_HEIGHT_PX = 1122;
const FULL_PAGE_HEIGHT = Math.round(A4_HEIGHT_PX * PREVIEW_SCALE); // 365

export function ResumeDocumentPreview({ template, resume, mode = "card" }) {
  if (!template) return null;

  const templateId = template?.id ?? template;
  // card: thumbnail showing top portion; builder: full page height
  const containerHeight = mode === "card" ? 280 : FULL_PAGE_HEIGHT;
  const iframeHeight = Math.ceil(containerHeight / PREVIEW_SCALE);

  let person = SAMPLE_PERSON;
  if (resume && resume.candidate) {
    person = buildPersonFromResume(resume) ?? SAMPLE_PERSON;
  } else if (!resume && template?.candidate) {
    person = buildPersonFromResume(template) ?? SAMPLE_PERSON;
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ height: containerHeight, background: "#ffffff" }}
    >
      <iframe
        srcDoc={renderResumeHTML(person, templateId)}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "307%",
          height: `${iframeHeight}px`,
          border: "none",
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left"
        }}
        title={template?.name ?? "Resume Preview"}
      />
    </div>
  );
}

function buildPersonFromResume(resumeData) {
  if (!resumeData?.candidate) return null;
  return {
    name: resumeData.candidate,
    title: resumeData.title ?? "",
    email: resumeData.contact?.email ?? "",
    phone: resumeData.contact?.phone ?? "",
    location: resumeData.contact?.location ?? "",
    linkedin: resumeData.contact?.linkedin ?? "",
    website: resumeData.contact?.website ?? "",
    summary: resumeData.summary ?? "",
    experience: (resumeData.experience ?? []).filter(Boolean).map((exp) => ({
      title: exp.role ?? exp.title ?? "",
      company: exp.company ?? "",
      location: exp.location ?? "",
      start: parseDatePart(exp.date ?? exp.start ?? "", 0),
      end: parseDatePart(exp.date ?? "", 1) || exp.end || "Present",
      bullets: exp.bullets ?? []
    })),
    education: (resumeData.education ?? []).filter(Boolean).map((edu) =>
      typeof edu === "string"
        ? { degree: edu, school: "", year: "", gpa: "", honors: "" }
        : { degree: edu.degree ?? edu.title ?? "", school: edu.school ?? "", year: edu.year ?? "", gpa: edu.gpa ?? "", honors: edu.honors ?? "" }
    ),
    skills: resumeData.skills ?? [],
    projects: (resumeData.projects ?? []).filter(Boolean).map((proj) =>
      typeof proj === "string"
        ? { name: proj.split(":")[0]?.trim() || proj, tech: "", description: proj }
        : { name: proj.name ?? "", tech: proj.tech ?? "", description: proj.description ?? "" }
    ),
    certifications: resumeData.certifications ?? []
  };
}

function parseDatePart(dateStr, index) {
  if (!dateStr) return "";
  const parts = dateStr.split(/\s*[-–—]\s*|\s+to\s+/i);
  return parts[index]?.trim() ?? "";
}

// ─── TemplatePreviewModal ─────────────────────────────────────────────────────

export function TemplatePreviewModal({ template, onClose }) {
  if (!template) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{template.name}</h2>
            <p className="text-slate-500 text-sm">ATS Score: {template.atsScore}/100</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sessionStorage.setItem("selectedTemplateId", template.id);
                window.location.href = "/app/resume-expert";
              }}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: template.accent || "#0f172a" }}
            >
              Use Template →
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div className="bg-white shadow-xl rounded-xl overflow-hidden max-w-3xl mx-auto">
            <iframe
              srcDoc={renderResumeHTML(SAMPLE_PERSON, template.id)}
              className="w-full"
              style={{ height: 900, border: "none" }}
              title="Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ResumeCheckerReport ──────────────────────────────────────────────────────
// Used by: ResumeAnalysis
// Props: resume, score, predictedScore, scoreExplanation, missingKeywords,
//        matchedKeywords, recommendations, scoreBreakdown, issues, sectionReviews,
//        onBuildFromRecommendations

export function ResumeCheckerReport({
  resume,
  score = 65,
  predictedScore = 85,
  scoreExplanation = "",
  missingKeywords = [],
  matchedKeywords = [],
  recommendations = [],
  scoreBreakdown = [],
  issues = [],
  sectionReviews = [],
  onBuildFromRecommendations
}) {
  return (
    <div className="space-y-6">
      <ScoreOverview
        score={score}
        predictedScore={predictedScore}
        scoreExplanation={scoreExplanation}
        resume={resume}
      />

      {scoreBreakdown.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Score Breakdown</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {scoreBreakdown.map((item) => (
              <ScoreCard
                key={item.title}
                title={item.title}
                score={item.score}
                status={item.status}
                tone={item.score >= 80 ? "mint" : item.score >= 65 ? "warning" : "danger"}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <KeywordPanel title="Matched Keywords" items={matchedKeywords} tone="mint" />
        <KeywordPanel title="Missing Keywords" items={missingKeywords} tone="amber" />
      </section>

      {issues.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Issues Found</h2>
          <div className="mt-5 space-y-4">
            {issues.map((issue) => (
              <IssueCard key={issue.title} {...issue} />
            ))}
          </div>
        </section>
      )}

      {sectionReviews.length > 0 && (
        <SectionReviews reviews={sectionReviews} />
      )}

      {recommendations.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-signal">Nia recommendations</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Actionable improvements</h2>
            </div>
            {onBuildFromRecommendations && (
              <Button variant="mint" onClick={onBuildFromRecommendations}>
                <Sparkles size={17} aria-hidden="true" />
                Build Resume From These
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex gap-3 rounded-xl border border-line bg-white p-4">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
                <p className="text-sm leading-6 text-graphite">{rec}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreOverview({ score, predictedScore, scoreExplanation, resume }) {
  const ring = buildRingStyle(score);
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full p-2"
            style={{ background: ring.gradient }}
            aria-label={`ATS score ${score} out of 100`}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
              <span className="text-4xl font-bold" style={{ color: ring.color }}>{score}</span>
              <span className="text-xs font-bold text-graphite">/100</span>
            </div>
          </div>
          <p className="text-sm font-bold text-graphite">Current ATS Score</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-signal">ATS Analysis</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Your resume scored {score}/100</h2>
            <p className="mt-2 text-base leading-6 text-graphite">{scoreExplanation}</p>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-mint/20 bg-mint/10 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-white">
              <TrendingUp size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-ink">
                Predicted after improvements: {predictedScore}/100
              </p>
              <p className="mt-1 text-sm text-graphite">
                Apply Nia's recommendations below to reach this score.
              </p>
            </div>
          </div>
          {resume?.original_filename && (
            <p className="text-sm text-graphite">
              Analyzing: <span className="font-semibold text-ink">{resume.original_filename}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function buildRingStyle(score) {
  const color = score >= 80 ? "#14B87A" : score >= 65 ? "#FFB547" : "#F9735B";
  return {
    color,
    gradient: `conic-gradient(${color} ${score * 3.6}deg, #e8edf5 0deg)`
  };
}

function KeywordPanel({ title, items, tone }) {
  const chipClass =
    tone === "mint"
      ? "bg-mint/10 text-mint border-mint/15"
      : "bg-amber/10 text-amber border-amber/15";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h3 className="font-bold text-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${chipClass}`}
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-graphite">None detected.</p>
        )}
      </div>
    </div>
  );
}

function IssueCard({ title, body, impact }) {
  const impactColor =
    impact?.toLowerCase().includes("high")
      ? "text-coral bg-coral/10"
      : impact?.toLowerCase().includes("medium")
      ? "text-amber bg-amber/10"
      : "text-graphite bg-slate-100";

  return (
    <div className="flex gap-4 rounded-xl border border-line bg-white p-4">
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-bold text-ink">{title}</p>
          {impact && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${impactColor}`}>
              {impact}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-6 text-graphite">{body}</p>
      </div>
    </div>
  );
}

function SectionReviews({ reviews }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Section-by-Section Review</h2>
      <div className="mt-5 space-y-3">
        {reviews.map((review, index) => (
          <div key={review.title} className="rounded-xl border border-line">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    review.score >= 80
                      ? "bg-mint/10 text-mint"
                      : review.score >= 65
                      ? "bg-amber/10 text-amber"
                      : "bg-coral/10 text-coral"
                  }`}
                >
                  {review.score}
                </span>
                <span className="font-bold text-ink">{review.title}</span>
              </div>
              <ChevronDown
                size={18}
                className={`text-graphite transition ${openIndex === index ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {openIndex === index && (
              <div className="grid gap-4 border-t border-line px-4 py-4 md:grid-cols-3">
                <ReviewCell label="What works" text={review.good} tone="mint" />
                <ReviewCell label="What's missing" text={review.missing} tone="amber" />
                <ReviewCell label="Nia suggestion" text={review.suggestion} tone="signal" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewCell({ label, text, tone }) {
  const color =
    tone === "mint" ? "text-mint" : tone === "amber" ? "text-amber" : "text-signal";
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</p>
      <p className="mt-2 text-sm leading-6 text-graphite">{text}</p>
    </div>
  );
}

// ─── CoverLetterDocumentPreview ──────────────────────────────────────────────
// Used by: CoverLetterTemplates gallery page
// Props: template (cover letter template object), mode ("card"|"builder")

export function CoverLetterDocumentPreview({ template, mode = "card" }) {
  const selected =
    coverLetterTemplateOptions.find((opt) => opt.id === template?.id) ??
    coverLetterTemplateOptions[0];
  return (
    <div className="overflow-hidden rounded-lg bg-white">
      <CoverLetterTemplate template={selected} letter={null} mode={mode} />
    </div>
  );
}

// ─── Legacy exports kept for backward compatibility ───────────────────────────

export function ResumeTemplateGallery({ templates, filters, activeFilter, onFilterChange, onPreview }) {
  const [hov, setHov] = useState(null);
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {(filters ?? []).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeFilter === f
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(templates ?? []).map((tpl) => (
          <div
            key={tpl.id}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            onMouseEnter={() => setHov(tpl.id)}
            onMouseLeave={() => setHov(null)}
          >
            <div
              className="relative overflow-hidden bg-white"
              style={{ height: 280 }}
              onClick={() => onPreview?.(tpl)}
            >
              <iframe
                srcDoc={renderResumeHTML(SAMPLE_PERSON, tpl.id)}
                className="pointer-events-none absolute top-0 left-0"
                style={{ width: "307%", height: "900px", border: "none", transform: "scale(0.325)", transformOrigin: "top left" }}
                title={tpl.name}
              />
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${hov === tpl.id ? "bg-slate-900/45" : "bg-transparent"}`}>
                {hov === tpl.id && (
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-xl">
                    Preview →
                  </span>
                )}
              </div>
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-emerald-100 bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-600 shadow">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ATS {tpl.atsScore}
              </div>
            </div>
            <div className="border-t border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{tpl.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{tpl.category ?? ""}</div>
                </div>
                <div
                  className="h-4 w-4 rounded-full border-2"
                  style={{ backgroundColor: tpl.accent, borderColor: tpl.accent }}
                />
              </div>
              <button
                onClick={() => onPreview?.(tpl)}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: `${tpl.accent ?? "#0ea5e9"}14`, color: tpl.accent ?? "#0ea5e9", border: `1.5px solid ${tpl.accent ?? "#0ea5e9"}40` }}
              >
                Preview Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UploadZone({ onFile, accept = ".pdf,.docx", label, sublabel, icon = "📄" }) {
  const [fileName, setFileName] = useState("");
  function handle(file) {
    if (!file) return;
    setFileName(file.name);
    onFile?.(file);
  }
  return (
    <div
      onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById("hw-up")?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        fileName ? "border-mint bg-mint/5" : "border-slate-300 hover:border-signal"
      }`}
    >
      <input id="hw-up" type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files[0])} />
      {fileName ? (
        <>
          <div className="mb-2 text-4xl">✅</div>
          <p className="font-semibold text-mint">{fileName}</p>
        </>
      ) : (
        <>
          <div className="mb-3 text-4xl">{icon}</div>
          <p className="font-semibold text-slate-700">{label ?? "Drop file here"}</p>
          <p className="text-sm text-slate-500">{sublabel ?? "click to browse"}</p>
        </>
      )}
    </div>
  );
}
