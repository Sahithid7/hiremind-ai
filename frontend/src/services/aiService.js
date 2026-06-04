import { api } from "./api";

export async function analyzeResume(resumeId) {
  const { data } = await api.post(`/analysis/resume/${resumeId}`);
  return data;
}

export async function matchJobDescription(payload) {
  const { data } = await api.post("/analysis/job-match", payload);
  return data;
}

export async function generateInterviewQuestions(payload) {
  const { data } = await api.post("/interview/generate", payload);
  return data;
}

export async function generateRoadmap(payload) {
  const { data } = await api.post("/analysis/roadmap", payload);
  return data;
}

/**
 * Rewrite a resume into ATS-optimised structured JSON.
 * @param {string} resumeText  - Raw text of the resume
 * @param {string} [jdText]    - Optional job description for keyword tailoring
 */
/**
 * Parse a resume with the precision AI prompt.
 * Returns better-structured data than the Python parser — handles multiple
 * roles per company, proper date extraction, and categorized skills.
 * @param {string} resumeText     - Raw resume text
 * @param {number} [roleCountHint] - Python parser's experience count (used in verification prompt)
 */
export async function parseResumeWithAi(resumeText, roleCountHint = 0) {
  const { data } = await api.post("/resume/parse-ai", {
    resume_text: resumeText,
    role_count_hint: roleCountHint,
  }, { timeout: 90000 });
  return data;  // { parsed: {...}, message: "..." }
}

export async function improveSummary(summaryText, jobTitle = "", skills = []) {
  const { data } = await api.post("/resume/improve-summary", {
    summary_text: summaryText,
    job_title:    jobTitle,
    skills:       skills.slice(0, 20),
  }, { timeout: 30000 });
  return data; // { improved_summary, message }
}

export async function rewriteResumeAts(resumeText, jdText = "") {
  const { data } = await api.post("/resume/rewrite", {
    resume_text: resumeText,
    jd_text: jdText || null,
  }, { timeout: 90000 });  // allow up to 90s for GPT rewrite
  return data;  // { rewritten: {...}, message: "..." }
}

export async function improveBullet(bullet, jobTitle = "", company = "") {
  const { data } = await api.post("/resume/improve-bullet", {
    bullet,
    job_title: jobTitle,
    company,
  }, { timeout: 30000 });
  return data; // { improved_bullet: "..." }
}

export async function getAiReview(resumeData) {
  const { data } = await api.post("/resume/ai-review", {
    resume_data: resumeData,
  }, { timeout: 60000 });
  return data; // { overall_score, strengths, improvements, missing_keywords, ats_tips }
}

export async function autoFixAts(resumeText, issues, missingKeywords, resumeData) {
  const { data } = await api.post("/resume/auto-fix-ats", {
    resume_text:      resumeText      || "",
    issues:           issues          || [],
    missing_keywords: missingKeywords || [],
    resume_data:      resumeData      || {},
  }, { timeout: 90000 });
  return data;
}

export async function optimizeResumeForJob(resumeText, resumeData, jobDescription, missingKeywords, matchScore = 0) {
  const { data } = await api.post("/resume/optimize-for-job", {
    resume_text:      resumeText      || "",
    resume_data:      resumeData      || {},
    job_description:  jobDescription  || "",
    missing_keywords: missingKeywords || [],
    match_score:      matchScore      || 0,
  }, { timeout: 90000 });
  return data;
}

export async function rewriteBullets(bullets, jobTitle = "", company = "") {
  const { data } = await api.post("/resume/rewrite-bullets", {
    bullets,
    job_title: jobTitle,
    company,
  }, { timeout: 30000 });
  return data; // { rewritten_bullets: [...] }
}
