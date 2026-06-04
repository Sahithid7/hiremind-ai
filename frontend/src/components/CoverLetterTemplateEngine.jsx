export const coverLetterTemplateOptions = [
  { id: "modern-minimal",       name: "Modern Minimal",       category: "Modern",       accent: "#14B87A" },
  { id: "executive-clean",      name: "Executive Clean",       category: "Executive",    accent: "#0B1220" },
  { id: "creative-accent",      name: "Creative Accent",       category: "Creative",     accent: "#7C5CFF" },
  { id: "corporate-professional",name: "Corporate Professional",category: "Professional", accent: "#2563EB" },
  { id: "faang-minimal",        name: "FAANG Minimal",         category: "Technical",    accent: "#111827" },
  { id: "elegant-serif",        name: "Elegant Serif",         category: "Classic",      accent: "#8B5E34" },
  { id: "sidebar-premium",      name: "Sidebar Premium",       category: "Premium",      accent: "#164E63" },
  { id: "ats-clean",            name: "ATS Clean",             category: "ATS Friendly", accent: "#059669" },
  { id: "navy-impact",          name: "Navy Impact",           category: "Bold",         accent: "#1e3a5f" },
  { id: "rose-gold",            name: "Rose Gold",             category: "Modern",       accent: "#be123c" },
];

export function CoverLetterTemplate({ template, letter, mode = "card" }) {
  const pageClass = mode === "builder"
    ? "max-w-[760px] p-10 text-[13px] leading-[1.62]"
    : mode === "modal"
      ? "max-w-[760px] p-9 text-[11px] leading-[1.55]"
      : "w-full p-3 text-[5px] leading-[1.25]";
  const selected = template ?? coverLetterTemplateOptions[0];

  return (
    <article className={`mx-auto aspect-[8.5/11] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-card ${pageClass}`}>
      {renderTemplate(selected, normalizeLetter(letter, !letter))}
    </article>
  );
}

export function ModernMinimalCoverLetter({ template, letter }) {
  return (
    <div className="h-full">
      <header className="border-b-4 pb-4" style={{ borderColor: template.accent }}>
        <h2 className="text-[2.8em] font-black tracking-tight">{letter.name}</h2>
        <p className="font-bold" style={{ color: template.accent }}>{letter.title}</p>
        <p className="mt-1 text-slate-500">{contactLine(letter)}</p>
      </header>
      <LetterBody letter={letter} />
    </div>
  );
}

export function ExecutiveCleanCoverLetter({ template, letter }) {
  return (
    <div className="h-full">
      <header className="border-b-4 pb-4" style={{ borderColor: template.accent }}>
        <h2 className="text-[2.8em] font-black leading-none">{letter.name}</h2>
        <p className="mt-1 font-semibold text-slate-600">{letter.title}</p>
        <p className="mt-1 break-all text-slate-500 text-xs">{contactLine(letter)}</p>
      </header>
      <LetterBody letter={letter} />
    </div>
  );
}

export function CreativeAccentCoverLetter({ template, letter }) {
  return (
    <div className="relative h-full overflow-hidden rounded-sm bg-gradient-to-br from-purple-50 via-white to-emerald-50 p-4">
      <div className="absolute right-[-3em] top-[-3em] h-28 w-28 rounded-full bg-purple-200/70" />
      <div className="absolute bottom-[-3em] left-[-3em] h-28 w-28 rounded-full bg-emerald-200/70" />
      <div className="relative">
        <header className="rounded-2xl bg-white/85 p-4 shadow-sm">
          <h2 className="text-[2.8em] font-black">{letter.name}</h2>
          <p className="font-bold" style={{ color: template.accent }}>{letter.title}</p>
          <p className="text-slate-500">{contactLine(letter)}</p>
        </header>
        <LetterBody letter={letter} />
      </div>
    </div>
  );
}

export function CorporateProfessionalCoverLetter({ template, letter }) {
  return (
    <div className="h-full border-t-[1.2em]" style={{ borderColor: template.accent }}>
      <header className="mt-4 grid grid-cols-[0.6fr_0.4fr] gap-4">
        <div>
          <h2 className="text-[2.6em] font-black uppercase tracking-wide">{letter.name}</h2>
          <p className="font-bold text-slate-700">{letter.title}</p>
        </div>
        <p className="text-right text-slate-500">{letter.location}<br />{letter.phone}<br />{letter.email}</p>
      </header>
      <LetterBody letter={letter} />
    </div>
  );
}

export function FaangMinimalCoverLetter({ letter }) {
  return (
    <div className="h-full">
      <header className="border-b border-slate-900 pb-4 text-center">
        <h2 className="text-[2.6em] font-black uppercase tracking-[0.16em]">{letter.name}</h2>
        <p className="mt-1 font-bold text-slate-700">{letter.title}</p>
        <p className="mt-1 text-slate-500">{contactLine(letter)}</p>
      </header>
      <LetterBody letter={letter} compact />
    </div>
  );
}

export function ElegantSerifCoverLetter({ template, letter }) {
  return (
    <div className="h-full border border-stone-200 p-4">
      <header className="text-center">
        <h2 className="font-serif text-[3em] font-bold leading-none" style={{ color: template.accent }}>{letter.name}</h2>
        <p className="mt-2 text-slate-600">{letter.title}</p>
        <p className="mt-1 text-slate-500">{letter.email} | {letter.phone} | {letter.location}</p>
      </header>
      <div className="mx-auto mt-4 h-px w-4/5 bg-stone-300" />
      <LetterBody letter={letter} />
    </div>
  );
}

export function SidebarPremiumCoverLetter({ template, letter }) {
  return (
    <div className="grid h-full grid-cols-[0.3fr_0.7fr]">
      <aside className="bg-slate-950 p-4 text-white">
        <h2 className="text-[2.2em] font-black leading-tight">{letter.name}</h2>
        <p className="mt-1 text-emerald-200">{letter.title}</p>
        <p className="mt-6 border-b border-white/20 pb-1 font-black uppercase tracking-[0.16em]">Contact</p>
        <p className="mt-3 text-white/70">{letter.email}<br />{letter.phone}<br />{letter.location}<br />{letter.linkedin}</p>
        <p className="mt-6 rounded-full px-3 py-2 text-center font-bold" style={{ backgroundColor: template.accent }}>ATS Friendly</p>
      </aside>
      <main className="p-5">
        <div className="h-1.5 rounded-full" style={{ backgroundColor: template.accent }} />
        <LetterBody letter={letter} compact />
      </main>
    </div>
  );
}

export function AtsCleanCoverLetter({ template, letter }) {
  return (
    <div className="h-full">
      <header className="border-b-2 pb-3" style={{ borderColor: template.accent }}>
        <h2 className="text-[2.4em] font-black">{letter.name}</h2>
        <p className="font-bold" style={{ color: template.accent }}>{letter.title}</p>
        <p className="text-slate-500">{letter.location} | {letter.email} | {letter.phone}</p>
      </header>
      <LetterBody letter={letter} compact />
    </div>
  );
}

function renderTemplate(template, letter) {
  if (template.id === "executive-clean") return <ExecutiveCleanCoverLetter template={template} letter={letter} />;
  if (template.id === "creative-accent") return <CreativeAccentCoverLetter template={template} letter={letter} />;
  if (template.id === "corporate-professional") return <CorporateProfessionalCoverLetter template={template} letter={letter} />;
  if (template.id === "faang-minimal") return <FaangMinimalCoverLetter template={template} letter={letter} />;
  if (template.id === "elegant-serif") return <ElegantSerifCoverLetter template={template} letter={letter} />;
  if (template.id === "sidebar-premium") return <SidebarPremiumCoverLetter template={template} letter={letter} />;
  if (template.id === "ats-clean") return <AtsCleanCoverLetter template={template} letter={letter} />;
  return <ModernMinimalCoverLetter template={template} letter={letter} />;
}

function LetterBody({ letter, compact = false }) {
  return (
    <main className={`${compact ? "mt-4 space-y-2.5" : "mt-5 space-y-3.5"} text-slate-800`}>
      <p>{letter.date}</p>
      <p>{letter.manager}<br />{letter.company}<br />{letter.companyLocation}</p>
      <p className="font-semibold text-slate-950">Dear {letter.manager},</p>
      {letter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <p className="pt-2">Sincerely,<br /><strong>{letter.name}</strong></p>
    </main>
  );
}

function normalizeLetter(letter = {}, sampleMode = false) {
  const sample = sampleMode ? {
    name: "Ava Martinez",
    title: "Software Engineer",
    location: "St. Louis, MO",
    phone: "(314) 555-0184",
    email: "ava.martinez@example.com",
    linkedin: "linkedin.com/in/avamartinez",
    company: "Hiring Company",
    companyLocation: "",
    manager: "Hiring Manager",
    paragraphs: [
      "I am excited to apply for this role. My background in software engineering, backend services, and product-focused collaboration aligns well with the team's needs.",
      "In recent work, I have built full-stack applications, improved API reliability, and translated ambiguous product requirements into maintainable engineering solutions.",
      "I would welcome the opportunity to bring clear communication, ownership, and practical execution to your team."
    ]
  } : {};

  return {
    name: letter.name || sample.name || "",
    title: letter.title || sample.title || "",
    location: letter.location || sample.location || "",
    phone: letter.phone || sample.phone || "",
    email: letter.email || sample.email || "",
    linkedin: letter.linkedin || sample.linkedin || "",
    date: letter.date || "May 25, 2026",
    company: letter.company || sample.company || "",
    companyLocation: letter.companyLocation || sample.companyLocation || "",
    manager: letter.manager || sample.manager || "Hiring Manager",
    paragraphs: letter.paragraphs?.length ? letter.paragraphs : (sample.paragraphs || [])
  };
}

function contactLine(letter) {
  return [letter.location, letter.phone, letter.email, letter.linkedin].filter(Boolean).join(" | ");
}

const esc = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

function bodyHtml(letter) {
  return `
    <main class="letter-body">
      <p>${esc(letter.date)}</p>
      <p>${esc(letter.manager)}<br>${esc(letter.company)}<br>${esc(letter.companyLocation)}</p>
      <p><strong>Dear ${esc(letter.manager)},</strong></p>
      ${letter.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      <p class="signature">Sincerely,<br><strong>${esc(letter.name)}</strong></p>
    </main>
  `;
}

function baseHtmlStyles() {
  return `
    <style>
      * { box-sizing: border-box; word-break: break-word; overflow-wrap: break-word; }
      .cover-export { min-height: 9.8in; color: #0f172a; font-family: Inter, Arial, sans-serif; font-size: 11px; line-height: 1.6; }
      .cover-export h1, .cover-export p { margin-top: 0; }
      .letter-body { color: #1f2937; font-size: 11px; line-height: 1.6; margin-top: 24px; }
      .letter-body p { margin-bottom: 16px; }
      .signature { padding-top: 8px; }
      @media print { .cover-export { min-height: auto; } }
    </style>
  `;
}

export function buildCoverLetterTemplateHtml(letterInput, templateInput) {
  const letter = normalizeLetter(letterInput, false);
  const template = templateInput ?? coverLetterTemplateOptions[0];
  const accent = template.accent;
  const headerText = `<h1>${esc(letter.name)}</h1><p class="title">${esc(letter.title)}</p><p class="contact">${esc(contactLine(letter))}</p>`;
  const base = baseHtmlStyles(template);

  if (template.id === "sidebar-premium") {
    return `${base}<article class="cover-export" style="display:grid;grid-template-columns:30% 70%;overflow:hidden;border-radius:14px;"><aside style="background:#0f172a;color:white;padding:28px;"><h1 style="font-size:28px;line-height:1.05;margin:0;">${esc(letter.name)}</h1><p style="color:#a7f3d0;font-weight:700;">${esc(letter.title)}</p><p style="margin-top:28px;border-bottom:1px solid rgba(255,255,255,.25);padding-bottom:6px;font-weight:900;text-transform:uppercase;letter-spacing:.14em;">Contact</p><p style="color:rgba(255,255,255,.72);font-size:12px;line-height:1.7;">${esc(letter.email)}<br>${esc(letter.phone)}<br>${esc(letter.location)}<br>${esc(letter.linkedin)}</p></aside><main style="padding:30px;"><div style="height:8px;background:${accent};border-radius:999px;"></div>${bodyHtml(letter)}</main></article>`;
  }

  if (template.id === "creative-accent") {
    return `${base}<article class="cover-export" style="background:linear-gradient(135deg,#faf5ff,#ffffff 55%,#ecfdf5);border-radius:18px;padding:28px;"><header style="background:rgba(255,255,255,.88);border-radius:18px;box-shadow:0 12px 35px rgba(15,23,42,.08);padding:22px;"><h1 style="font-size:34px;margin:0;">${esc(letter.name)}</h1><p style="color:${accent};font-weight:900;margin:5px 0;">${esc(letter.title)}</p><p style="color:#64748b;font-size:12px;margin:0;">${esc(contactLine(letter))}</p></header>${bodyHtml(letter)}</article>`;
  }

  if (template.id === "elegant-serif") {
    return `${base}<article class="cover-export" style="border:1px solid #e7e5e4;padding:30px;"><header style="text-align:center;"><h1 style="font-family:Georgia,serif;font-size:38px;color:${accent};margin:0;">${esc(letter.name)}</h1><p style="color:#475569;margin:8px 0 0;">${esc(letter.title)}</p><p style="color:#64748b;font-size:12px;">${esc(letter.email)} | ${esc(letter.phone)} | ${esc(letter.location)}</p></header><div style="height:1px;background:#d6d3d1;margin:18px auto;width:82%;"></div>${bodyHtml(letter)}</article>`;
  }

  if (template.id === "executive-clean") {
    const cl = [letter.location, letter.phone, letter.email, letter.linkedin].filter(Boolean).join(" | ");
    return `${base}<article class="cover-export" style="padding:0.9in;"><header style="border-bottom:5px solid ${accent};padding-bottom:16px;"><h1 style="font-size:32px;line-height:1.1;margin:0;">${esc(letter.name)}</h1><p style="color:#475569;font-weight:700;margin:6px 0 4px;">${esc(letter.title)}</p><p style="color:#64748b;font-size:11px;margin:0;word-break:break-word;overflow-wrap:break-word;">${esc(cl)}</p></header>${bodyHtml(letter)}</article>`;
  }

  if (template.id === "corporate-professional") {
    return `${base}<article class="cover-export" style="border-top:16px solid ${accent};padding-top:22px;"><header style="display:grid;grid-template-columns:60% 40%;gap:20px;">${headerText.replace("<h1>", "<h1 style='font-size:32px;letter-spacing:.08em;text-transform:uppercase;margin:0;'>").replace("<p class=\"title\">", "<p class='title' style='font-weight:800;color:#334155;'>").replace("<p class=\"contact\">", "<p class='contact' style='color:#64748b;font-size:12px;text-align:right;'>")}</header>${bodyHtml(letter)}</article>`;
  }

  if (template.id === "faang-minimal" || template.id === "ats-clean") {
    return `${base}<article class="cover-export" style="padding:0.9in;"><header style="border-bottom:2px solid ${accent};padding-bottom:16px;text-align:${template.id === "faang-minimal" ? "center" : "left"};"><h1 style="font-size:30px;letter-spacing:.12em;text-transform:uppercase;margin:0;">${esc(letter.name)}</h1><p style="color:${accent};font-weight:900;margin:5px 0;">${esc(letter.title)}</p><p style="color:#64748b;font-size:11px;margin:0;word-break:break-word;">${esc(contactLine(letter))}</p></header>${bodyHtml(letter)}</article>`;
  }

  return `${base}<article class="cover-export" style="padding:0.9in;"><header style="border-bottom:5px solid ${accent};padding-bottom:18px;"><h1 style="font-size:34px;margin:0;">${esc(letter.name)}</h1><p style="color:${accent};font-weight:900;margin:5px 0;">${esc(letter.title)}</p><p style="color:#64748b;font-size:11px;margin:0;word-break:break-word;">${esc(contactLine(letter))}</p></header>${bodyHtml(letter)}</article>`;
}
