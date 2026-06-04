import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  SearchCheck,
  Star,
  TrendingUp,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import { CTASection, SectionCard } from "../components/PremiumUI";
import { usePageTitle } from "../hooks/usePageTitle";
import { optimizeResumeForJob as optimizeResumeForJobAi } from "../services/aiService";
import { fetchResumes, uploadResume } from "../services/resumeService";
import { getApiErrorMessage } from "../utils/apiError";
import { extractJdKeywords } from "../utils/careerIntelligence";
import { downloadOptimizedResume as downloadOptimizedResumeUtil } from "../utils/pdfExport";

// ── Analysis engine ───────────────────────────────────────────────────────────

const PARTIAL_SKILL_MAP = {
  "ci/cd":                ["jenkins","github actions","gitlab ci","circleci","travis"],
  "cloud":                ["aws","azure","gcp","google cloud","heroku"],
  "linux":                ["unix","bash","shell","ubuntu","centos"],
  "containerization":     ["docker","kubernetes","podman"],
  "databases":            ["postgresql","mysql","mongodb","redis","sqlite"],
  "messaging":            ["kafka","rabbitmq","sqs","pubsub"],
  "monitoring":           ["prometheus","grafana","datadog","splunk","dynatrace","newrelic"],
  "version control":      ["git","github","gitlab","bitbucket"],
  "iac":                  ["terraform","ansible","cloudformation","pulumi"],
  "testing":              ["pytest","jest","junit","selenium","cypress","playwright"],
  "observability":        ["splunk","dynatrace","datadog","opentelemetry"],
  "event-driven":         ["kafka","rabbitmq","sqs","pubsub","eventbridge"],
};

function extractExperienceYears(resumeText, extractedExperience = []) {
  let totalMonths = 0;
  const dateRangeRe = /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+)?(\d{4})\s*[-–—]\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+)?(\d{4}|Present|Current)/gi;
  const monthMap = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  let m;
  while ((m = dateRangeRe.exec(resumeText)) !== null) {
    const startM = m[1] ? (monthMap[m[1].toLowerCase()] ?? 0) : 0;
    const startY = parseInt(m[2]);
    const endM   = m[3] ? (monthMap[m[3].toLowerCase()] ?? 11) : 11;
    const endY   = m[4]?.toLowerCase().includes("present") || m[4]?.toLowerCase().includes("current") ? new Date().getFullYear() : parseInt(m[4]);
    if (!isNaN(startY) && !isNaN(endY)) {
      totalMonths += (endY - startY) * 12 + (endM - startM);
    }
  }
  return Math.max(0, Math.round(totalMonths / 12));
}

function extractRequiredYears(jdText) {
  const m = jdText.match(/(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
  if (!m) return null;
  return m[2] ? `${m[1]}-${m[2]} years` : `${m[1]}+ years`;
}

function extractEduFromText(education = [], resumeText = "") {
  if (education.length > 0) {
    const e = education[0];
    return { degree: e.degree || "", school: e.school || "", gpa: e.gpa || "" };
  }
  const m = resumeText.match(/\b(bachelor|master|phd|b\.s|m\.s|b\.e|m\.e|mba|b\.a|m\.a)\.?\s+(?:of|in)?\s+([A-Za-z ]+)/i);
  return { degree: m ? m[0] : "", school: "", gpa: "" };
}

function extractRequiredDegree(jdText) {
  const patterns = [
    /bachelor['s]?\s+(?:degree\s+in\s+)?([A-Za-z ]+)/i,
    /master['s]?\s+(?:degree\s+in\s+)?([A-Za-z ]+)/i,
    /(?:degree|education)\s+in\s+([A-Za-z ,]+)/i,
    /(computer science|information systems|software engineering|electrical engineering|mathematics)/i,
  ];
  for (const p of patterns) {
    const m = jdText.match(p);
    if (m) return m[0];
  }
  return null;
}

function scoreEducation(candidateDegree, requiredDegree) {
  if (!requiredDegree) return { score: 90, status: "No specific requirement", reasoning: "No degree requirement specified — your credentials are accepted." };
  const deg = (candidateDegree || "").toLowerCase();
  const req = (requiredDegree || "").toLowerCase();
  if (!deg) return { score: 50, status: "Unknown", reasoning: "Education could not be verified from the resume." };
  const relatedFields = ["information systems","computer","software","data","engineering","mathematics","science"];
  const isRelated = relatedFields.some((f) => deg.includes(f));
  const isMaster  = deg.includes("master") || deg.includes("m.s");
  if (req.includes("master") && isMaster) return { score: 100, status: "Excellent Match", reasoning: "Your graduate degree fully meets the requirement." };
  if (req.includes("bachelor") && (deg.includes("bachelor") || isMaster)) return { score: 100, status: "Matched", reasoning: "Your degree meets or exceeds the educational requirement." };
  if (isRelated) return { score: 85, status: "Related Match", reasoning: "Your degree is in a closely related field and likely meets the requirement." };
  return { score: 65, status: "Partial Match", reasoning: "Your degree is in a different field but may still qualify." };
}

function scoreProjects(projects = [], jdKeywords = [], matchedSkills = []) {
  if (!projects.length) return [];
  const matchedSet = new Set(matchedSkills.map((k) => k.toLowerCase()));
  return projects.map((proj) => {
    const projText = [proj.name, proj.technologies, proj.description, ...(proj.bullets || [])].join(" ").toLowerCase();
    const matched  = jdKeywords.filter((kw) => projText.includes(kw.toLowerCase()) && matchedSet.has(kw.toLowerCase()));
    const score    = jdKeywords.length > 0 ? Math.min(98, Math.round((matched.length / Math.min(jdKeywords.length, 12)) * 100) + 30) : 60;
    return { name: proj.name || "Unnamed Project", score, matchedBecause: matched.slice(0, 6) };
  });
}

function scoreCertifications(certifications = [], jdText = "") {
  const jdLower = jdText.toLowerCase();
  return certifications.map((cert) => {
    const c     = String(cert).toLowerCase();
    const isAws = c.includes("aws");
    const isGcp = c.includes("gcp") || c.includes("google cloud");
    const isAz  = c.includes("azure");
    const jdWantsCloud = jdLower.includes("aws") || jdLower.includes("cloud") || jdLower.includes("gcp") || jdLower.includes("azure");
    let relevance = "Low"; let contribution = ["General credential"];
    if ((isAws && jdLower.includes("aws")) || (isGcp && jdLower.includes("gcp")) || (isAz && jdLower.includes("azure"))) {
      relevance = "High"; contribution = ["Direct cloud platform alignment", "AWS/Cloud Ecosystem Understanding"];
    } else if (jdWantsCloud && (isAws || isGcp || isAz)) {
      relevance = "Medium"; contribution = ["Cloud Knowledge", "Platform Familiarity"];
    }
    return { name: cert, relevance, contribution };
  });
}

function computeAtsScore(resumeText, matchedSkills, allJdKeywords) {
  const hasMetrics      = /\d+%|\d+x|\$\d+|\d+\+/.test(resumeText);
  const hasSummary      = /summary|profile|objective/i.test(resumeText);
  const hasExperience   = /experience|employment|work history/i.test(resumeText);
  const hasEducation    = /education|degree|university/i.test(resumeText);
  const hasSkills       = /skills|technologies|competencies/i.test(resumeText);
  const hasProjects     = /projects?/i.test(resumeText);
  const keywordDensity  = allJdKeywords.length > 0 ? matchedSkills.length / allJdKeywords.length : 0.5;
  let score = 50;
  if (hasMetrics)    score += 8;
  if (hasSummary)    score += 5;
  if (hasExperience) score += 8;
  if (hasEducation)  score += 5;
  if (hasSkills)     score += 8;
  if (hasProjects)   score += 6;
  score += Math.round(keywordDensity * 20);
  return Math.min(98, Math.max(42, score));
}

function generateRecruiterReview(matchedSkills, missingSkills, expYears, overallScore, experienceRoles = []) {
  const strengths = matchedSkills.slice(0, 5).map((s) => `${s} experience`);
  if (expYears >= 1) strengths.push(`${expYears}+ year${expYears > 1 ? "s" : ""} of professional experience`);
  const concerns = missingSkills.slice(0, 4).map((s) => `Missing ${s}`);
  if (expYears < 2 && experienceRoles.length < 2) concerns.push("Limited professional tenure");
  const rec =
    overallScore >= 85 ? "Strongly Recommended for Interview" :
    overallScore >= 72 ? "Recommended for Interview" :
    overallScore >= 60 ? "Consider with Reservations" :
                         "Needs More Preparation";
  const assessment =
    overallScore >= 85
      ? `The candidate demonstrates strong alignment with this role. Their technical background, particularly in ${matchedSkills.slice(0, 3).join(", ")}, directly addresses the core requirements. ${expYears > 0 ? `With ${expYears}+ year(s) of relevant professional experience, they bring practical knowledge` : "Their project portfolio demonstrates hands-on capability"} that translates well to this position.`
      : overallScore >= 72
      ? `The candidate shows solid potential for this role with relevant experience in ${matchedSkills.slice(0, 3).join(", ")}. While there are a few skill gaps (${missingSkills.slice(0, 2).join(", ")}), their overall technical profile is competitive and worth exploring in an interview.`
      : overallScore >= 60
      ? `The candidate has foundational skills relevant to this role but has notable gaps in ${missingSkills.slice(0, 3).join(", ")}. With targeted upskilling in these areas, they could become a strong candidate. An exploratory conversation may clarify their practical depth.`
      : `The candidate's current skill set has significant gaps compared to this role's requirements. Key missing areas include ${missingSkills.slice(0, 4).join(", ")}. We recommend addressing these gaps before applying.`;
  return { assessment, strengths: strengths.slice(0, 5), concerns: concerns.slice(0, 4), recommendation: rec };
}

function generateRecommendations(missingSkills, resumeText) {
  const addKeywords = missingSkills.slice(0, 8);
  const improve = [];
  if (!/\d+%|\d+x|\$\d+|\d+\+/.test(resumeText)) improve.push("Add measurable metrics to experience bullets (%, count, scale, time savings)");
  if (resumeText.split("\n").filter((l) => /^[•\-*]/.test(l.trim())).length < 6) improve.push("Expand bullet points with more specific technical details and outcomes");
  if (!/summary|profile/i.test(resumeText)) improve.push("Add a professional summary targeting this role specifically");
  improve.push("Reorder skills to match the JD's emphasis");
  if (!/(certif|credential)/i.test(resumeText)) improve.push("Add relevant certifications or courses to strengthen credentials");
  return { addKeywords, improve: improve.slice(0, 5) };
}

function computeVerdict(overallScore, missingSkills, criticalSkills = []) {
  const missingCritical = criticalSkills.filter((s) => missingSkills.map((m) => m.toLowerCase()).includes(s.toLowerCase()));
  if (overallScore >= 85) return { recommendation: "Recommended to Apply", confidence: "High", interviewProb: "75-90%", missingCritical: [] };
  if (overallScore >= 72) return { recommendation: "Recommended to Apply", confidence: "Moderate", interviewProb: "55-75%", missingCritical: missingCritical.slice(0, 3) };
  if (overallScore >= 60) return { recommendation: "Consider Applying", confidence: "Low", interviewProb: "30-55%", missingCritical: missingCritical.slice(0, 3) };
  return { recommendation: "Improve Resume First", confidence: "Low", interviewProb: "10-30%", missingCritical: (missingSkills.slice(0, 4)) };
}

function computePartialMatches(allJdKeywords, matchedSkills, resumeText) {
  const matched = new Set(matchedSkills.map((k) => k.toLowerCase()));
  const partials = [];
  for (const [category, related] of Object.entries(PARTIAL_SKILL_MAP)) {
    const jdHasCategory = allJdKeywords.some((k) => k.toLowerCase().includes(category.replace(/[^a-z]/g, "")));
    if (jdHasCategory) {
      const resumeHasRelated = related.some((r) => resumeText.toLowerCase().includes(r.toLowerCase()));
      if (resumeHasRelated && !matched.has(category)) {
        partials.push(category);
      }
    }
  }
  return partials.slice(0, 6);
}

function runFullAnalysis(resumeData, jdText) {
  const resumeText = resumeData?.parsed_text ?? "";
  const extractedExp  = resumeData?.extracted_experience  ?? [];
  const extractedProj = resumeData?.extracted_projects    ?? [];
  const extractedEdu  = resumeData?.extracted_education   ?? [];
  const certs         = resumeData?.certifications        ?? [];

  const allJdKeywords = extractJdKeywords(jdText);

  // Skills
  const matchedSkills = allJdKeywords.filter((kw) => {
    const esc = kw.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9])(${esc})(?![a-z0-9])`, "i").test(resumeText);
  });
  const missingSkills  = allJdKeywords.filter((kw) => !matchedSkills.includes(kw));
  const partialSkills  = computePartialMatches(allJdKeywords, matchedSkills, resumeText);

  // Experience
  const expYears      = extractExperienceYears(resumeText, extractedExp);
  const requiredYears = extractRequiredYears(jdText);
  const expScore      = requiredYears
    ? (() => {
        const req = parseInt(requiredYears);
        if (expYears >= req) return 100;
        if (expYears >= req - 1) return 80;
        if (expYears >= 1) return 60;
        return 40;
      })()
    : Math.min(90, 50 + expYears * 15);

  // Education
  const { degree, school, gpa } = extractEduFromText(extractedEdu, resumeText);
  const requiredDegree           = extractRequiredDegree(jdText);
  const { score: eduScore, status: eduStatus, reasoning: eduReasoning } = scoreEducation(degree, requiredDegree);

  // Projects
  const projects   = scoreProjects(extractedProj, allJdKeywords, matchedSkills);
  const projScore  = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.score, 0) / projects.length) : 50;

  // Certifications
  const certAnalysis = scoreCertifications(certs, jdText);
  const certScore    = certAnalysis.length > 0 ? (certAnalysis.some((c) => c.relevance === "High") ? 95 : certAnalysis.some((c) => c.relevance === "Medium") ? 80 : 65) : 70;

  // ATS
  const atsScore = computeAtsScore(resumeText, matchedSkills, allJdKeywords);

  // Section scores
  const skillsScore = allJdKeywords.length > 0 ? Math.round((matchedSkills.length / allJdKeywords.length) * 100) : 50;
  const sectionScores = {
    skills:        Math.min(98, skillsScore),
    projects:      Math.min(98, projScore),
    experience:    Math.min(98, expScore),
    education:     Math.min(100, eduScore),
    certifications:Math.min(98, certScore),
    ats:           Math.min(98, atsScore),
  };

  // Overall (weighted)
  const overallScore = Math.min(99, Math.round(
    sectionScores.skills        * 0.35 +
    sectionScores.experience    * 0.25 +
    sectionScores.projects      * 0.20 +
    sectionScores.education     * 0.08 +
    sectionScores.certifications* 0.05 +
    sectionScores.ats           * 0.07
  ));

  const recruiterReview   = generateRecruiterReview(matchedSkills, missingSkills, expYears, overallScore, extractedExp);
  const recommendations   = generateRecommendations(missingSkills, resumeText);
  const verdict           = computeVerdict(overallScore, missingSkills, allJdKeywords.slice(0, 8));

  return {
    overallScore, atsScore,
    matchedSkills: matchedSkills.slice(0, 20),
    missingSkills: missingSkills.slice(0, 20),
    partialSkills,
    expYears, requiredYears, expScore,
    degree, school, gpa, requiredDegree, eduScore, eduStatus, eduReasoning,
    projects: projects.slice(0, 5),
    certAnalysis,
    sectionScores, recruiterReview, recommendations, verdict,
    suggestions: missingSkills.slice(0, 8),
  };
}

// ── Loading steps ─────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  "Extracting Resume Data",
  "Parsing Job Description",
  "Matching Skills & Keywords",
  "Comparing Experience",
  "Calculating ATS Score",
  "Generating Recruiter Review",
  "Preparing Recommendations",
];

// ── Main component ────────────────────────────────────────────────────────────
export default function JobMatch() {
  usePageTitle("JD Match Analyzer");
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const dropRef   = useRef(null);

  const [resumes,        setResumes]        = useState([]);
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [resumeData,     setResumeData]     = useState(null);
  const [form,           setForm]           = useState({ resume_id: "", title: "", company: "", description_text: "" });
  const [error,          setError]          = useState("");
  const [isDragging,     setIsDragging]     = useState(false);
  const [analyzing,      setAnalyzing]      = useState(false);
  const [loadingStep,    setLoadingStep]    = useState(-1);
  const [analysis,       setAnalysis]       = useState(null);
  const [openSections,   setOpenSections]   = useState({});
  const [isOptimizing,   setIsOptimizing]   = useState(false);
  const [optStepIdx,     setOptStepIdx]     = useState(-1);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [showOptModal,   setShowOptModal]   = useState(false);
  const [copiedKw,       setCopiedKw]       = useState("");

  useEffect(() => {
    fetchResumes().then((data) => {
      setResumes(data);
      if (data[0]) setForm((f) => ({ ...f, resume_id: String(data[0].id) }));
    }).catch(() => {
      const saved = JSON.parse(localStorage.getItem("hiremind_local_resume") || "null");
      if (saved) { setResumes([saved]); setForm((f) => ({ ...f, resume_id: String(saved.id) })); }
    });
  }, []);

  function updateField(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }
  function toggleSection(key) { setOpenSections((o) => ({ ...o, [key]: !o[key] })); }

  function onDrop(e) { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }
  function handleFile(file) {
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx)$/i)) { setError("Please upload a PDF or DOCX file."); return; }
    setError(""); setUploadedFile(file); setResumeData(null); setAnalysis(null);
  }

  async function handleAnalyze() {
    if (!uploadedFile && !form.resume_id) { setError("Please upload a resume first."); return; }
    if (!form.description_text.trim())    { setError("Please paste a job description."); return; }

    setError(""); setAnalyzing(true); setLoadingStep(0); setAnalysis(null);
    const stepDuration = 500;
    const timers = LOADING_STEPS.map((_, i) => window.setTimeout(() => setLoadingStep(i), stepDuration * i));

    try {
      let resume = resumeData;
      if (!resume && uploadedFile) {
        const res  = await uploadResume(uploadedFile);
        resume     = res.resume ?? res;
        setResumeData(resume);
        localStorage.setItem("hiremind_local_resume", JSON.stringify(resume));
      } else if (!resume) {
        const saved = JSON.parse(localStorage.getItem("hiremind_local_resume") || "null");
        resume = saved;
        setResumeData(resume);
      }

      // Let animation finish
      await new Promise((r) => window.setTimeout(r, stepDuration * LOADING_STEPS.length + 300));

      const result = runFullAnalysis(resume, form.description_text);
      setAnalysis(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Analysis failed. Check the backend is running."));
    } finally {
      timers.forEach(clearTimeout);
      setAnalyzing(false); setLoadingStep(-1);
    }
  }

  const OPT_STEPS = [
    "Reading your resume…",
    "Analyzing job requirements…",
    "Identifying keyword gaps…",
    "Rewriting bullets to match JD…",
    "Adding missing keywords…",
    "Improving summary…",
    "Finalizing optimized resume…",
  ];

  async function handleOptimize() {
    setIsOptimizing(true); setShowOptModal(true); setOptStepIdx(0); setOptimizeResult(null);
    const timer = window.setInterval(() => setOptStepIdx((s) => Math.min(OPT_STEPS.length - 1, s + 1)), 1300);
    try {
      const resumePayload = {
        name:    resumeData?.name    || "",
        summary: resumeData?.summary || "",
        experience: (resumeData?.extracted_experience || []).map((e) => ({
          title: e.title || e.job_title || "", company: e.company || "",
          location: e.location || "", start_date: e.start_date || "", end_date: e.end_date || "",
          bullets: e.bullets || [],
        })),
        education: resumeData?.extracted_education || [],
        skills:    resumeData?.extracted_skills    || [],
        projects:  resumeData?.extracted_projects  || [],
      };
      const result = await optimizeResumeForJobAi(
        resumeData?.parsed_text || "",
        resumePayload,
        form.description_text,
        analysis?.missingSkills || [],
        analysis?.overallScore  || 0,
      );
      window.clearInterval(timer);
      setOptStepIdx(OPT_STEPS.length);
      const currentScore  = analysis?.overallScore || 0;
      const estimatedNew  = result._estimated_score || Math.min(92, currentScore + 20);
      // Store original resumeData (not resumePayload) so download has extracted_experience etc.
      setOptimizeResult({ ...result, score_before: currentScore, score_after: estimatedNew, _resumeData: resumeData, _resumePayload: resumePayload });
    } catch {
      window.clearInterval(timer);
      setOptStepIdx(OPT_STEPS.length);
      setOptimizeResult({ error: true });
    } finally {
      setIsOptimizing(false);
    }
  }

  function copyKeyword(kw) {
    navigator.clipboard.writeText(kw).catch(() => {});
    setCopiedKw(kw);
    window.setTimeout(() => setCopiedKw(""), 2000);
  }

  const scoreLabel = (s) =>
    s >= 90 ? "Excellent Match" : s >= 75 ? "Strong Match" : s >= 60 ? "Moderate Match" : "Needs Improvement";
  const scoreRing = (s) =>
    s >= 75 ? "#2C1810" : s >= 60 ? "#f59e0b" : "#ef4444";

  // ── INPUT SCREEN ──────────────────────────────────────────────────────────
  if (!analyzing && !analysis) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal text-white">
            <SearchCheck size={26} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">Recruiter-Grade Job Fit Analysis</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-graphite">
            Upload your resume, paste a job description, and get a complete recruiter-style evaluation with
            match scores, skill gap analysis, and personalized recommendations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume upload */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-signal">Step 1</p>
            <h2 className="mb-4 text-xl font-bold text-ink">Your Resume</h2>
            <label htmlFor="jm-file" ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
              className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
                isDragging ? "border-signal bg-lilac/30"
                : uploadedFile ? "border-[#D4A853] bg-[#D4A853]/5 cursor-default"
                : "border-slate-300 hover:border-signal hover:bg-lilac/10"
              }`}>
              <input id="jm-file" ref={fileRef} type="file" className="hidden" accept=".pdf,.docx"
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <CheckCircle2 size={28} style={{ color: "#2C1810" }} />
                  <p className="font-bold text-ink">{uploadedFile.name}</p>
                  <button type="button" onClick={(e) => { e.preventDefault(); setUploadedFile(null); setResumeData(null); }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><UploadCloud size={22} className="text-slate-400" /></div>
                  <p className="font-bold text-ink">Drag & drop or click to upload</p>
                  <p className="text-sm text-graphite">PDF or DOCX · Max 10MB</p>
                </div>
              )}
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-graphite">Target Role</span>
                <input name="title" value={form.title} onChange={updateField} placeholder="Software Engineer"
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-graphite">Company</span>
                <input name="company" value={form.company} onChange={updateField} placeholder="Acme Inc"
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" />
              </label>
            </div>
          </div>

          {/* JD */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-signal">Step 2</p>
            <h2 className="mb-4 text-xl font-bold text-ink">Job Description</h2>
            <textarea name="description_text" value={form.description_text} onChange={updateField} rows={11}
              placeholder={"Paste the complete job description here…\n\nInclude responsibilities, requirements, skills, and qualifications for best results."}
              className="focus-ring w-full resize-none rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-ink" />
          </div>
        </div>

        {error && <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={17}/>{error}</div>}

        <div className="flex justify-center">
          <button type="button" onClick={handleAnalyze}
            disabled={(!uploadedFile && !form.resume_id) || !form.description_text.trim()}
            className="flex items-center gap-3 rounded-2xl bg-signal px-12 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-signal/90 disabled:opacity-40">
            <SearchCheck size={22} /> Analyze Job Fit
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ─────────────────────────────────────────────────────────
  if (analyzing) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-signal/10 mx-auto">
          <Loader2 size={36} className="animate-spin text-signal" />
        </div>
        <h2 className="text-2xl font-bold text-ink">Running Recruiter Analysis…</h2>
        <p className="mt-2 text-sm text-graphite">Performing a complete job fit evaluation</p>
        {/* Progress bar */}
        <div className="mt-8 mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-signal transition-all duration-500"
            style={{ width: `${loadingStep >= 0 ? ((loadingStep + 1) / LOADING_STEPS.length) * 100 : 0}%` }} />
        </div>
        <div className="space-y-2.5">
          {LOADING_STEPS.map((step, i) => (
            <div key={step} className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold transition ${
              i < loadingStep ? "bg-[#2C1810]/10 text-[#2C1810]" : i === loadingStep ? "bg-[#D4A853]/15 text-[#2C1810]" : "bg-slate-50 text-slate-400"
            }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < loadingStep ? "text-white" : i === loadingStep ? "text-[#2C1810]" : "bg-slate-200 text-slate-500"
              }`} style={i < loadingStep ? { background: "#2C1810" } : i === loadingStep ? { background: "#D4A853" } : {}}>{i < loadingStep ? "✓" : i + 1}</span>
              {step}
              {i === loadingStep && <Loader2 size={14} className="ml-auto animate-spin" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── REPORT SCREEN ──────────────────────────────────────────────────────────
  if (!analysis) return null;
  const a = analysis;

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ── TOP BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-graphite">Analysis for {uploadedFile?.name ?? "your resume"}{form.title ? ` → ${form.title}` : ""}{form.company ? ` at ${form.company}` : ""}</p>
          <h1 className="text-2xl font-bold text-ink">Job Fit Report</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setAnalysis(null); setAnalyzing(false); }}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-graphite hover:bg-slate-50">
            New Analysis
          </button>
          <button type="button" onClick={handleOptimize}
            className="flex items-center gap-2 rounded-xl bg-signal px-5 py-2 text-sm font-bold text-white hover:bg-signal/90">
            <Zap size={16} /> Optimize Resume
          </button>
        </div>
      </div>

      {/* ── SCORE OVERVIEW ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCircle label="Overall Match" score={a.overallScore} subtitle={scoreLabel(a.overallScore)} large />
        <ScoreCircle label="ATS Compatibility" score={a.atsScore} subtitle="Formatting & Keywords" />
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-graphite">Matched Skills</p>
          <p className="mt-3 text-4xl font-extrabold" style={{ color: "#2C1810" }}>{a.matchedSkills.length}</p>
          <p className="mt-1 text-sm text-graphite">of {a.matchedSkills.length + a.missingSkills.length} JD keywords</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-graphite">Missing Skills</p>
          <p className="mt-3 text-4xl font-extrabold text-amber-500">{a.missingSkills.length}</p>
          <p className="mt-1 text-sm text-graphite">gaps to address</p>
        </div>
      </div>

      {/* ── SECTION SCORES ── */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-bold text-ink">Section-by-Section Scoring</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(a.sectionScores).map(([key, score]) => (
            <SectionScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} score={score} />
          ))}
        </div>
      </div>

      {/* ── SKILLS MATCH ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SkillCard title="Matched Skills" tone="mint" icon="✓" items={a.matchedSkills}
          empty="No matched skills detected." />
        <SkillCard title="Missing Skills" tone="amber" icon="✗" items={a.missingSkills}
          empty="No missing skills — great alignment!" />
        <SkillCard title="Partial Matches" tone="blue" icon="≈" items={a.partialSkills}
          empty="No partial matches detected." />
      </div>

      {/* ── EXPERIENCE + EDUCATION ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Experience */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-ink">Experience Match</h2>
          <div className="space-y-3">
            <InfoRow label="Required Experience" value={a.requiredYears ?? "Not specified"} />
            <InfoRow label="Your Experience" value={a.expYears > 0 ? `${a.expYears}+ year${a.expYears > 1 ? "s" : ""} professional` : "Projects & Internships"} />
            <InfoRow label="Experience Score" value={`${a.expScore}%`} highlight />
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full transition-all" style={{ width: `${a.expScore}%`, background: "linear-gradient(to right, #2C1810, #D4A853)" }} />
          </div>
          <p className="mt-3 text-sm text-graphite">
            {a.expYears >= 2 ? "Solid professional experience that meets typical requirements." :
             a.expYears >= 1 ? "Emerging professional experience supported by project work." :
             "Strong project portfolio compensates for limited formal experience."}
          </p>
        </div>

        {/* Education */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-ink">Education Match</h2>
          <div className="space-y-3">
            <InfoRow label="Requirement" value={a.requiredDegree ?? "Not specified"} />
            <InfoRow label="Your Degree" value={a.degree ? `${a.degree}${a.school ? ` — ${a.school}` : ""}` : "Not detected"} />
            {a.gpa && <InfoRow label="GPA" value={a.gpa} />}
            <InfoRow label="Status" value={a.eduStatus} highlight />
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-graphite">{a.eduReasoning}</div>
        </div>
      </div>

      {/* ── PROJECTS ── */}
      {a.projects.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-ink">Project Relevance Analysis</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.projects.map((proj) => (
              <div key={proj.name} className="rounded-xl border border-line bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink leading-5">{proj.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                    proj.score >= 80 ? "bg-[#2C1810]/10 text-[#2C1810]" : proj.score >= 65 ? "bg-amber-50 text-amber-600" : "bg-slate-200 text-slate-600"
                  }`}>{proj.score}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${proj.score}%`, background: "linear-gradient(to right, #2C1810, #D4A853)" }} />
                </div>
                {proj.matchedBecause.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-graphite mb-1.5">Matched because:</p>
                    <div className="flex flex-wrap gap-1">
                      {proj.matchedBecause.map((kw) => (
                        <span key={kw} className="rounded-full bg-[#2C1810]/10 px-2 py-0.5 text-[10px] font-bold text-[#2C1810]">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CERTIFICATIONS ── */}
      {a.certAnalysis.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-ink">Certification Match</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.certAnalysis.map((cert) => (
              <div key={cert.name} className="rounded-xl border border-line bg-slate-50 p-4">
                <p className="text-sm font-bold text-ink">{cert.name}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  cert.relevance === "High" ? "bg-[#2C1810]/10 text-[#2C1810]" : cert.relevance === "Medium" ? "bg-amber-50 text-amber-600" : "bg-slate-200 text-slate-500"
                }`}>{cert.relevance} Relevance</span>
                <ul className="mt-2 space-y-1">
                  {cert.contribution.map((c) => <li key={c} className="text-xs text-graphite">• {c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECRUITER REVIEW ── */}
      <div className="rounded-2xl border border-signal/20 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal text-white"><Star size={20} /></div>
          <h2 className="text-xl font-bold text-ink">Recruiter Assessment</h2>
        </div>
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-sm leading-7 text-ink">{a.recruiterReview.assessment}</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold" style={{ color: "#2C1810" }}>Strengths</p>
            <ul className="space-y-2">
              {(a.recruiterReview.strengths.length > 0
                ? a.recruiterReview.strengths
                : ["Technical background relevant to this role", "Professional experience documented", "Relevant skills detected in resume"]
              ).map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-graphite">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "#2C1810" }} />{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold text-amber-600">Concerns</p>
            <ul className="space-y-2">
              {(a.recruiterReview.concerns.length > 0
                ? a.recruiterReview.concerns
                : a.missingSkills.slice(0, 3).map((s) => `Missing keyword: ${s}`).concat(["Consider adding quantified metrics to bullets"])
              ).map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-graphite">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />{c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-signal/20 bg-signal/5 px-5 py-3">
          <p className="text-sm font-bold text-ink">Recommendation</p>
          <span className="rounded-full bg-signal px-5 py-1.5 text-sm font-bold text-white">
            {a.recruiterReview.recommendation}
          </span>
        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="mb-5 font-bold text-ink">Resume Improvement Recommendations</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-amber-600">Add These Keywords</p>
            <p className="mb-2 text-xs text-slate-400">Click to copy → paste into your resume</p>
            <div className="flex flex-wrap gap-2">
              {(a.recommendations.addKeywords.length > 0 ? a.recommendations.addKeywords : a.missingSkills.slice(0, 8)).map((kw) => (
                <button key={kw} type="button" onClick={() => copyKeyword(kw)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition hover:bg-amber-100 active:scale-95 ${
                    copiedKw === kw
                      ? "border-[#D4A853]/40 bg-[#D4A853]/10 text-[#2C1810]"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                  {kw}{copiedKw === kw ? " ✓" : ""}
                </button>
              ))}
            </div>
            {copiedKw && (
              <p className="mt-2 text-xs font-semibold" style={{ color: "#2C1810" }}>
                "{copiedKw}" copied — add this to your resume!
              </p>
            )}
          </div>
          <div>
            <p className="mb-3 text-sm font-bold text-signal">Improve Your Resume</p>
            <ul className="space-y-2">
              {a.recommendations.improve.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-graphite">
                  <TrendingUp size={14} className="mt-1 shrink-0 text-signal" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={handleOptimize}
            className="flex items-center gap-2 rounded-2xl bg-signal px-10 py-3.5 text-sm font-bold text-white transition hover:bg-signal/90">
            <Zap size={18} /> Optimize Resume For This Job
          </button>
        </div>
      </div>

      {/* ── FINAL VERDICT ── */}
      <div className={`rounded-2xl border-2 p-6 shadow-sm ${
        a.overallScore >= 75 ? "border-[#D4A853]/30 bg-[#D4A853]/5" : a.overallScore >= 60 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
      }`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-graphite">Final Verdict</p>
            <h2 className={`mt-2 text-2xl font-extrabold ${
              a.overallScore >= 75 ? "text-[#2C1810]" : a.overallScore >= 60 ? "text-amber-700" : "text-red-700"
            }`}>{a.verdict.recommendation}</h2>
            <div className="mt-3 flex flex-wrap gap-4">
              <span className="text-sm text-graphite">
                <strong>Confidence:</strong> {a.verdict.confidence}
              </span>
              <span className="text-sm text-graphite">
                <strong>Interview Probability:</strong> {a.verdict.interviewProb}
              </span>
            </div>
            {a.verdict.missingCritical.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-bold text-amber-700">Missing critical skills:</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {a.verdict.missingCritical.map((s) => (
                    <span key={s} className="rounded-full border border-amber-300 bg-white px-3 py-0.5 text-xs font-bold text-amber-700">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreCircle label="Overall" score={a.overallScore} subtitle={scoreLabel(a.overallScore)} />
            <button type="button" onClick={handleOptimize}
              className="flex items-center gap-2 rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-white hover:bg-signal/90">
              <Zap size={15} /> Optimize Resume
            </button>
          </div>
        </div>
      </div>

    {/* ── Optimization Modal ── */}
    {showOptModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Loading */}
          {isOptimizing && (
            <div className="px-8 py-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(44,24,16,0.1)" }}>
                <Loader2 size={32} className="animate-spin" style={{ color: "#2C1810" }} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">🤖 Optimizing Resume for This Job…</h2>
              <p className="mt-1 text-sm text-slate-500">Tailoring your resume to match the JD</p>
              <div className="mt-6 space-y-2">
                {OPT_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    i < optStepIdx ? "bg-[#2C1810]/10 text-[#2C1810]" : i === optStepIdx ? "bg-slate-50 text-slate-700" : "text-slate-300"
                  }`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i < optStepIdx ? "text-white" : i === optStepIdx ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-300"
                    }`} style={i < optStepIdx ? { background: "#2C1810" } : i === optStepIdx ? { background: "#D4A853" } : {}}>
                      {i < optStepIdx ? "✓" : i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {!isOptimizing && optimizeResult && !optimizeResult.error && (
            <>
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">✅ Resume Optimized!</h2>
                <p className="text-sm text-slate-500">
                  Tailored for {form.title || "this role"}{form.company ? ` at ${form.company}` : ""}
                </p>
              </div>

              <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Before</p>
                  <p className="text-3xl font-extrabold" style={{ color: scoreRing(optimizeResult.score_before) }}>{optimizeResult.score_before}%</p>
                </div>
                <div className="text-2xl text-slate-300">→</div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">After (est.)</p>
                  <p className="text-3xl font-extrabold" style={{ color: "#2C1810" }}>{optimizeResult.score_after}%</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Improved</p>
                  <p className="text-2xl font-extrabold" style={{ color: "#D4A853" }}>+{optimizeResult.score_after - optimizeResult.score_before}</p>
                  <p className="text-xs text-slate-400">pts</p>
                </div>
              </div>

              {(optimizeResult._changes || []).length > 0 && (
                <div className="mx-6 mt-4 max-h-44 overflow-y-auto space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Changes made</p>
                  {(optimizeResult._changes || []).slice(0, 5).map((c, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3 text-xs">
                      <p className="font-semibold text-slate-700">✓ {c.section || "Bullet"}: {c.reason || "Improved for JD"}</p>
                      {c.improved && <p className="mt-1 italic text-slate-500">"{c.improved.slice(0, 90)}{c.improved.length > 90 ? "…" : ""}"</p>}
                    </div>
                  ))}
                  {(optimizeResult.keywords_added || []).length > 0 && (
                    <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(44,24,16,0.06)" }}>
                      <p className="font-semibold" style={{ color: "#2C1810" }}>
                        ✓ Keywords added: {(optimizeResult.keywords_added || []).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 px-6 pb-6 pt-4">
                <button type="button"
                  onClick={() => {
                    // Close modal FIRST so backdrop-blur doesn't interfere with html2canvas
                    const savedResult = optimizeResult;
                    const savedData   = optimizeResult._resumeData || resumeData;
                    setShowOptModal(false);
                    window.setTimeout(() => {
                      downloadOptimizedResumeUtil(savedResult, savedData).catch(() => {});
                    }, 400);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "#2C1810" }}>
                  <Download size={14} /> Download PDF
                </button>
                <button type="button"
                  onClick={() => { sessionStorage.setItem("hiremind_jd_suggestions", JSON.stringify({ source: "jd-match", missingKeywords: a.missingSkills, role: form.title, company: form.company })); navigate("/app/resume-builder?source=jd-match"); setShowOptModal(false); }}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Open Builder
                </button>
                <button type="button" onClick={() => setShowOptModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">
                  Close
                </button>
              </div>
            </>
          )}

          {/* Error */}
          {!isOptimizing && optimizeResult?.error && (
            <div className="px-6 py-10 text-center">
              <p className="text-lg font-bold text-red-600">Optimization failed</p>
              <p className="mt-2 text-sm text-slate-500">Make sure the backend is running on port 8011.</p>
              <button type="button" onClick={() => setShowOptModal(false)}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScoreCircle({ label, score, subtitle, large = false }) {
  const color = score >= 75 ? "#2C1810" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = large ? 52 : 40; const cx = large ? 68 : 56; const circ = Math.PI * r;
  const h = large ? 80 : 65;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-graphite">{label}</p>
      <svg width={cx * 2} height={h} viewBox={`0 0 ${cx * 2} ${h}`} className="mx-auto mt-3 overflow-visible">
        <path d={`M ${cx - r} ${cx - 4} A ${r} ${r} 0 0 1 ${cx + r} ${cx - 4}`}
          fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cx - 4} A ${r} ${r} 0 0 1 ${cx + r} ${cx - 4}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x={cx} y={cx - 8} textAnchor="middle" fontSize={large ? 22 : 18} fontWeight="800" fill={color}>{score}%</text>
      </svg>
      <p className="text-xs font-semibold text-graphite">{subtitle}</p>
    </div>
  );
}

function SectionScoreBar({ label, score }) {
  const color = score >= 80 ? "bg-[#2C1810]" : score >= 65 ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold capitalize text-ink">{label}</span>
        <span className="text-sm font-extrabold" style={{ color: score >= 80 ? "#2C1810" : score >= 65 ? "#f59e0b" : "#ef4444" }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SkillCard({ title, tone, icon, items, empty }) {
  const bg    = tone === "mint" ? "bg-[#2C1810]/10 text-[#2C1810] border-[#2C1810]/20"
              : tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-blue-50 text-blue-600 border-blue-200";
  const head  = tone === "mint" ? "text-[#2C1810]" : tone === "amber" ? "text-amber-600" : "text-blue-600";
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className={`mb-3 text-sm font-bold ${head}`}>{title} <span className="opacity-60">({items.length})</span></p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((kw) => (
            <span key={kw} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${bg}`}>
              <span>{icon}</span>{kw}
            </span>
          ))}
        </div>
      ) : <p className="text-sm text-graphite italic">{empty}</p>}
    </div>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-sm text-graphite">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-signal" : "text-ink"}`}>{value}</span>
    </div>
  );
}
