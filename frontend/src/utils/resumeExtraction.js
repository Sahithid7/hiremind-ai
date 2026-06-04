/**
 * HireMind AI — Resume Extraction Utilities
 *
 * Priority: use structured fields the backend returns first.
 * Fall back to regex parsing of raw parsed_text only when a field is missing.
 *
 * NO demo / placeholder data is ever inserted. If a field can't be found, it stays empty.
 */

// ── Banned values — never allow these in any field ───────────────────────────
const BANNED = [
  "layla morgan", "emily parker", "sophia ruby", "john doe", "jane doe",
  "hiremind ai", "university name", "college name", "sample user", "demo user",
  "alex rivera",
];

function isBanned(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return BANNED.some((b) => v === b || v.includes(b));
}

function clean(value) {
  const v = String(value ?? "").trim();
  return isBanned(v) ? "" : v;
}

// ── Standard empty form ───────────────────────────────────────────────────────
export const emptyResumeForm = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  projects: "",
  certifications: "",
};

// ── Standard JSON schema (for Review step) ───────────────────────────────────
export function emptyResumeSchema() {
  return {
    personal: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [],         // [{job_title,company,location,start_date,end_date,bullets}]
    education: [],          // [{school,degree,gpa,graduation_date}]
    skills: [],             // string[]
    skills_categorized: {}, // {category: string[]}
    projects: [],           // [{name,technologies,description,bullets}]
    certifications: [],     // string[] — licenses, training only
    achievements: [],       // string[] — leadership impact, key achievements
    awards: [],             // string[] — awards, honors
    publications: [],       // string[] — publications, research
    volunteer: [],          // [{job_title,company,...}] — volunteer experience
    diagnostics: {},        // extraction diagnostics from backend
  };
}

// ── Main entry: extract a structured schema from backend response ─────────────
/**
 * extractResumeSchema takes the raw backend resume object and returns a
 * fully structured ResumeSchema that drives both the Review step and the builder.
 */
export function extractResumeSchema(backendResume, fileName = "") {
  if (!backendResume) return emptyResumeSchema();

  const schema = emptyResumeSchema();
  const text = backendResume.parsed_text ?? "";

  // ── Personal info ─────────────────────────────────────────────────────────
  schema.personal.name     = clean(backendResume.name)     || fallbackName(text, fileName);
  schema.personal.email    = clean(backendResume.email)    || scanEmail(text);
  schema.personal.phone    = clean(backendResume.phone)    || scanPhone(text);
  schema.personal.location = clean(backendResume.location) || scanLocation(text);
  schema.personal.linkedin = clean(backendResume.linkedin) || scanLinkedIn(text);
  schema.personal.github   = clean(backendResume.github)   || scanGitHub(text);

  // Title: use backend field only if short enough; otherwise infer from first job
  // (prevents the full summary sentence from being used as title)
  const rawTitle = clean(backendResume.title);
  schema.personal.title = (rawTitle && rawTitle.length <= 55) ? rawTitle : "";

  // ── Summary ───────────────────────────────────────────────────────────────
  schema.summary = clean(backendResume.summary) || fallbackSummary(text);

  // Defer title inference until after experience is loaded (see below)

  // ── Skills ────────────────────────────────────────────────────────────────
  const rawSkills = backendResume.extracted_skills;
  schema.skills = Array.isArray(rawSkills) && rawSkills.length > 0
    ? rawSkills.filter((s) => !isBanned(s))
    : [];
  schema.skills_categorized = backendResume.skills_categorized ?? {};

  // ── Experience ────────────────────────────────────────────────────────────
  const rawExp = backendResume.extracted_experience;
  schema.experience = Array.isArray(rawExp) && rawExp.length > 0
    ? rawExp
        .map(normalizeExperience)
        .filter((e) => e.job_title || e.company)
    : [];

  // ── Education ─────────────────────────────────────────────────────────────
  const rawEdu = backendResume.extracted_education;
  schema.education = Array.isArray(rawEdu) && rawEdu.length > 0
    ? rawEdu
        .map(normalizeEducation)
        .filter((e) => e.school || e.degree)
    : [];

  // ── Projects ──────────────────────────────────────────────────────────────
  const rawProj = backendResume.extracted_projects;
  schema.projects = Array.isArray(rawProj) && rawProj.length > 0
    ? rawProj
        .map(normalizeProject)
        .filter((p) => p.name)
    : [];

  // ── Certifications ────────────────────────────────────────────────────────
  const rawCerts = backendResume.certifications;
  schema.certifications = Array.isArray(rawCerts)
    ? rawCerts.filter((c) => !isBanned(c) && c.trim().length > 2)
    : [];

  // ── Achievements (Leadership Impact) — SEPARATE from certifications ───────
  const rawAchievements = backendResume.achievements;
  schema.achievements = Array.isArray(rawAchievements)
    ? rawAchievements.filter((a) => !isBanned(a) && a.trim().length > 2)
    : [];

  // ── Awards ────────────────────────────────────────────────────────────────
  const rawAwards = backendResume.awards;
  schema.awards = Array.isArray(rawAwards)
    ? rawAwards.filter((a) => !isBanned(a) && a.trim().length > 2)
    : [];

  // ── Publications ──────────────────────────────────────────────────────────
  const rawPubs = backendResume.publications;
  schema.publications = Array.isArray(rawPubs)
    ? rawPubs.filter((p) => !isBanned(p) && p.trim().length > 2)
    : [];

  // ── Volunteer ─────────────────────────────────────────────────────────────
  const rawVol = backendResume.volunteer;
  schema.volunteer = Array.isArray(rawVol)
    ? rawVol.map(normalizeExperience).filter((v) => v.job_title || v.company)
    : [];

  // ── Extraction diagnostics (pass through for display in Review) ───────────
  schema.diagnostics = backendResume.diagnostics ?? {};

  // ── Title inference (after experience is populated) ───────────────────────
  // If title is still empty or suspiciously long, use the first job title
  if (!schema.personal.title && schema.experience.length > 0) {
    const firstJobTitle = schema.experience[0].job_title || "";
    if (firstJobTitle && firstJobTitle.length <= 55) {
      schema.personal.title = firstJobTitle;
    }
  }

  return schema;
}

// ── Normalizers (handle both old and new backend shapes) ─────────────────────

function normalizeExperience(raw) {
  if (!raw) return { job_title: "", company: "", location: "", start_date: "", end_date: "", bullets: [] };

  // AI now returns "job_title" directly. Fall back to "title" for older responses.
  return {
    job_title:  clean(raw.job_title  ?? raw.title ?? raw.role ?? ""),
    company:    clean(raw.company    ?? ""),
    location:   clean(raw.location   ?? ""),
    start_date: clean(raw.start_date ?? ""),
    end_date:   clean(raw.end_date   ?? "") || "Present",
    bullets:    Array.isArray(raw.bullets) ? raw.bullets.filter((b) => typeof b === "string" && b) : [],
  };
}

function normalizeEducation(raw) {
  if (!raw) return { school: "", degree: "", gpa: "", graduation_date: "", coursework: "" };

  // Backend remaps institution → school, field_of_study → field
  return {
    school:          clean(raw.school ?? raw.institution ?? raw.title ?? ""),
    degree:          clean(raw.degree ?? (Array.isArray(raw.details) ? raw.details[0] : "") ?? ""),
    gpa:             clean(raw.gpa ?? ""),
    graduation_date: clean(raw.graduation_date ?? ""),
    coursework:      typeof raw.coursework === "string" ? raw.coursework : "",
  };
}

function normalizeProject(raw) {
  if (!raw) return { name: "", technologies: "", description: "", bullets: [] };
  return {
    name:         clean(raw.name ?? raw.title ?? ""),
    technologies: clean(raw.technologies ?? raw.tech ?? ""),
    description:  clean(raw.description ?? ""),
    bullets:      Array.isArray(raw.bullets) ? raw.bullets.filter(Boolean) : [],
  };
}

// ── Convert schema → ResumeForm (flat strings for the form/builder) ───────────
/**
 * schemaToForm converts a ResumeSchema into the flat string-based form
 * that ResumeExpert and ResumeBuilder use for their text fields.
 */
export function schemaToForm(schema) {
  if (!schema) return emptyResumeForm;

  const expLines = (schema.experience ?? []).map(formatExperience).join("\n\n");
  const eduLines = (schema.education  ?? []).map(formatEducation).join("\n\n");
  const projLines = (schema.projects  ?? []).map(formatProject).join("\n\n");

  const skillsFlat = (schema.skills ?? []).join(", ");

  return {
    name:         schema.personal?.name ?? "",
    title:        schema.personal?.title ?? "",
    email:        schema.personal?.email ?? "",
    phone:        schema.personal?.phone ?? "",
    location:     schema.personal?.location ?? "",
    linkedin:     schema.personal?.linkedin ?? "",
    website:      schema.personal?.github ?? "",
    summary:      schema.summary ?? "",
    experience:   expLines,
    education:    eduLines,
    skills:       skillsFlat,
    projects:     projLines,
    certifications: (schema.certifications ?? []).join("\n"),
  };
}

function formatExperience(exp) {
  const header = [
    exp.job_title,
    exp.company ? `${exp.company}` : "",
    exp.location,
  ].filter(Boolean).join(" | ");

  const dates = [exp.start_date, exp.end_date].filter(Boolean).join(" – ");
  const headerLine = dates ? `${header} | ${dates}` : header;

  const bullets = (exp.bullets ?? []).map((b) => `• ${b}`).join("\n");
  return bullets ? `${headerLine}\n${bullets}` : headerLine;
}

function formatEducation(edu) {
  const parts = [edu.degree, edu.school].filter(Boolean);
  const yearGpa = [edu.graduation_date, edu.gpa ? `GPA: ${edu.gpa}` : ""].filter(Boolean).join(" | ");
  const main = parts.join(" — ");
  return yearGpa ? `${main}\n${yearGpa}` : main;
}

function formatProject(proj) {
  const headerParts = [proj.name];
  if (proj.technologies) headerParts.push(proj.technologies);
  const header = headerParts.join(" | ");
  const desc = proj.description ? `${proj.description}` : "";
  const bullets = (proj.bullets ?? []).map((b) => `• ${b}`).join("\n");
  return [header, desc, bullets].filter(Boolean).join("\n");
}

// ── Legacy adapter: extractResumeProfile (backward-compatible) ───────────────
/**
 * extractResumeProfile is the original function signature, kept for
 * backward compatibility with pages that still call it.
 * It now delegates to extractResumeSchema + schemaToForm.
 */
export function extractResumeProfile(resumeOrText = "", fileName = "") {
  // If it's a string (raw text), wrap it so the pipeline can work
  const backendResume = typeof resumeOrText === "string"
    ? { parsed_text: resumeOrText, extracted_skills: [], extracted_experience: [],
        extracted_education: [], extracted_projects: [], certifications: [],
        name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", summary: "" }
    : resumeOrText;

  const schema = extractResumeSchema(backendResume, fileName);
  return schemaToForm(schema);
}

// ── Fallback regex scanners (only used when backend field is empty) ────────────

function fallbackName(text, fileName) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (looksLikeName(line)) return line;
  }
  return cleanFileName(fileName);
}

function fallbackTitle(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    // Must look like a title AND be short enough to be a title (not a summary sentence)
    if (looksLikeTitle(line) && line.length <= 55 && !line.includes(",")) return line;
  }
  return "";
}

function fallbackSummary(text) {
  const normalized = text.toLowerCase();
  const sumIdx = ["summary", "professional summary", "profile", "about"].reduce((best, kw) => {
    const i = normalized.indexOf(kw);
    return i >= 0 && (best === -1 || i < best) ? i : best;
  }, -1);
  if (sumIdx === -1) return "";
  const rest = text.slice(sumIdx);
  const lines = rest.split("\n").slice(1).map((l) => l.trim()).filter(Boolean);
  const body = [];
  for (const line of lines) {
    if (isHeadingLine(line)) break;
    body.push(line);
    if (body.join(" ").length > 600) break;
  }
  return body.join(" ").trim();
}

function scanEmail(text) {
  const m = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : "";
}

function scanPhone(text) {
  const m = text.match(/(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)\d{3}[\s.\-]?\d{4}/);
  return m ? m[0].trim() : "";
}

function scanLocation(text) {
  const m = text.match(/\b[A-Z][a-zA-Z .'-]+,\s*[A-Z]{2}\b/);
  return m ? m[0] : "";
}

function scanLinkedIn(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_.\-/]+/i);
  return m ? m[0].replace(/\/$/, "") : "";
}

function scanGitHub(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_.\-]+/i);
  return m ? m[0].replace(/\/$/, "") : "";
}

function looksLikeName(line) {
  if (!line || line.length > 50 || isBanned(line)) return false;
  if (/[\d@/:|•]/.test(line)) return false;
  if (/\b(university|college|school|bachelor|master|doctor|b\.s|m\.s|ph\.d|mba|engineer|developer|analyst|manager)\b/i.test(line)) return false;
  if (isHeadingLine(line)) return false;
  const words = line.split(/\s+/);
  return words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Z][a-zA-Z'.-]*$/.test(w));
}

function looksLikeTitle(line) {
  return /\b(engineer|developer|analyst|manager|designer|consultant|specialist|coordinator|intern|student|graduate|architect|administrator|scientist|researcher|director|lead|associate|senior|junior)\b/i.test(line);
}

function isHeadingLine(line) {
  const headings = ["experience", "education", "skills", "projects", "certifications",
    "summary", "profile", "objective", "awards", "publications", "references"];
  const norm = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return headings.some((h) => norm === h || norm === h + "s");
}

function cleanFileName(fileName = "") {
  const cleaned = fileName
    .replace(/\.(pdf|docx|doc)$/i, "")
    .replace(/resume|cv|final|updated|copy|\d+/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return looksLikeName(cleaned) ? toTitleCase(cleaned) : "";
}

function toTitleCase(v) {
  return v.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

// ── Legacy helpers still imported by other files ──────────────────────────────

export function sanitizeResumeForm(form = {}) {
  const next = { ...emptyResumeForm, ...form };
  for (const key of Object.keys(next)) {
    const val = String(next[key] ?? "").trim();
    next[key] = isBanned(val) ? "" : val;
  }
  return next;
}

export function validateGeneratedResume(resume) {
  const candidate = String(resume?.candidate ?? "").trim();
  const email = String(resume?.contact?.email ?? "").trim();
  if (!candidate || isBanned(candidate)) {
    return { ok: false, message: "Please add your name before exporting." };
  }
  return { ok: true, message: "" };
}

export function buildResumeFromForm(form, template = {}) {
  const f = sanitizeResumeForm(form);
  return {
    id:           template.id,
    name:         template.name,
    role:         template.role,
    category:     template.category,
    tags:         template.tags,
    style:        template.style,
    accent:       template.accent || "#14B87A",
    candidate:    f.name,
    title:        f.title,
    contact: {
      location: f.location,
      email:    f.email,
      phone:    f.phone,
      linkedin: f.linkedin,
      website:  f.website,
    },
    summary:          f.summary,
    achievements:     splitLines(f.certifications),
    experience:       parseExperienceText(f.experience),
    education:        splitLines(f.education),
    skills:           splitCommaOrLines(f.skills),
    projects:         splitProjectText(f.projects),
    certifications:   splitCommaOrLines(f.certifications),
  };
}

export function parseExperienceText(text = "") {
  const lines = splitLines(text);
  if (!lines.length) return [];

  const jobs = [];
  let current = null;

  for (const rawLine of lines) {
    const isBullet = /^[•\-*▸►▪]/.test(rawLine.trim());
    const line = rawLine.replace(/^[•\-*▸►▪]\s*/, "").trim();
    if (!line) continue;

    // Date range → job header
    const dateRange = line.match(
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—to]+\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/i
    );

    if (!isBullet && dateRange) {
      if (current) jobs.push(current);
      const cleaned = line.replace(dateRange[0], "").replace(/[|,]\s*$/, "").trim();
      const parts = cleaned.split(/\s*[|·]\s*/);
      current = {
        role:     parts[0]?.trim() || "Role",
        company:  parts[1]?.trim() || "",
        location: parts[2]?.trim() || "",
        date:     dateRange[0].trim(),
        bullets:  [],
      };
    } else if (current) {
      current.bullets.push(line);
    } else {
      // Before first date — start a job entry
      current = { role: line, company: "", location: "", date: "", bullets: [] };
    }
  }

  if (current) jobs.push(current);
  return jobs
    .map((j) => ({ ...j, bullets: j.bullets.slice(0, 8) }))
    .slice(0, 6);
}

// ── Internal string helpers ───────────────────────────────────────────────────

function splitLines(text = "") {
  return String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
}

function splitCommaOrLines(text = "") {
  return String(text || "").split(/[\n,|;]+/).map((i) => i.trim()).filter(Boolean);
}

function splitProjectText(text = "") {
  if (!text?.trim()) return [];

  // Primary: split on blank lines (format produced by structured card editor)
  const blankBlocks = text.split(/\n[ \t]*\n/).map((b) => b.trim()).filter(Boolean);
  if (blankBlocks.length > 1) {
    return blankBlocks
      .map((block) => {
        const lines = block.split("\n");
        return lines.map((l, i) => {
          if (i === 0) return l.trim();
          const cleaned = l.replace(/^[•\-*▸]\s*/, "").trim();
          return cleaned ? `• ${cleaned}` : null;
        }).filter(Boolean).join("\n");
      })
      .filter(Boolean)
      .slice(0, 8);
  }

  // Fallback: original pipe-separator logic (Name | Tech format)
  const lines = splitLines(text);
  if (!lines.length) return [];
  const projs = [];
  let current = "";

  for (const line of lines) {
    const isBullet = /^[•\-*▸]\s+/.test(line);
    const cleaned  = line.replace(/^[•\-*▸]\s*/, "").trim();
    if (!cleaned) continue;

    const startsNew = !isBullet && (
      /^[A-Z][A-Za-z0-9 +/#&().\-]{3,90}[|]\s+/.test(cleaned)
    );

    if (startsNew && current) {
      projs.push(current);
      current = cleaned;
    } else if (isBullet) {
      current = current ? `${current}\n• ${cleaned}` : `• ${cleaned}`;
    } else if (current) {
      current = `${current} ${cleaned}`;
    } else {
      current = cleaned;
    }
  }
  if (current) projs.push(current);
  return projs.slice(0, 8);
}

// ── AI Resume Completeness Validator ─────────────────────────────────────────
/**
 * Frontend mirror of the backend validate_resume_completeness function.
 * Runs against the AI-parsed JSON to surface which checks passed/failed.
 *
 * @param {string} originalText  – raw resume text
 * @param {object} generated     – AI-returned JSON (contact, experience, projects, education, skills)
 * @param {number} [roleHint]    – expected role count from Python parser
 * @returns {{ checks: Record<string,boolean>, failed: string[], passed: boolean }}
 */
export function validateResumeCompleteness(originalText = "", generated = {}, roleHint = 0) {
  function countJobsInOriginal(text) {
    const dateRange = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\s*[-–—to]+\s*(?:Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/gi;
    return (text.match(dateRange) || []).length;
  }
  function countProjectsInOriginal(text) {
    const projDate = /^.{5,60}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*$/gim;
    return (text.match(projDate) || []).length;
  }

  const expCount  = (generated.experience ?? []).length;
  const projCount = (generated.projects   ?? []).length;
  const eduCount  = (generated.education  ?? []).length;
  const expected  = roleHint > 0 ? roleHint : countJobsInOriginal(originalText);
  const expProj   = countProjectsInOriginal(originalText);

  const checks = {
    hasContact:            !!(generated.contact?.email || generated.contact?.name),
    hasExperience:         expCount > 0,
    experienceCountMatches:expCount >= Math.max(1, expected),
    hasProjects:           projCount > 0 || expProj === 0,
    projectCountMatches:   projCount >= expProj || expProj === 0,
    hasEducation:          eduCount > 0,
    hasSkills:             !!(generated.skills),
    hasSummary:            !!(generated.summary),
  };

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (failed.length > 0) {
    console.warn("Resume completeness check failed. Missing:", failed);
  }

  return { checks, failed, passed: failed.length === 0 };
}

// ── Extraction Confidence Checker ─────────────────────────────────────────────
/**
 * Analyses an extracted ResumeSchema and the raw parsed_text for quality issues.
 * Returns a list of warnings the user should review before continuing.
 *
 * Each warning: { section, type, severity, message }
 * severity: "error" | "warning" | "info"
 */
export function checkExtractionConfidence(schema, rawText = "") {
  const warnings = [];
  const raw = rawText.toLowerCase();

  // ── Spaced-character artifact detection ─────────────────────────────────
  const spacedCharRe = /\b[A-Z] [A-Z] [A-Z]\b/;
  if (spacedCharRe.test(rawText)) {
    warnings.push({
      section: "general",
      type: "formatting",
      severity: "warning",
      message:
        "PDF text extraction detected possible character-spacing artifacts (e.g. 'P R O F E S S I O N A L'). Section headings and words may not have been read correctly. Review all sections carefully.",
    });
  }

  // ── Truncated bullets ────────────────────────────────────────────────────
  const TRUNCATION_ENDINGS = /\b(by|and|or|the|a|an|to|with|for|in|of|at|on|using|via|through|,)\s*$/i;
  let truncatedCount = 0;
  for (const exp of schema.experience ?? []) {
    for (const bullet of exp.bullets ?? []) {
      if (TRUNCATION_ENDINGS.test(bullet.trim())) {
        truncatedCount++;
      }
    }
  }
  if (truncatedCount > 0) {
    warnings.push({
      section: "experience",
      type: "truncated",
      severity: "error",
      message: `${truncatedCount} experience bullet${truncatedCount > 1 ? "s appear" : " appears"} to be cut off mid-sentence. Open the experience section and complete the missing text.`,
    });
  }

  // ── Missing summary ──────────────────────────────────────────────────────
  if (!schema.summary?.trim() && (raw.includes("summary") || raw.includes("profile") || raw.includes("objective"))) {
    warnings.push({
      section: "summary",
      type: "empty",
      severity: "warning",
      message: "A summary/profile section was detected in the original but could not be extracted. Paste your summary manually.",
    });
  }

  // ── Missing experience ───────────────────────────────────────────────────
  if (
    (schema.experience ?? []).length === 0 &&
    (raw.includes("experience") || raw.includes("engineer") || raw.includes("developer") || raw.includes("intern"))
  ) {
    warnings.push({
      section: "experience",
      type: "empty",
      severity: "error",
      message: "Work experience was detected in the original but no jobs were extracted. Review and add manually.",
    });
  }

  // ── Jobs with no bullets ─────────────────────────────────────────────────
  const emptyJobBullets = (schema.experience ?? []).filter(
    (e) => (e.job_title || e.company) && (e.bullets ?? []).length === 0
  );
  if (emptyJobBullets.length > 0) {
    warnings.push({
      section: "experience",
      type: "missing_bullets",
      severity: "warning",
      message: `${emptyJobBullets.length} job entr${emptyJobBullets.length > 1 ? "ies have" : "y has"} no bullet points extracted. Add your key achievements for each role.`,
    });
  }

  // ── Missing education ────────────────────────────────────────────────────
  if (
    (schema.education ?? []).length === 0 &&
    (raw.includes("education") || raw.includes("university") || raw.includes("college") || raw.includes("bachelor") || raw.includes("master"))
  ) {
    warnings.push({
      section: "education",
      type: "empty",
      severity: "warning",
      message: "Education was detected in the original but not extracted. Add your degree and school manually.",
    });
  }

  // ── Education missing dates ───────────────────────────────────────────────
  const eduMissingDate = (schema.education ?? []).filter((e) => !e.graduation_date);
  if (eduMissingDate.length > 0) {
    warnings.push({
      section: "education",
      type: "incomplete",
      severity: "info",
      message: `${eduMissingDate.length} education entr${eduMissingDate.length > 1 ? "ies are" : "y is"} missing a graduation date.`,
    });
  }

  // ── Missing skills ───────────────────────────────────────────────────────
  if ((schema.skills ?? []).length === 0) {
    warnings.push({
      section: "skills",
      type: "empty",
      severity: "warning",
      message: "No skills were extracted. Add your technical skills manually.",
    });
  }

  // ── Very few skills ──────────────────────────────────────────────────────
  if ((schema.skills ?? []).length > 0 && (schema.skills ?? []).length < 5) {
    warnings.push({
      section: "skills",
      type: "incomplete",
      severity: "info",
      message: `Only ${schema.skills.length} skill${schema.skills.length > 1 ? "s" : ""} extracted. Your skills section may have had a non-standard format.`,
    });
  }

  // ── Missing contact fields ────────────────────────────────────────────────
  const missingContact = [];
  if (!schema.personal?.name)  missingContact.push("name");
  if (!schema.personal?.email) missingContact.push("email");
  if (missingContact.length > 0) {
    warnings.push({
      section: "personal",
      type: "missing_contact",
      severity: missingContact.includes("name") ? "error" : "warning",
      message: `${missingContact.join(" and ")} could not be extracted from the resume. Please fill in manually.`,
    });
  }

  return warnings;
}

/**
 * Compute overall confidence score (0–100) from warnings.
 */
export function confidenceScore(warnings) {
  if (!warnings.length) return 100;
  const errorPenalty   = warnings.filter((w) => w.severity === "error").length   * 20;
  const warningPenalty = warnings.filter((w) => w.severity === "warning").length * 10;
  const infoPenalty    = warnings.filter((w) => w.severity === "info").length    *  5;
  return Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty);
}
