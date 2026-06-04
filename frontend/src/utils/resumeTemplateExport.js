/**
 * HireMind AI — Premium Resume Template Engine  Phase 4
 * Professional layout, smart page-fit, categorized skills, badge tech stacks.
 */

// ── HTML safe encode ──────────────────────────────────────────────────────────
const safe = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// ── Array helpers ─────────────────────────────────────────────────────────────
const clean = (items = []) =>
  Array.isArray(items) ? items.map((i) => String(i ?? "").trim()).filter(Boolean) : [];

const dedupe = (items = []) => {
  const seen = new Set();
  return clean(items).filter((i) => {
    const k = i.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ── Normalize resume object ───────────────────────────────────────────────────
function normalize(r = {}) {
  return {
    ...r,
    accent:         r.accent || "#1e3a5f",
    candidate:      r.candidate || "",
    title:          r.title || "",
    contact:        r.contact || {},
    summary:        r.summary || "",
    achievements:   clean(r.achievements),   // Leadership Impact — separate from certs
    awards:         clean(r.awards),          // Awards & Honors
    publications:   clean(r.publications),    // Publications
    volunteer:      Array.isArray(r.volunteer) ? r.volunteer : [],
    skills:         dedupe(r.skills),
    education:      clean(r.education),
    projects:       clean(r.projects),
    certifications: dedupe(r.certifications),
    experience: Array.isArray(r.experience)
      ? r.experience.map((j) => ({
          role:     j?.role || j?.job_title || "",
          company:  j?.company || "",
          location: j?.location || "",
          date:     j?.date || (j?.start_date ? `${j.start_date} – ${j.end_date || "Present"}` : ""),
          bullets:  clean(j?.bullets),
        })).filter((j) => j.role || j.company)
      : [],
  };
}

// ── Skill categorization ──────────────────────────────────────────────────────
// 6-category skill grouping matching resume conventions
const CAT_MAP = {
  "Languages":             ["python","java","javascript","typescript","go","golang","rust","c++","c#","sql","bash","r","scala","swift","kotlin","matlab","perl","php","ruby"],
  "Software Development":  ["object-oriented programming","oop","data structures","algorithms","data structures & algorithms","rest apis","rest api","backend development","api development","sdlc","microservices","debugging","unit testing","agile methodologies","agile","scrum","kanban","tdd","bdd"],
  "Frameworks":            ["react","angular","vue","node","node.js","django","flask","fastapi","spring","laravel","nextjs","express","pandas","numpy","scikit","pytorch","tensorflow","keras"],
  "Cloud & DevOps":        ["aws","azure","gcp","google cloud","ec2","s3","lambda","ecr","cloudwatch","docker","kubernetes","k8s","jenkins","terraform","ansible","github actions","gitlab","openshift","ci/cd","helm","cloudformation"],
  "Databases":             ["mysql","postgresql","mongodb","redis","sqlite","cassandra","elasticsearch","oracle","snowflake","dynamodb","bigquery"],
  "AI / ML":               ["machine learning","deep learning","openai","llm","langchain","prompt engineering","nlp","scikit-learn","pytorch","tensorflow","keras","hugging face","rag"],
  "Tools":                 ["git","github","linux","unix","vs code","eclipse","splunk","dynatrace","jira","postman","figma","confluence","grafana","prometheus","datadog"],
};

function categorizeSkills(skills) {
  const cats = {};
  const assigned = new Set();

  for (const [cat, keywords] of Object.entries(CAT_MAP)) {
    for (const skill of skills) {
      if (assigned.has(skill)) continue;
      const sl = skill.toLowerCase();
      if (keywords.some((k) => sl.includes(k) || (k.length > 3 && k.includes(sl)))) {
        cats[cat] = cats[cat] || [];
        cats[cat].push(skill);
        assigned.add(skill);
      }
    }
  }
  // Remaining → Tools
  for (const skill of skills) {
    if (!assigned.has(skill)) {
      cats["Tools"] = cats["Tools"] || [];
      cats["Tools"].push(skill);
      assigned.add(skill);
    }
  }
  return Object.fromEntries(Object.entries(cats).filter(([, v]) => v.length > 0));
}

// ── Shared HTML builders ──────────────────────────────────────────────────────

// Section heading
function secH(label, acc) {
  return `<div style="font-size:9.5px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:${acc};border-bottom:1.8px solid ${acc};padding-bottom:5px;margin:18px 0 11px;">${safe(label)}</div>`;
}

// Compact section heading (less top margin — used in 2-col layout)
function secHCompact(label, acc) {
  return `<div style="font-size:9.5px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:${acc};border-bottom:1.8px solid ${acc};padding-bottom:4px;margin:10px 0 9px;">${safe(label)}</div>`;
}

// Contact line horizontal — URLs truncated for clean display
function contactLine(r) {
  const items = [
    r.contact?.location,
    r.contact?.email,
    r.contact?.phone,
    r.contact?.linkedin ? trimUrl(r.contact.linkedin) : (r.contact?.website ? trimUrl(r.contact.website) : null),
  ].filter(Boolean);
  return items.map(safe).join(" &nbsp;<span style='color:#cbd5e1;font-size:10px;'>|</span>&nbsp; ");
}

// Trim URL to display-friendly form: remove https://www., truncate if >40 chars
function trimUrl(url) {
  if (!url) return "";
  const cleaned = String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return cleaned.length > 42 ? cleaned.substring(0, 40) + "…" : cleaned;
}

// Job block
function jobBlock(j, acc) {
  const bullets = j.bullets.map((b) =>
    `<div style="font-size:11px;color:#222;margin:1px 0 3px 14px;line-height:1.52;">&#8226; ${safe(b)}</div>`
  ).join("");
  return `<div style="margin-bottom:13px;"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;"><div><span style="font-size:12.5px;font-weight:800;color:#0f172a;">${safe(j.role)}</span>${j.company ? `<span style="font-size:12px;color:${acc};font-weight:700;"> · ${safe(j.company)}</span>` : ""}${j.location ? `<span style="font-size:10.5px;color:#94a3b8;"> · ${safe(j.location)}</span>` : ""}</div><span style="font-size:10.5px;color:#64748b;white-space:nowrap;background:#f8fafc;border:1px solid #e2e8f0;padding:1px 8px;border-radius:4px;">${safe(j.date)}</span></div>${bullets}</div>`;
}

// Education block (handles both object and string forms)
function eduBlock(item, acc) {
  if (typeof item === "object" && item !== null && "degree" in item) {
    return `
<div style="margin-bottom:10px;">
  <div style="font-size:12px;font-weight:800;color:#0f172a;">${safe(item.degree)}</div>
  <div style="font-size:11.5px;color:${acc};font-weight:600;">${safe(item.school)}</div>
  <div style="font-size:10.5px;color:#64748b;margin-top:2px;">${item.graduation_date ? safe(item.graduation_date) : ""}${item.gpa ? ` &nbsp;·&nbsp; GPA: ${safe(item.gpa)}` : ""}</div>
</div>`;
  }
  const text = String(item || "");
  const dash = text.indexOf(" — ");
  const main = dash >= 0 ? text.substring(0, dash) : text;
  const sub  = dash >= 0 ? text.substring(dash + 3) : "";
  return `<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:800;color:#0f172a;">${safe(main)}</div>${sub ? `<div style="font-size:10.5px;color:#64748b;">${safe(sub)}</div>` : ""}</div>`;
}

// Project block with badge tech stack + bullets
function projBlock(item) {
  const lines   = String(item || "").split("\n");
  const header  = lines[0] || "";
  const pipeIdx = header.indexOf("|");
  const name    = pipeIdx >= 0 ? header.substring(0, pipeIdx).trim() : header.trim();
  const tech    = pipeIdx >= 0 ? header.substring(pipeIdx + 1).trim() : "";
  const bullets = lines.slice(1).map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);

  // Tech stack as small colored badges
  const badges = tech
    ? tech.split(",").map((t) => t.trim()).filter(Boolean)
        .map((t) => `<span style="display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:1px 8px;border-radius:20px;font-size:9.5px;font-weight:700;margin:1px 2px;">${safe(t)}</span>`)
        .join("")
    : "";

  const bHtml = bullets
    .map((b) => `<div style="font-size:11px;color:#222;margin:1px 0 3px 14px;line-height:1.52;">&#8226; ${safe(b)}</div>`)
    .join("");

  return `<div style="margin-bottom:13px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:4px;"><span style="font-size:12.5px;font-weight:800;color:#0f172a;">${safe(name || "Project")}</span>${badges ? `<div style="display:flex;flex-wrap:wrap;gap:2px;">${badges}</div>` : ""}</div>${bHtml}</div>`;
}

// Flat skill pills (for sidebar use)
function skillPills(skills, pillBg, pillColor) {
  return dedupe(skills).map((s) =>
    `<span style="display:inline-block;padding:2px 9px;border-radius:20px;background:${pillBg};color:${pillColor};font-size:10px;font-weight:600;margin:2px 2px;">${safe(s)}</span>`
  ).join("");
}

// Categorized skill rows (for single-column templates)
function skillCategoryRows(skills, acc) {
  const cats = categorizeSkills(skills);
  return Object.entries(cats).map(([cat, items]) => `
<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
  <span style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;min-width:80px;flex-shrink:0;padding-top:2px;">${safe(cat)}</span>
  <span style="font-size:11px;color:#334155;line-height:1.6;flex:1;">${items.map(safe).join(" &middot; ")}</span>
</div>`).join("");
}

// ── Base CSS ──────────────────────────────────────────────────────────────────
function baseCSS(accent, opts = {}) {
  const fit  = opts.fitOnePage === true;

  // Fit-to-page: force smallest readable font + tightest line height
  const fs   = fit ? "9.5px" : (opts.fontSize === "small" ? "10px" : opts.fontSize === "large" ? "12px" : "11px");
  const lh   = fit ? "1.32"  : (opts.spacing  === "compact" ? "1.35" : opts.spacing === "spacious" ? "1.6" : "1.45");

  // Zoom: use fitZoom if provided, otherwise 0.90 when fitting (reliable in Chrome headless)
  const zoom  = fit ? (opts.fitZoom ?? 0.90) : (opts.fitZoom ?? 1);
  const zoomStyle = zoom < 0.995 ? `html,body { zoom: ${zoom.toFixed(3)}; }` : "";

  // Never set min-height when fitting — it creates a blank second page
  const pageH = fit ? "" : (zoom < 0.995 ? "" : "min-height:11in;");

  // Fit-mode extra styles: tighten every spacing value that uses inline styles
  // These @media print rules override inline px values via !important
  const fitStyles = fit ? `
@media print {
  @page { size: Letter; margin: 0; }
}
/* Reduce section gaps and bullet gaps in fit mode */
div[style*="margin:18px"], div[style*="margin: 18px"] { margin-top: 10px !important; margin-bottom: 8px !important; }
div[style*="margin:16px"], div[style*="margin: 16px"] { margin-top: 9px !important; margin-bottom: 7px !important; }
div[style*="margin-bottom:13px"] { margin-bottom: 8px !important; }
div[style*="margin-bottom:14px"] { margin-bottom: 8px !important; }
div[style*="margin-bottom:12px"] { margin-bottom: 7px !important; }
li[style*="margin-bottom:3.5px"] { margin-bottom: 2px !important; }
li[style*="margin-bottom:4px"]   { margin-bottom: 2px !important; }
li[style*="margin-bottom:3px"]   { margin-bottom: 2px !important; }
` : "";

  return `
<style>
@page { size: Letter; margin: 0; }
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; margin:0; padding:0; }
body { margin:0; font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif; font-size:${fs}; line-height:${lh}; color:#1a1a1a; }
.page { width:8.5in; ${pageH} overflow-x:hidden; background:#fff; }
ul { list-style:disc; padding-left:16px; }
p { margin-bottom:4px; }
${fitStyles}
${zoomStyle}
</style>`;
}

// ── Ordered section renderer ──────────────────────────────────────────────────
const SECTION_FN = {
  summary:        (r, a) => r.summary
    ? `${secH("Professional Summary", a)}<p style="font-size:11.5px;color:#333;line-height:1.62;">${safe(r.summary)}</p>`
    : "",
  achievements:   (r, a) => r.achievements?.length
    ? `${secH("Leadership Impact", a)}<ul style="margin:0;padding-left:16px;">${r.achievements.map((x) => `<li style="font-size:11px;color:#222;margin-bottom:4px;line-height:1.52;">${safe(x)}</li>`).join("")}</ul>`
    : "",
  experience:     (r, a) => r.experience?.length
    ? `${secH("Professional Experience", a)}${r.experience.map((j) => jobBlock(j, a)).join("")}`
    : "",
  education:      (r, a) => r.education?.length
    ? `${secH("Education", a)}${r.education.map((e) => eduBlock(e, a)).join("")}`
    : "",
  skills:         (r, a) => r.skills?.length
    ? `${secH("Technical Skills", a)}${skillCategoryRows(r.skills, a)}`
    : "",
  projects:       (r, a) => r.projects?.length
    ? `${secH("Projects", a)}${r.projects.map(projBlock).join("")}`
    : "",
  certifications: (r, a) => r.certifications?.length
    ? `${secH("Certifications", a)}<ul>${r.certifications.map((c) => `<li style="font-size:11px;color:#333;margin-bottom:3px;">${safe(c)}</li>`).join("")}</ul>`
    : "",
  awards: (r, a) => r.awards?.length
    ? `${secH("Awards & Honors", a)}<ul>${r.awards.map((x) => `<li style="font-size:11px;color:#333;margin-bottom:3px;">${safe(x)}</li>`).join("")}</ul>`
    : "",
  publications: (r, a) => r.publications?.length
    ? `${secH("Publications", a)}<ul>${r.publications.map((x) => `<li style="font-size:11px;color:#333;margin-bottom:3px;">${safe(x)}</li>`).join("")}</ul>`
    : "",
  volunteer: (r, a) => r.volunteer?.length
    ? `${secH("Volunteer Experience", a)}${r.volunteer.map((j) => jobBlock(j, a)).join("")}`
    : "",
};
const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "projects", "certifications"];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — FAANG Minimal
// 2-column bottom (education | skills) to prevent orphaned page 2
// ═══════════════════════════════════════════════════════════════════════════════
function faang(resume, sectionOrder, opts) {
  const acc  = resume.accent;
  const hasCerts = resume.certifications?.length > 0;
  const hasCertOrEdu = resume.education?.length > 0 || hasCerts;

  // Build education + certifications for left column
  const eduCertHtml = [
    resume.education?.length ? `${secHCompact("Education", acc)}${resume.education.map((e) => eduBlock(e, acc)).join("")}` : "",
    hasCerts ? `${secHCompact("Certifications", acc)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#333;margin-bottom:3px;">${safe(c)}</li>`).join("")}</ul>` : "",
  ].filter(Boolean).join("");

  // Build categorized skills for right column
  const skillsHtml = resume.skills?.length ? `${secHCompact("Technical Skills", acc)}${skillCategoryRows(resume.skills, acc)}` : "";

  // Determine if we use 2-col or 1-col based on custom sectionOrder
  // If the user reordered sections, we use the ordered renderer instead
  const useOrdered = sectionOrder && sectionOrder.length > 0;

  // Reduce padding when fitting to 1 page so more content fits vertically
  const pad = opts?.fitOnePage ? "0.28in 0.40in" : "0.44in 0.52in";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="padding:${pad};">

  <!-- ── Header ── -->
  <div style="border-bottom:2.5px solid ${acc};padding-bottom:${opts?.fitOnePage ? "8px" : "12px"};margin-bottom:0;">
    <h1 style="font-size:${opts?.fitOnePage ? "24px" : "28px"};font-weight:900;letter-spacing:-0.025em;color:#0f172a;line-height:1.1;">${safe(resume.candidate)}</h1>
    ${resume.title ? `<div style="font-size:14px;font-weight:700;color:${acc};margin-top:4px;">${safe(resume.title)}</div>` : ""}
    <div style="font-size:11px;color:#555;margin-top:6px;">${contactLine(resume)}</div>
  </div>

  ${useOrdered
    ? Object.keys(SECTION_FN)
        .filter((k) => sectionOrder.includes(k))
        .sort((a, b) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b))
        .map((k) => SECTION_FN[k]?.(resume, acc) ?? "")
        .join("\n")
    : `
  <!-- ── Summary ── -->
  ${resume.summary ? `${secH("Professional Summary", acc)}<p style="font-size:11.5px;color:#333;line-height:1.62;">${safe(resume.summary)}</p>` : ""}

  <!-- ── Experience ── -->
  ${resume.experience?.length ? `${secH("Professional Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}

  <!-- ── 2-column: Education+Certs (left) | Skills (right) ── -->
  ${hasCertOrEdu || resume.skills?.length ? `
  <div style="display:grid;grid-template-columns:1fr 1.65fr;gap:22px;margin-top:0;page-break-inside:avoid;">
    <div>${eduCertHtml}</div>
    <div>${skillsHtml}</div>
  </div>` : ""}

  <!-- ── Projects ── -->
  ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  `
  }

</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — Executive Navy (prestige sidebar with categorized skills)
// ═══════════════════════════════════════════════════════════════════════════════
function executiveNavy(resume, opts) {
  const acc  = resume.accent || "#1e3a5f";
  const cats = categorizeSkills(resume.skills);

  const sideSkillsHtml = Object.entries(cats).map(([cat, items]) => `
    <div style="margin-bottom:11px;">
      <div style="font-size:8.5px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:5px;">${safe(cat)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;">${items.map((s) =>
        `<span style="font-size:10px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.88);padding:2px 7px;border-radius:4px;">${safe(s)}</span>`
      ).join("")}</div>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="display:flex;">
  <!-- Sidebar -->
  <div style="width:180px;background:${acc};padding:28px 16px;flex-shrink:0;">
    <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.14);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#fff;">${(resume.candidate || "?").charAt(0)}</div>
    <div style="font-size:16px;font-weight:800;color:#fff;text-align:center;line-height:1.2;">${safe(resume.candidate)}</div>
    <div style="font-size:10.5px;color:rgba(255,255,255,0.62);text-align:center;margin-top:4px;">${safe(resume.title)}</div>

    <div style="border-top:1px solid rgba(255,255,255,0.18);margin:16px 0 12px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:9px;">Contact</div>
    ${resume.contact?.email ? `<div style="font-size:9.5px;color:rgba(255,255,255,0.82);margin-bottom:5px;word-break:break-all;">✉ ${safe(resume.contact.email)}</div>` : ""}
    ${resume.contact?.phone ? `<div style="font-size:9.5px;color:rgba(255,255,255,0.82);margin-bottom:5px;">✆ ${safe(resume.contact.phone)}</div>` : ""}
    ${resume.contact?.location ? `<div style="font-size:9.5px;color:rgba(255,255,255,0.82);margin-bottom:5px;">◎ ${safe(resume.contact.location)}</div>` : ""}
    ${resume.contact?.linkedin ? `<div style="font-size:9px;color:rgba(255,255,255,0.55);word-break:break-all;margin-bottom:5px;">${safe(resume.contact.linkedin)}</div>` : ""}

    <div style="border-top:1px solid rgba(255,255,255,0.18);margin:12px 0 12px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:10px;">Skills</div>
    ${sideSkillsHtml}

    ${resume.education?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.18);margin:12px 0 12px;padding-top:0;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:9px;">Education</div>
    ${resume.education.map((e) => {
      const t = typeof e === "string" ? e : `${e.degree || ""}`;
      const s = typeof e === "string" ? "" : e.school || "";
      const d = typeof e === "string" ? "" : `${e.graduation_date || ""}${e.gpa ? ` · GPA ${e.gpa}` : ""}`;
      return `<div style="margin-bottom:8px;"><div style="font-size:10.5px;font-weight:700;color:rgba(255,255,255,0.88);">${safe(t)}</div>${s ? `<div style="font-size:9.5px;color:rgba(255,255,255,0.55);">${safe(s)}</div>` : ""}${d ? `<div style="font-size:9px;color:rgba(255,255,255,0.48);">${safe(d)}</div>` : ""}</div>`;
    }).join("")}` : ""}

    ${resume.certifications?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.18);margin:12px 0 12px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:9px;">Certifications</div>
    ${resume.certifications.map((c) => `<div style="font-size:9.5px;color:rgba(255,255,255,0.82);margin-bottom:4px;">· ${safe(c)}</div>`).join("")}` : ""}
  </div>

  <!-- Main content -->
  <div style="flex:1;padding:28px 26px;">
    ${resume.summary ? `${secH("Professional Summary", acc)}<p style="font-size:11.5px;color:#334155;line-height:1.62;">${safe(resume.summary)}</p>` : ""}
    ${resume.achievements?.length ? `${secH("Leadership Impact", acc)}<ul>${resume.achievements.slice(0,4).map((a) => `<li style="font-size:11px;color:#222;margin-bottom:5px;line-height:1.52;">${safe(a)}</li>`).join("")}</ul>` : ""}
    ${resume.experience?.length ? `${secH("Professional Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
    ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Emerald Modern  (gradient header + 2-col bottom)
// ═══════════════════════════════════════════════════════════════════════════════
function emeraldModern(resume, sectionOrder, opts) {
  const acc = resume.accent || "#059669";
  return faang({ ...resume, accent: acc }, sectionOrder, opts);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4 — Slate Clean  (ultra minimal)
// ═══════════════════════════════════════════════════════════════════════════════
function slateClean(resume, sectionOrder, opts) {
  const acc  = resume.accent || "#334155";
  const hasCertOrEdu = resume.education?.length > 0 || resume.certifications?.length > 0;

  const eduCertHtml = [
    resume.education?.length ? `${secHCompact("Education", acc)}${resume.education.map((e) => eduBlock(e, acc)).join("")}` : "",
    resume.certifications?.length ? `${secHCompact("Certifications", acc)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#333;margin-bottom:3px;">${safe(c)}</li>`).join("")}</ul>` : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="padding:0.44in 0.58in;">
  <div style="margin-bottom:16px;">
    <h1 style="font-size:27px;font-weight:900;color:#0f172a;letter-spacing:-0.025em;">${safe(resume.candidate)}</h1>
    ${resume.title ? `<div style="font-size:13.5px;font-weight:700;color:${acc};margin-top:3px;">${safe(resume.title)}</div>` : ""}
    <div style="font-size:11px;color:#64748b;margin-top:5px;border-top:1px solid #e2e8f0;padding-top:6px;">${contactLine(resume)}</div>
  </div>
  ${resume.summary ? `${secH("Summary", acc)}<p style="font-size:11.5px;color:#333;line-height:1.62;">${safe(resume.summary)}</p>` : ""}
  ${resume.experience?.length ? `${secH("Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
  ${hasCertOrEdu || resume.skills?.length ? `
  <div style="display:grid;grid-template-columns:1fr 1.65fr;gap:22px;page-break-inside:avoid;">
    <div>${eduCertHtml}</div>
    <div>${resume.skills?.length ? `${secHCompact("Skills", acc)}${skillCategoryRows(resume.skills, acc)}` : ""}</div>
  </div>` : ""}
  ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 5 — Crimson Bold  (bold accent, 2-col below experience)
// ═══════════════════════════════════════════════════════════════════════════════
function crimsonBold(resume, opts) {
  const acc = resume.accent || "#be123c";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="border-left:7px solid ${acc};">
  <div style="padding:26px 34px 20px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;border-bottom:2px solid #f1f5f9;padding-bottom:14px;">
      <div>
        <h1 style="font-size:27px;font-weight:900;color:#0f172a;line-height:1.1;">${safe(resume.candidate)}</h1>
        ${resume.title ? `<div style="font-size:13px;font-weight:800;color:${acc};margin-top:4px;">${safe(resume.title)}</div>` : ""}
      </div>
      <div style="text-align:right;font-size:10.5px;color:#64748b;line-height:1.9;">
        ${[resume.contact?.email, resume.contact?.phone, resume.contact?.location].filter(Boolean).map(safe).join("<br>")}
      </div>
    </div>
    ${resume.summary ? `<div style="background:#fff1f2;border-left:3px solid ${acc};padding:9px 13px;margin:12px 0;border-radius:0 6px 6px 0;"><p style="font-size:11.5px;color:#333;line-height:1.6;">${safe(resume.summary)}</p></div>` : ""}
    ${resume.experience?.length ? `${secH("Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;page-break-inside:avoid;">
      <div>
        ${resume.education?.length ? `${secHCompact("Education", acc)}${resume.education.map((e) => eduBlock(e, acc)).join("")}` : ""}
        ${resume.certifications?.length ? `${secHCompact("Certifications", acc)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#333;margin-bottom:4px;">${safe(c)}</li>`).join("")}</ul>` : ""}
      </div>
      <div>
        ${resume.skills?.length ? `${secHCompact("Skills", acc)}<div>${skillPills(resume.skills, "#fff1f2", acc)}</div>` : ""}
      </div>
    </div>
    ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 6–7 — Violet Creative / Midnight Pro → sidebar layout
// ═══════════════════════════════════════════════════════════════════════════════
function violetCreative(resume, opts) {
  return executiveNavy({ ...resume, accent: resume.accent || "#7c3aed" }, opts);
}
function midnightPro(resume, opts) {
  return executiveNavy({ ...resume, accent: "#0f172a" }, opts);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 8 — Gold Executive  (serif-inspired, centered header)
// ═══════════════════════════════════════════════════════════════════════════════
function goldExecutive(resume, sectionOrder, opts) {
  const acc  = resume.accent || "#92400e";
  const gold = "#b45309";
  const hasCertOrEdu = resume.education?.length > 0 || resume.certifications?.length > 0;
  const eduCertHtml  = [
    resume.education?.length ? `${secHCompact("Education", gold)}${resume.education.map((e) => eduBlock(e, gold)).join("")}` : "",
    resume.certifications?.length ? `${secHCompact("Certifications", gold)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#333;margin-bottom:3px;">${safe(c)}</li>`).join("")}</ul>` : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="padding:0.44in 0.56in;">
  <div style="text-align:center;border-bottom:3px double ${gold};padding-bottom:13px;margin-bottom:0;">
    <div style="font-size:9.5px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:${gold};margin-bottom:5px;">Executive Professional</div>
    <h1 style="font-size:31px;font-weight:900;color:#0f172a;font-family:Georgia,serif;letter-spacing:-0.01em;">${safe(resume.candidate)}</h1>
    ${resume.title ? `<div style="font-size:13.5px;font-weight:700;color:${acc};margin-top:4px;">${safe(resume.title)}</div>` : ""}
    <div style="font-size:11px;color:#64748b;margin-top:6px;">${contactLine(resume)}</div>
  </div>
  ${resume.summary ? `${secH("Professional Summary", gold)}<p style="font-size:11.5px;color:#333;line-height:1.62;">${safe(resume.summary)}</p>` : ""}
  ${resume.experience?.length ? `${secH("Professional Experience", gold)}${resume.experience.map((j) => jobBlock(j, gold)).join("")}` : ""}
  ${hasCertOrEdu || resume.skills?.length ? `
  <div style="display:grid;grid-template-columns:1fr 1.65fr;gap:22px;page-break-inside:avoid;">
    <div>${eduCertHtml}</div>
    <div>${resume.skills?.length ? `${secHCompact("Technical Skills", gold)}${skillCategoryRows(resume.skills, gold)}` : ""}</div>
  </div>` : ""}
  ${resume.projects?.length ? `${secH("Projects", gold)}${resume.projects.map(projBlock).join("")}` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 9 — Cloud Engineer  (teal/cyan, cloud-first layout)
// Two-column: cloud-grouped skills on right, certs prominent
// ═══════════════════════════════════════════════════════════════════════════════
function cloudEngineer(resume, opts) {
  const acc = resume.accent || "#0891b2";
  const cats = categorizeSkills(resume.skills);
  const hasCerts = resume.certifications?.length > 0;

  // Cloud+DevOps skills first in the right column
  const priorityOrder = ["Cloud", "DevOps", "Programming", "Databases", "Tools", "Frameworks", "AI / ML"];
  const orderedCats = [
    ...priorityOrder.filter((k) => cats[k]),
    ...Object.keys(cats).filter((k) => !priorityOrder.includes(k)),
  ];

  const skillsHtml = orderedCats.map((cat) => `
<div style="margin-bottom:7px;">
  <span style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${safe(cat)}&nbsp;</span>
  <span style="font-size:11px;color:#0f172a;">${(cats[cat] || []).map(safe).join(" · ")}</span>
</div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page">
  <!-- Header with teal gradient -->
  <div style="background:linear-gradient(135deg,${acc},#164e63);padding:24px 38px 20px;color:#fff;">
    <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.02em;">${safe(resume.candidate)}</h1>
    ${resume.title ? `<div style="font-size:13.5px;font-weight:700;opacity:0.9;margin-top:3px;">${safe(resume.title)}</div>` : ""}
    <div style="font-size:11px;opacity:0.78;margin-top:8px;display:flex;flex-wrap:wrap;gap:14px;">
      ${[resume.contact?.email, resume.contact?.phone, resume.contact?.location, resume.contact?.linkedin]
        .filter(Boolean).map((v) => `<span style="word-break:break-all;">${safe(v)}</span>`).join("")}
    </div>
  </div>
  <div style="padding:20px 38px 24px;">
    ${resume.summary ? `<p style="font-size:11.5px;color:#334155;line-height:1.62;margin-bottom:4px;">${safe(resume.summary)}</p>` : ""}
    ${resume.experience?.length ? `${secH("Professional Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
    <!-- 2-col bottom: education+certs | skills -->
    <div style="display:grid;grid-template-columns:1fr 1.7fr;gap:22px;page-break-inside:avoid;">
      <div>
        ${resume.education?.length ? `${secHCompact("Education", acc)}${resume.education.map((e) => eduBlock(e, acc)).join("")}` : ""}
        ${hasCerts ? `${secHCompact("Certifications", acc)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#0f172a;margin-bottom:4px;line-height:1.45;">${safe(c)}</li>`).join("")}</ul>` : ""}
      </div>
      <div>
        ${resume.skills?.length ? `${secHCompact("Technical Skills", acc)}${skillsHtml}` : ""}
      </div>
    </div>
    ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 10 — Backend Engineer  (dark left border, performance-first)
// Achievement highlight box, metrics-focused bullets
// ═══════════════════════════════════════════════════════════════════════════════
function backendEngineer(resume, opts) {
  const acc = resume.accent || "#1e40af";
  const topAchievements = resume.achievements?.length
    ? resume.achievements
    : (resume.experience?.[0]?.bullets ?? []).filter((b) => /\d+%|\d+x|\$\d+|\d+[KMB]\b/.test(b));

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="border-left:7px solid ${acc};">
  <div style="padding:26px 34px 22px;">
    <!-- Header -->
    <div style="border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="font-size:28px;font-weight:900;color:#0f172a;letter-spacing:-0.025em;">${safe(resume.candidate)}</h1>
          ${resume.title ? `<div style="font-size:13.5px;font-weight:700;color:${acc};margin-top:3px;">${safe(resume.title)}</div>` : ""}
        </div>
        <div style="text-align:right;font-size:10.5px;color:#64748b;line-height:1.9;">
          ${[resume.contact?.email, resume.contact?.phone, resume.contact?.location]
            .filter(Boolean).map((v) => `<div style="word-break:break-all;">${safe(v)}</div>`).join("")}
          ${resume.contact?.linkedin ? `<div style="color:${acc};font-size:10px;word-break:break-all;">${safe(resume.contact.linkedin)}</div>` : ""}
        </div>
      </div>
    </div>
    ${resume.summary ? `${secH("Professional Summary", acc)}<p style="font-size:11.5px;color:#334155;line-height:1.62;">${safe(resume.summary)}</p>` : ""}
    ${topAchievements.length > 0 ? `
    <div style="background:#eff6ff;border-left:3px solid ${acc};border-radius:0 6px 6px 0;padding:10px 13px;margin:4px 0;">
      <div style="font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:${acc};margin-bottom:7px;">Key Achievements</div>
      ${topAchievements.slice(0,3).map((a) => `<div style="display:flex;gap:8px;margin-bottom:4px;"><span style="color:${acc};font-weight:900;flex-shrink:0;">▸</span><span style="font-size:11px;color:#1e3a5f;line-height:1.5;">${safe(a)}</span></div>`).join("")}
    </div>` : ""}
    ${resume.experience?.length ? `${secH("Professional Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
    <div style="display:grid;grid-template-columns:1fr 1.7fr;gap:22px;page-break-inside:avoid;">
      <div>
        ${resume.education?.length ? `${secHCompact("Education", acc)}${resume.education.map((e) => eduBlock(e, acc)).join("")}` : ""}
        ${resume.certifications?.length ? `${secHCompact("Certifications", acc)}<ul>${resume.certifications.map((c) => `<li style="font-size:10.5px;color:#0f172a;margin-bottom:4px;">${safe(c)}</li>`).join("")}</ul>` : ""}
      </div>
      <div>
        ${resume.skills?.length ? `${secHCompact("Technical Skills", acc)}${skillCategoryRows(resume.skills, acc)}` : ""}
      </div>
    </div>
    ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 11 — Data Engineer  (emerald green, pipeline-focused 2-col)
// Skills sidebar on left with data tools highlighted
// ═══════════════════════════════════════════════════════════════════════════════
function dataEngineer(resume, opts) {
  const acc  = resume.accent || "#059669";
  const cats = categorizeSkills(resume.skills);

  // Data tools prioritized in sidebar
  const dataOrder = ["Databases", "Cloud", "Programming", "DevOps", "Frameworks", "AI / ML", "Tools"];
  const sideCats  = [...dataOrder.filter((k) => cats[k]), ...Object.keys(cats).filter((k) => !dataOrder.includes(k))];

  const sideSkillsHtml = sideCats.map((cat) => `
<div style="margin-bottom:10px;">
  <div style="font-size:8.5px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:5px;">${safe(cat)}</div>
  <div style="display:flex;flex-wrap:wrap;gap:3px;">${(cats[cat] || []).map((s) =>
    `<span style="font-size:9.5px;background:rgba(255,255,255,0.13);color:rgba(255,255,255,0.9);padding:2px 7px;border-radius:4px;">${safe(s)}</span>`
  ).join("")}</div>
</div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseCSS(acc, opts)}</head><body>
<div class="page" style="display:flex;">
  <!-- Left sidebar -->
  <div style="width:180px;background:${acc};padding:26px 14px;flex-shrink:0;">
    <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.16);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;">${(resume.candidate || "?").charAt(0)}</div>
    <div style="font-size:15px;font-weight:800;color:#fff;text-align:center;line-height:1.2;">${safe(resume.candidate)}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.6);text-align:center;margin-top:3px;">${safe(resume.title)}</div>
    <div style="border-top:1px solid rgba(255,255,255,0.2);margin:14px 0 10px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:8px;">Contact</div>
    ${[
      resume.contact?.email ? `✉ ${resume.contact.email}` : "",
      resume.contact?.phone ? `✆ ${resume.contact.phone}` : "",
      resume.contact?.location ? `◎ ${resume.contact.location}` : "",
      resume.contact?.linkedin || "",
    ].filter(Boolean).map((v) => `<div style="font-size:9px;color:rgba(255,255,255,0.78);margin-bottom:4px;word-break:break-all;">${safe(v)}</div>`).join("")}
    <div style="border-top:1px solid rgba(255,255,255,0.2);margin:12px 0 10px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:8px;">Skills</div>
    ${sideSkillsHtml}
    ${resume.education?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.2);margin:12px 0 10px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:8px;">Education</div>
    ${resume.education.map((e) => {
      const deg = typeof e === "string" ? e : e.degree || "";
      const sch = typeof e === "string" ? "" : e.school || "";
      const dt  = typeof e === "string" ? "" : `${e.graduation_date || ""}${e.gpa ? ` · GPA ${e.gpa}` : ""}`;
      return `<div style="margin-bottom:7px;"><div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);">${safe(deg)}</div>${sch ? `<div style="font-size:9px;color:rgba(255,255,255,0.55);">${safe(sch)}</div>` : ""}${dt ? `<div style="font-size:9px;color:rgba(255,255,255,0.45);">${safe(dt)}</div>` : ""}</div>`;
    }).join("")}` : ""}
    ${resume.certifications?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.2);margin:12px 0 10px;"></div>
    <div style="font-size:8.5px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:8px;">Certifications</div>
    ${resume.certifications.map((c) => `<div style="font-size:9px;color:rgba(255,255,255,0.78);margin-bottom:4px;">· ${safe(c)}</div>`).join("")}` : ""}
  </div>
  <!-- Main content -->
  <div style="flex:1;padding:26px 24px;">
    ${resume.summary ? `<p style="font-size:11.5px;color:#334155;line-height:1.62;margin-bottom:4px;">${safe(resume.summary)}</p>` : ""}
    ${resume.experience?.length ? `${secH("Professional Experience", acc)}${resume.experience.map((j) => jobBlock(j, acc)).join("")}` : ""}
    ${resume.projects?.length ? `${secH("Projects", acc)}${resume.projects.map(projBlock).join("")}` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function buildResumeTemplateHtml(input, opts = {}) {
  const base   = normalize(input);
  const resume = opts.accentColor ? { ...base, accent: opts.accentColor } : base;
  // Pass fitOnePage so baseCSS and templates can apply aggressive compaction
  const templateOpts = {
    fontSize:   opts.fitOnePage ? "small" : opts.fontSize,   // force small font when fitting
    spacing:    opts.fitOnePage ? "compact" : opts.spacing,  // force compact line height
    fitZoom:    opts.fitZoom,
    fitOnePage: opts.fitOnePage,
  };
  const id       = resume.id ?? resume.style ?? "";
  const secOrder = opts.sectionOrder ?? null;

  switch (id) {
    case "faang-minimal":     return faang(resume, secOrder, templateOpts);
    case "executive-navy":    return executiveNavy(resume, templateOpts);
    case "emerald-modern":    return emeraldModern(resume, secOrder, templateOpts);
    case "slate-clean":       return slateClean(resume, secOrder, templateOpts);
    case "crimson-bold":      return crimsonBold(resume, templateOpts);
    case "violet-creative":   return violetCreative(resume, templateOpts);
    case "midnight-pro":      return midnightPro(resume, templateOpts);
    case "gold-executive":    return goldExecutive(resume, secOrder, templateOpts);

    // New gallery templates (map to closest style)
    case "double-column":     return executiveNavy({ ...resume, accent: "#2563eb" }, templateOpts);
    case "ivy-league":        return slateClean({ ...resume, accent: "#1c1917" }, secOrder, templateOpts);
    case "timeline-clean":    return faang({ ...resume, accent: "#0891b2" }, secOrder, templateOpts);
    case "high-performer":    return crimsonBold({ ...resume, accent: "#16a34a" }, templateOpts);
    case "modern-centered":   return executiveNavy({ ...resume, accent: "#6d28d9" }, templateOpts);
    case "compact-tech":      return slateClean({ ...resume, accent: "#475569" }, secOrder, templateOpts);
    case "polished-pro":      return goldExecutive({ ...resume, accent: "#0f766e" }, secOrder, templateOpts);

    // New role-specific templates
    case "cloud-engineer-pro":     return cloudEngineer(resume, templateOpts);
    case "backend-engineer-pro":   return backendEngineer(resume, templateOpts);
    case "data-engineer-pro":      return dataEngineer(resume, templateOpts);

    // Legacy style IDs
    case "modern-sidebar":         return executiveNavy(resume, templateOpts);
    case "executive-professional": return goldExecutive(resume, secOrder, templateOpts);
    case "cloud-engineer":         return cloudEngineer({ ...resume, accent: "#0891b2" }, templateOpts);
    case "backend-engineer":       return backendEngineer({ ...resume, accent: "#1e40af" }, templateOpts);
    case "data-analyst":           return dataEngineer({ ...resume, accent: "#059669" }, templateOpts);
    case "entry-level":            return faang(resume, secOrder, templateOpts);
    case "creative-modern":        return violetCreative(resume, templateOpts);

    default: return faang(resume, secOrder, templateOpts);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATS-CLEAN EXPORT — matches the clean professional PDF format exactly
// Used by JD Match "Improve Resume" feature
// No colors, no badges, no sidebars — pure clean single-column layout
// ═══════════════════════════════════════════════════════════════════════════════
export function buildAtsCleanHtml(profile = {}, rawResume = {}, opts = {}) {
  const s = (v) => String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const fit  = opts.fitOnePage === true;
  const zoom = opts.fitZoom ?? 1;
  const zoomCss = zoom < 0.995 ? `html { zoom: ${zoom.toFixed(3)}; }` : "";

  // ── Helpers ──────────────────────────────────────────────────────────────
  const row = (l, r) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
      <span>${l}</span><span style="white-space:nowrap;font-size:11px;color:#334155;">${r}</span>
    </div>`;

  const secHead = (t) => `
    <h2 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;
               border-bottom:1px solid #0f172a;padding-bottom:3px;margin:16px 0 8px;">${s(t)}</h2>`;

  const bulletList = (items = []) =>
    items.length
      ? items.map((b) => `<div style="font-size:11px;line-height:1.55;margin:1px 0 3px 14px;">&#8226; ${s(b)}</div>`).join("")
      : "";

  // ── Structured data from backend (richer than flat profile) ──────────────
  const experience = Array.isArray(rawResume.extracted_experience) ? rawResume.extracted_experience : [];
  const education  = Array.isArray(rawResume.extracted_education)  ? rawResume.extracted_education  : [];
  const projects   = Array.isArray(rawResume.extracted_projects)   ? rawResume.extracted_projects   : [];
  const skillsCat  = rawResume.skills_categorized && Object.keys(rawResume.skills_categorized).length
    ? rawResume.skills_categorized : null;

  // ── Contact line ──────────────────────────────────────────────────────────
  const contactParts = [
    profile.location, profile.phone, profile.email,
    profile.linkedin ? "LinkedIn" : null,
    profile.website  ? "GitHub"   : null,
  ].filter(Boolean);
  const contactLine = contactParts.map(s).join(" | ");

  // ── Experience HTML ────────────────────────────────────────────────────────
  let expHtml = "";
  if (experience.length > 0) {
    // Group by company
    const companies = {};
    for (const job of experience) {
      const co = job.job_title || job.role || "Experience";
      const comp = job.company || "";
      if (!companies[comp]) companies[comp] = [];
      companies[comp].push(job);
    }
    for (const [company, jobs] of Object.entries(companies)) {
      expHtml += `<div style="margin-bottom:12px;">`;
      if (company) expHtml += `<p style="font-size:12.5px;font-weight:800;color:#0f172a;margin:0 0 2px;">${s(company)}</p>`;
      for (const job of jobs) {
        const title    = s(job.job_title || job.role || "");
        const loc      = s(job.location  || "");
        const dates    = s(job.date || (job.start_date ? `${job.start_date} - ${job.end_date || "Present"}` : ""));
        const locDates = [loc, dates].filter(Boolean).join(" · ");
        expHtml += `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
          <em style="font-size:11.5px;color:#0f172a;">${title}</em>
          <span style="white-space:nowrap;font-size:11px;color:#334155;">${s(locDates)}</span>
        </div>`;
        expHtml += bulletList(job.bullets || []);
      }
      expHtml += `</div>`;
    }
  } else {
    // Fallback: parse from profile.experience string
    const lines = (profile.experience || "").split("\n").filter(Boolean);
    for (const line of lines) {
      if (/^[•\-*]/.test(line.trim())) {
        expHtml += `<div style="font-size:11px;line-height:1.55;margin:1px 0 3px 14px;">&#8226; ${s(line.replace(/^[•\-*]\s*/, ""))}</div>`;
      } else {
        expHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:8px 0 2px;">${s(line)}</p>`;
      }
    }
  }

  // ── Education HTML ─────────────────────────────────────────────────────────
  let eduHtml = "";
  for (const edu of education) {
    const school  = s(edu.school || "");
    const degree  = s(edu.degree || "");
    const dates   = s(edu.graduation_date || "");
    const gpa     = edu.gpa ? `<div style="font-size:11px;margin:1px 0 2px 14px;">&#8226; <strong>GPA:</strong> ${s(edu.gpa)}/4.00</div>` : "";
    const cw      = edu.coursework ? `<div style="font-size:11px;margin:1px 0 2px 14px;">&#8226; <strong>Coursework:</strong> ${s(edu.coursework)}</div>` : "";
    eduHtml += `<div style="margin-bottom:10px;">${row(`<strong style="font-size:12.5px;color:#0f172a;">${school}</strong>`, dates)}${degree ? `<em style="font-size:11.5px;color:#0f172a;">${degree}</em>` : ""}${gpa}${cw}</div>`;
  }
  if (!eduHtml) {
    eduHtml = `<p style="font-size:11px;color:#64748b;">${s(profile.education || "")}</p>`;
  }

  // ── Projects HTML ──────────────────────────────────────────────────────────
  let projHtml = "";
  for (const proj of projects) {
    const name  = s(proj.name || "");
    const date  = s(proj.date || "");
    const techs = proj.technologies ? ` — <span style="font-size:10.5px;color:#64748b;">${s(proj.technologies)}</span>` : "";
    const bullets = [...(proj.bullets || [])];
    if (proj.description) bullets.unshift(proj.description);
    projHtml += `
      <div style="margin-bottom:12px;">
        ${row(`<strong style="font-size:12px;color:#0f172a;">${name}</strong>${techs}`, date)}
        ${bulletList(bullets)}
      </div>`;
  }

  // ── Skills HTML ────────────────────────────────────────────────────────────
  let skillsHtml = "";
  if (skillsCat && Object.keys(skillsCat).length > 0) {
    // Use improved/categorized skills, but merge new keywords from profile
    const allSkills = (profile.skills || "").split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
    const usedCats  = { ...skillsCat };
    // Add new keywords to appropriate categories or append to last category
    for (const skill of allSkills) {
      const alreadyIn = Object.values(usedCats).flat().some(
        (s) => s.toLowerCase() === skill.toLowerCase()
      );
      if (!alreadyIn) {
        const lastCat = Object.keys(usedCats).slice(-1)[0] || "Skills";
        usedCats[lastCat] = [...(usedCats[lastCat] || []), skill];
      }
    }
    skillsHtml = Object.entries(usedCats)
      .filter(([, items]) => items.length > 0)
      .map(([cat, items]) =>
        `<li style="font-size:11px;margin-bottom:4px;line-height:1.6;">
          <strong>${s(cat)}:</strong> ${items.map(s).join(", ")}
        </li>`
      ).join("");
  } else if (profile.skills) {
    skillsHtml = `<li style="font-size:11px;margin-bottom:4px;">${s(profile.skills)}</li>`;
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  const certs = Array.isArray(rawResume.certifications) ? rawResume.certifications.filter(Boolean) : [];
  const certHtml = certs.length
    ? `${secHead("Certifications")}<ul style="margin:0 0 0 14px;padding:0;">${certs.map((c) => `<li style="font-size:11px;margin-bottom:3px;">${s(c)}</li>`).join("")}</ul>`
    : "";

  // ── Full document ──────────────────────────────────────────────────────────
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@page { size: Letter; margin: 0; }
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; margin:0; padding:0; }
body { font-family:'Calibri','Segoe UI','Arial',sans-serif; font-size:11.5px; line-height:1.4; color:#0f172a; background:#fff; }
.page { width:8.5in; ${fit ? "" : "min-height:11in;"} padding:0.55in 0.65in; background:#fff; }
h1 { font-size:22px; font-weight:700; text-align:center; margin-bottom:5px; }
p { margin-bottom:4px; }
ul { list-style:disc; }
li { margin-bottom:2px; }
${zoomCss}
</style></head><body>
<div class="page">

  <!-- Header -->
  <h1>${s(profile.name || "")}</h1>
  ${contactLine ? `<p style="text-align:center;font-size:11px;color:#334155;margin-bottom:4px;">${contactLine}</p>` : ""}

  <!-- Summary -->
  ${profile.summary ? `${secHead("Professional Summary")}<p style="font-size:11.5px;line-height:1.6;">${s(profile.summary)}</p>` : ""}

  <!-- Education -->
  ${education.length > 0 || profile.education ? `${secHead("Education")}${eduHtml}` : ""}

  <!-- Experience -->
  ${experience.length > 0 || profile.experience ? `${secHead("Experience")}${expHtml}` : ""}

  <!-- Projects -->
  ${projects.length > 0 ? `${secHead("Projects")}${projHtml}` : ""}

  <!-- Technical Skills -->
  ${skillsHtml ? `${secHead("Technical Skills")}<ul style="margin:0 0 0 14px;padding:0;">${skillsHtml}</ul>` : ""}

  <!-- Certifications -->
  ${certHtml}

</div>
</body></html>`;
}
