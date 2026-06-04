import html2pdf from "html2pdf.js";
import { renderATSClean } from "../components/ResumeTemplateRenderer";

/**
 * Convert the resume schema to the person format expected by renderATSClean,
 * then download it as a PDF using html2pdf.js.
 */
export async function downloadResumePDF(schema, overrideFilename = null) {
  const person = schemaToPerson(schema);
  const html   = renderATSClean(person);

  const firstName = schema.personal?.name?.trim().split(/\s+/)[0] || "Resume";
  const lastName  = schema.personal?.name?.trim().split(/\s+/).slice(1).join("_") || "";
  const filename  = overrideFilename || (lastName ? `${firstName}_${lastName}_Resume.pdf` : `${firstName}_Resume.pdf`);

  const element = document.createElement("div");
  element.innerHTML = html;
  element.style.position = "absolute";
  element.style.left = "-9999px";
  document.body.appendChild(element);

  const opts = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename,
    image:      { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:       { unit: "in", format: "letter", orientation: "portrait" },
    pagebreak:   { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(opts).from(element).save();
  } finally {
    document.body.removeChild(element);
  }
}

// ── Map ResumeSchema → person object for the ATS Clean template ──────────────

function schemaToPerson(schema) {
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
      degree:    e.degree          || "",
      school:    e.school          || "",
      duration:  e.graduation_date || "",
      gpa:       e.gpa             || "",
      coursework: typeof e.coursework === "string" ? e.coursework : "",
    })),

    projects: (schema.projects ?? []).map((p) => ({
      name:    p.name         || "",
      date:    p.date         || "",
      tech:    p.technologies || "",
      bullets: p.bullets      ?? [],
    })),

    skills:            schema.skills            ?? [],
    skills_categorized: schema.skills_categorized ?? {},
    certifications:    schema.certifications    ?? [],
  };
}

// ── Download an AI-optimized resume as ATS-Clean PDF ─────────────────────────
// Delegates to downloadResumePDF (the proven working path) after building a schema.

export async function downloadOptimizedResume(optimizedData, rawResumeData) {
  // Merge optimized bullets by company name
  const fixedBulletsMap = {};
  for (const fe of (optimizedData?.experience || [])) {
    const key = (fe.company || "").trim();
    if (key) fixedBulletsMap[key] = fe.bullets || [];
  }

  // Support both /extract API format (extracted_experience) and payload format (experience)
  const expArr  = (rawResumeData?.extracted_experience  || []).length ? rawResumeData.extracted_experience  : (rawResumeData?.experience  || []);
  const eduArr  = (rawResumeData?.extracted_education   || []).length ? rawResumeData.extracted_education   : (rawResumeData?.education   || []);
  const projArr = (rawResumeData?.extracted_projects    || []).length ? rawResumeData.extracted_projects    : (rawResumeData?.projects    || []);
  const skills  = (rawResumeData?.extracted_skills      || []).length ? rawResumeData.extracted_skills      : (rawResumeData?.skills      || []);

  // Build the same wizard-schema format that downloadResumePDF expects
  const schema = {
    personal: {
      name:     rawResumeData?.name     || "",
      title:    rawResumeData?.title    || "",
      email:    rawResumeData?.email    || "",
      phone:    rawResumeData?.phone    || "",
      location: rawResumeData?.location || "",
      linkedin: rawResumeData?.linkedin || "",
      github:   rawResumeData?.github   || "",
    },
    summary: optimizedData?.summary || rawResumeData?.summary || "",
    experience: expArr.map((e) => ({
      job_title:  e.title || e.job_title || "",
      company:    e.company    || "",
      location:   e.location   || "",
      start_date: e.start_date || e.start || "",
      end_date:   e.end_date   || e.end   || "",
      bullets:    fixedBulletsMap[(e.company || "").trim()] ?? e.bullets ?? [],
    })),
    education: eduArr.map((e) => ({
      school:          e.school          || e.institution || "",
      degree:          e.degree          || "",
      graduation_date: e.graduation_date || e.end_date    || "",
      gpa:             e.gpa             || "",
      coursework:      typeof e.coursework === "string" ? e.coursework : "",
    })),
    skills,
    skills_categorized: rawResumeData?.skills_categorized || {},
    projects: projArr.map((p) => ({
      name:         p.name         || "",
      technologies: p.technologies || p.tech || "",
      date:         p.date         || "",
      bullets:      p.bullets      || [],
    })),
    certifications: rawResumeData?.certifications || [],
  };

  // Build filename
  const nameParts = (schema.personal.name || "Candidate").trim().split(/\s+/);
  const filename  = nameParts.join("_") + "_Optimized_Resume.pdf";

  // Delegate to downloadResumePDF — uses the exact same render pipeline that works
  await downloadResumePDF(schema, filename);
}
