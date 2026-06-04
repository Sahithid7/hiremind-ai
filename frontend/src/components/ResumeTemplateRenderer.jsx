
// Premium Resume Template Renderer — HireMind AI

export const RESUME_TEMPLATES = [
  { id: 'ats-clean',       name: 'ATS Clean',        category: 'Minimal',      atsScore: 99, accent: '#1a1a1a', bg: '#ffffff', layout: 'single',  description: 'Maximum ATS compatibility. Pure text layout that parses perfectly through any screening system.' },
  { id: 'faang-minimal',   name: 'FAANG Minimal',    category: 'Tech',         atsScore: 98, accent: '#0ea5e9', bg: '#f0f9ff', layout: 'single',  description: 'Used by engineers at top tech companies. Clean single-column with maximum keyword density.' },
  { id: 'executive-navy',  name: 'Executive Navy',   category: 'Professional', atsScore: 96, accent: '#1e3a5f', bg: '#f8fafc', layout: 'sidebar', description: 'Dark sidebar with strong contrast. Projects authority for senior and leadership positions.' },
  { id: 'emerald-modern',  name: 'Emerald Modern',   category: 'Modern',       atsScore: 95, accent: '#059669', bg: '#f0fdf4', layout: 'single',  description: 'Bold green accent with clean sections. Fresh modern look that stands out from the crowd.' },
  { id: 'slate-clean',     name: 'Slate Clean',      category: 'Minimal',      atsScore: 97, accent: '#334155', bg: '#f8fafc', layout: 'single',  description: 'Ultra-minimal slate design. Typography-first approach lets your experience speak for itself.' },
  { id: 'crimson-bold',    name: 'Crimson Bold',     category: 'Bold',         atsScore: 93, accent: '#be123c', bg: '#fff1f2', layout: 'sidebar', description: 'High-contrast crimson design. Achievement-focused layout that makes your metrics pop.' },
  { id: 'violet-creative', name: 'Violet Creative',  category: 'Creative',     atsScore: 91, accent: '#7c3aed', bg: '#f5f3ff', layout: 'sidebar', description: 'Purple-toned sidebar with personality. Great for design-adjacent and startup roles.' },
  { id: 'midnight-pro',    name: 'Midnight Pro',     category: 'Professional', atsScore: 94, accent: '#0f172a', bg: '#f1f5f9', layout: 'sidebar', description: 'Dark sidebar with blue accents. Premium look for senior individual contributors.' },
  { id: 'gold-executive',  name: 'Gold Executive',   category: 'Executive',    atsScore: 95, accent: '#92400e', bg: '#fffbeb', layout: 'single',  description: 'Warm gold serif header for executive presence. Built for management and consulting roles.' },
  { id: 'double-column',   name: 'Double Column',    category: 'Modern',       atsScore: 94, accent: '#2563eb', bg: '#eff6ff', layout: 'double',  description: 'Two-column layout with skills sidebar. Efficient use of space for experience-rich profiles.' },
  { id: 'ivy-league',      name: 'Ivy League',       category: 'Classic',      atsScore: 97, accent: '#1c1917', bg: '#fafaf9', layout: 'single',  description: 'Classic academic style with centered header. Elegant and timeless for traditional industries.' },
  { id: 'timeline-clean',  name: 'Timeline',         category: 'Creative',     atsScore: 92, accent: '#0891b2', bg: '#ecfeff', layout: 'single',  description: 'Visual timeline for experience with skills sidebar. Shows career progression at a glance.' },
  { id: 'high-performer',  name: 'High Performer',   category: 'Bold',         atsScore: 95, accent: '#16a34a', bg: '#f0fdf4', layout: 'single',  description: 'Achievement-box highlights your top metrics. For candidates with strong quantified results.' },
  { id: 'modern-centered', name: 'Contemporary',     category: 'Modern',       atsScore: 93, accent: '#6d28d9', bg: '#f5f3ff', layout: 'double',  description: 'Centered header with two-column body. Modern layout for tech and creative professionals.' },
  { id: 'compact-tech',    name: 'Compact',          category: 'Tech',         atsScore: 96, accent: '#475569', bg: '#f8fafc', layout: 'single',  description: 'Compact high-density layout fitting more content per page. Ideal for experienced candidates.' },
  { id: 'polished-pro',    name: 'Polished',         category: 'Professional', atsScore: 95, accent: '#0f766e', bg: '#f0fdfa', layout: 'single',  description: 'Teal-accented two-column. Polished professional design for corporate and finance roles.' },
];

export const SAMPLE_PERSON = {
  name: 'Alex Rivera',
  title: 'Senior Software Engineer',
  email: 'alex.rivera@email.com',
  phone: '(415) 555-0192',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexrivera',
  website: 'github.com/alexrivera',
  summary: 'Full-stack engineer with 6+ years building high-scale systems at Stripe and Airbnb. Led teams of 4–8 engineers. Reduced API latency by 45% and shipped features used by 2M+ users. Passionate about developer experience and clean architecture.',
  experience: [
    {
      title: 'Senior Software Engineer', company: 'Stripe', location: 'San Francisco, CA',
      start: 'Jan 2021', end: 'Present',
      bullets: [
        'Redesigned payment API reducing p99 latency by 45%, saving $2.1M annually in infrastructure costs',
        'Led migration of monolith to microservices serving 2M+ daily active users with 99.99% uptime',
        'Mentored 4 engineers; 3 promoted to senior within 18 months',
        'Shipped Stripe Radar ML improvements that reduced fraud by 23% across 1,000+ merchants',
      ]
    },
    {
      title: 'Software Engineer', company: 'Airbnb', location: 'San Francisco, CA',
      start: 'Mar 2018', end: 'Dec 2020',
      bullets: [
        'Built search ranking feature that increased booking conversion by 8% ($40M annual revenue impact)',
        'Reduced CI/CD pipeline runtime by 60% through parallelization, saving 200+ eng-hours/month',
        'Developed real-time availability system handling 500K concurrent users during peak travel periods',
      ]
    },
    {
      title: 'Software Engineer', company: 'Dropbox', location: 'San Francisco, CA',
      start: 'Jun 2016', end: 'Feb 2018',
      bullets: [
        'Rebuilt file sync engine in Python/Rust improving throughput by 3x for 600M+ registered users',
        'Shipped desktop client performance improvements reducing memory usage by 40%',
      ]
    },
  ],
  education: [
    { degree: 'B.S. Computer Science', school: 'UC Berkeley', year: '2016', gpa: '3.8', honors: "Dean's List 2014–2016" }
  ],
  skills: ['Python','TypeScript','React','Go','PostgreSQL','Redis','AWS','Kubernetes','Docker','GraphQL','Rust','Terraform','gRPC','Kafka'],
  projects: [
    { name: 'OpenMetrics', tech: 'Python, Prometheus, Grafana', description: 'Open-source observability library with 1.4K GitHub stars used by 50+ companies.', url: 'github.com/alexrivera/openmetrics' },
    { name: 'FastQueue', tech: 'Go, Redis, WebSocket', description: 'High-throughput job queue processing 10M+ tasks/day. Used in production at 3 startups.', url: 'github.com/alexrivera/fastqueue' },
  ],
  certifications: ['AWS Certified Solutions Architect – Associate (2023)', 'Google Cloud Professional Data Engineer (2022)'],
};

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────
// 794px = A4 width (210mm) at 96dpi. Using px so scale(cardWidth/794) is exact.
const css = {
  page: 'font-family: "Inter", "Segoe UI", Arial, sans-serif; color: #1a1a1a; background: #fff; width: 794px; min-height: 1123px; box-sizing: border-box;',
  reset: '* { margin: 0; padding: 0; box-sizing: border-box; }',
};

function secTitle(label, color, borderColor) {
  return `<div style="font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${color};border-bottom:2px solid ${borderColor || color};padding-bottom:5px;margin:18px 0 11px;">${label}</div>`;
}

function expBlock(e, accentColor) {
  const bullets = (e.bullets || []).map(b =>
    `<li style="font-size:12px;color:#333;margin-bottom:4px;line-height:1.55;padding-left:4px;">${b}</li>`
  ).join('');
  return `
  <div style="margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
      <div>
        <div style="font-size:13.5px;font-weight:700;color:#111;">${e.title}</div>
        <div style="font-size:12.5px;color:${accentColor};font-weight:600;margin-top:1px;">${e.company}${e.location ? ` <span style="color:#888;font-weight:400;">· ${e.location}</span>` : ''}</div>
      </div>
      <div style="font-size:11px;color:#666;background:#f5f5f5;padding:3px 10px;border-radius:4px;white-space:nowrap;flex-shrink:0;">${e.start} – ${e.end || 'Present'}</div>
    </div>
    ${bullets ? `<ul style="margin:7px 0 0 14px;padding:0;">${bullets}</ul>` : ''}
  </div>`;
}

function eduBlock(e, accentColor) {
  return `
  <div style="margin-bottom:11px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
      <div>
        <div style="font-size:13px;font-weight:700;color:#111;">${e.degree}</div>
        <div style="font-size:12px;color:${accentColor};font-weight:600;">${e.school}</div>
        ${e.honors ? `<div style="font-size:11px;color:#666;">${e.honors}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#666;background:#f5f5f5;padding:3px 10px;border-radius:4px;">${e.year}</div>
        ${e.gpa ? `<div style="font-size:11px;color:#888;margin-top:3px;">GPA: ${e.gpa}</div>` : ''}
      </div>
    </div>
  </div>`;
}

function skillChips(skills, accent, pillBg, pillText) {
  return skills.map(s => {
    const txt = typeof s === 'string' ? s : s?.name || '';
    return `<span style="display:inline-block;padding:3px 11px;border-radius:99px;background:${pillBg};color:${pillText};font-size:11px;font-weight:500;margin:2px 3px;">${txt}</span>`;
  }).join('');
}

function projBlock(p, accent) {
  return `
  <div style="margin-bottom:11px;">
    <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
      <span style="font-size:13px;font-weight:700;color:#111;">${p.name}</span>
      ${p.tech ? `<span style="font-size:11px;color:#888;">${p.tech}</span>` : ''}
    </div>
    ${p.description ? `<p style="font-size:12px;color:#444;margin:4px 0 2px;line-height:1.5;">${p.description}</p>` : ''}
    ${p.url ? `<a style="font-size:11px;color:${accent};" href="https://${p.url.replace(/^https?:\/\//,'')}">${p.url}</a>` : ''}
  </div>`;
}

// ─── TEMPLATE 1: FAANG Minimal (clean single-column, max ATS) ─────────────────
function renderFAANGMinimal(d) {
  const acc = '#0ea5e9';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:36px 48px;}</style></head><body>
  <div style="border-bottom:3px solid ${acc};padding-bottom:16px;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
      <div>
        <h1 style="font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${d.name}</h1>
        ${d.title ? `<div style="font-size:14px;color:${acc};font-weight:600;margin-top:4px;">${d.title}</div>` : ''}
      </div>
      <div style="font-size:11.5px;color:#475569;text-align:right;line-height:1.9;">
        ${d.email ? `<div>✉ ${d.email}</div>` : ''}
        ${d.phone ? `<div>✆ ${d.phone}</div>` : ''}
        ${d.location ? `<div>◎ ${d.location}</div>` : ''}
        ${d.linkedin ? `<div style="color:${acc};">${d.linkedin}</div>` : ''}
        ${d.website ? `<div style="color:${acc};">${d.website}</div>` : ''}
      </div>
    </div>
  </div>
  ${d.summary ? `${secTitle('Professional Summary', acc)}<p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p>` : ''}
  ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
  ${d.skills?.length ? `${secTitle('Skills', acc)}<div>${skillChips(d.skills, acc, '#e0f2fe', '#0c4a6e')}</div>` : ''}
  ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
  ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  ${d.certifications?.length ? `${secTitle('Certifications', acc)}${d.certifications.map(c=>`<div style="font-size:12px;color:#333;padding:3px 0;border-bottom:1px solid #f0f0f0;">• ${typeof c==='string'?c:c.name||c}</div>`).join('')}` : ''}
</body></html>`;
}

// ─── TEMPLATE 2: Executive Navy (dark sidebar, prestigious) ──────────────────
function renderExecutiveNavy(d) {
  const acc = '#1e3a5f'; const light = '#e8f0fe'; const lightText = '#1e3a5f';
  const sidebar = `
  <div style="width:220px;background:${acc};padding:32px 20px;flex-shrink:0;min-height:297mm;">
    <div style="margin-bottom:28px;">
      <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.15);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;">${(d.name||'?').charAt(0)}</div>
      <div style="font-size:17px;font-weight:800;color:#fff;text-align:center;line-height:1.2;">${d.name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;margin-top:4px;">${d.title||''}</div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:10px;">Contact</div>
      ${d.email?'<div style="font-size:10.5px;color:rgba(255,255,255,0.85);margin-bottom:6px;word-break:break-all;">✉ '+d.email+'</div>':''}
      ${d.phone?'<div style="font-size:10.5px;color:rgba(255,255,255,0.85);margin-bottom:6px;">✆ '+d.phone+'</div>':''}
      ${d.location?'<div style="font-size:10.5px;color:rgba(255,255,255,0.85);margin-bottom:6px;">◎ '+d.location+'</div>':''}
      ${d.linkedin?'<div style="font-size:10px;color:rgba(255,255,255,0.65);margin-bottom:4px;word-break:break-all;">'+d.linkedin+'</div>':''}
      ${d.website?'<div style="font-size:10px;color:rgba(255,255,255,0.65);word-break:break-all;">'+d.website+'</div>':''}
    </div>
    ${d.skills?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:14px;margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:10px;">Skills</div>
      ${d.skills.map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?'<div style="font-size:10.5px;color:rgba(255,255,255,0.85);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.08);">'+t+'</div>':''}).join('')}
    </div>` : ''}
    ${d.certifications?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:14px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:10px;">Certifications</div>
      ${d.certifications.map(c=>{const t=typeof c==='string'?c:c?.name||'';return '<div style="font-size:10px;color:rgba(255,255,255,0.75);margin-bottom:6px;line-height:1.4;">'+t+'</div>'}).join('')}
    </div>` : ''}
  </div>`;
  const main = `
  <div style="flex:1;padding:36px 32px 36px 28px;">
    ${d.summary ? `<div style="margin-bottom:4px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:5px;margin-bottom:10px;">Profile</div><p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p></div>` : ''}
    ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
    ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
    ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  </div>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css.reset} body{${css.page}}</style></head><body>
  <div style="display:flex;min-height:297mm;">${sidebar}${main}</div>
  </body></html>`;
}

// ─── TEMPLATE 3: Emerald Modern (bold green accent, clean) ───────────────────
function renderEmeraldModern(d) {
  const acc = '#059669'; const pill = '#d1fae5'; const pillText = '#064e3b';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:40px 50px;}</style></head><body>
  <div style="background:${acc};margin:-40px -50px 0;padding:32px 50px 24px;margin-bottom:24px;">
    <h1 style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-0.02em;">${d.name}</h1>
    ${d.title ? `<div style="font-size:14px;color:rgba(255,255,255,0.85);font-weight:500;margin-top:4px;">${d.title}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:11.5px;color:rgba(255,255,255,0.8);">
      ${d.email ? `<span>✉ ${d.email}</span>` : ''}
      ${d.phone ? `<span>✆ ${d.phone}</span>` : ''}
      ${d.location ? `<span>◎ ${d.location}</span>` : ''}
      ${d.linkedin ? `<span>${d.linkedin}</span>` : ''}
      ${d.website ? `<span>${d.website}</span>` : ''}
    </div>
  </div>
  ${d.summary ? `${secTitle('Summary', acc)}<p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p>` : ''}
  ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
  ${d.skills?.length ? `${secTitle('Skills', acc)}<div>${skillChips(d.skills, acc, pill, pillText)}</div>` : ''}
  ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
  ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  ${d.certifications?.length ? `${secTitle('Certifications', acc)}${d.certifications.map(c=>`<div style="font-size:12px;color:#333;padding:3px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}` : ''}
</body></html>`;
}

// ─── TEMPLATE 4: Slate Clean (ultra-minimal, typography-first) ──────────────
function renderSlateClean(d) {
  const acc = '#334155';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>${css.reset} body{${css.page}padding:44px 56px;font-family:'Segoe UI',Arial,sans-serif;}
h1{font-family:'Playfair Display',Georgia,serif;}
</style></head><body>
  <div style="margin-bottom:24px;">
    <h1 style="font-size:32px;font-weight:800;color:#0f172a;letter-spacing:-0.01em;">${d.name}</h1>
    ${d.title ? `<div style="font-size:14px;color:#64748b;font-weight:400;margin-top:5px;letter-spacing:0.02em;">${d.title}</div>` : ''}
    <div style="height:2px;background:linear-gradient(to right,${acc},transparent);margin:14px 0;"></div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:11.5px;color:#64748b;">
      ${d.email ? `<span>${d.email}</span>` : ''}
      ${d.phone ? `<span>${d.phone}</span>` : ''}
      ${d.location ? `<span>${d.location}</span>` : ''}
      ${d.linkedin ? `<span style="color:${acc};">${d.linkedin}</span>` : ''}
      ${d.website ? `<span style="color:${acc};">${d.website}</span>` : ''}
    </div>
  </div>
  ${d.summary ? `<div style="margin-bottom:4px;"><div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px;">Summary</div><p style="font-size:12.5px;color:#374151;line-height:1.75;">${d.summary}</p></div>` : ''}
  ${d.experience?.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 11px;">Experience</div>${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
  ${d.skills?.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 11px;">Skills</div><div>${skillChips(d.skills, acc, '#f1f5f9', '#334155')}</div>` : ''}
  ${d.education?.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 11px;">Education</div>${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
  ${d.projects?.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 11px;">Projects</div>${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  ${d.certifications?.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 11px;">Certifications</div>${d.certifications.map(c=>`<div style="font-size:12px;color:#333;padding:3px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}` : ''}
</body></html>`;
}

// ─── TEMPLATE 5: Crimson Bold (sidebar with red accent, standout) ────────────
function renderCrimsonBold(d) {
  const acc = '#be123c'; const sidebarBg = '#1c0a0f';
  const sidebar = `
  <div style="width:200px;background:${sidebarBg};padding:30px 18px;flex-shrink:0;min-height:297mm;">
    <div style="border-bottom:2px solid ${acc};padding-bottom:20px;margin-bottom:20px;">
      <div style="width:68px;height:68px;border-radius:8px;background:${acc};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;">${(d.name||'?').charAt(0)}</div>
      <div style="font-size:15px;font-weight:800;color:#fff;text-align:center;line-height:1.25;">${d.name}</div>
      <div style="font-size:10.5px;color:rgba(255,255,255,0.6);text-align:center;margin-top:4px;">${d.title||''}</div>
    </div>
    <div style="margin-bottom:18px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Contact</div>
      ${d.email?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;word-break:break-all;">'+d.email+'</div>':''}
      ${d.phone?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.phone+'</div>':''}
      ${d.location?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.location+'</div>':''}
      ${d.linkedin?'<div style="font-size:9.5px;color:rgba(255,255,255,0.55);margin-bottom:4px;word-break:break-all;">'+d.linkedin+'</div>':''}
      ${d.website?'<div style="font-size:9.5px;color:rgba(255,255,255,0.55);word-break:break-all;">'+d.website+'</div>':''}
    </div>
    ${d.skills?.length ? `<div style="margin-bottom:18px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Skills</div>
      ${d.skills.map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?'<div style="font-size:10px;color:rgba(255,255,255,0.8);padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.08);">'+t+'</div>':''}).join('')}
    </div>` : ''}
    ${d.certifications?.length ? `<div>
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Certifications</div>
      ${d.certifications.map(c=>{const t=typeof c==='string'?c:c?.name||'';return '<div style="font-size:9.5px;color:rgba(255,255,255,0.7);margin-bottom:5px;line-height:1.4;">'+t+'</div>'}).join('')}
    </div>` : ''}
  </div>`;
  const main = `
  <div style="flex:1;padding:32px 30px;background:#fff;">
    ${d.summary ? `<div style="margin-bottom:4px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin-bottom:10px;">Profile</div><p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p></div>` : ''}
    ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
    ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
    ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  </div>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css.reset} body{${css.page}}</style></head><body>
  <div style="display:flex;min-height:297mm;">${sidebar}${main}</div>
  </body></html>`;
}

// ─── TEMPLATE 6: Violet Creative ─────────────────────────────────────────────
function renderVioletCreative(d) {
  const acc = '#7c3aed'; const sidebarBg = '#2e1065';
  const sidebar = `
  <div style="width:210px;background:${sidebarBg};padding:30px 18px;flex-shrink:0;min-height:297mm;">
    <div style="margin-bottom:24px;text-align:center;">
      <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,${acc},#a855f7);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;">${(d.name||'?').charAt(0)}</div>
      <div style="font-size:16px;font-weight:800;color:#fff;line-height:1.2;">${d.name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:4px;">${d.title||''}</div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#a855f7;margin-bottom:9px;">Contact</div>
      ${d.email?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;word-break:break-all;">'+d.email+'</div>':''}
      ${d.phone?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.phone+'</div>':''}
      ${d.location?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.location+'</div>':''}
      ${d.linkedin?'<div style="font-size:9.5px;color:rgba(255,255,255,0.5);margin-bottom:4px;word-break:break-all;">'+d.linkedin+'</div>':''}
      ${d.website?'<div style="font-size:9.5px;color:rgba(255,255,255,0.5);word-break:break-all;">'+d.website+'</div>':''}
    </div>
    ${d.skills?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:14px;margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#a855f7;margin-bottom:9px;">Skills</div>
      ${d.skills.map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?'<span style="display:inline-block;background:rgba(168,85,247,0.25);color:rgba(255,255,255,0.9);font-size:10px;padding:2px 8px;border-radius:4px;margin:2px 2px;">'+t+'</span>':''}).join('')}
    </div>` : ''}
  </div>`;
  const main = `
  <div style="flex:1;padding:32px 28px;background:#fff;">
    ${d.summary ? `<div style="background:#f5f3ff;border-left:4px solid ${acc};padding:12px 16px;margin-bottom:4px;border-radius:0 8px 8px 0;"><p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p></div>` : ''}
    ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
    ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
    ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
    ${d.certifications?.length ? `${secTitle('Certifications', acc)}${d.certifications.map(c=>`<div style="font-size:12px;color:#333;padding:3px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}` : ''}
  </div>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css.reset} body{${css.page}}</style></head><body>
  <div style="display:flex;min-height:297mm;">${sidebar}${main}</div>
  </body></html>`;
}

// ─── TEMPLATE 7: Midnight Pro (dark sidebar, dual accent) ────────────────────
function renderMidnightPro(d) {
  const acc = '#0ea5e9'; const sidebarBg = '#0f172a';
  const sidebar = `
  <div style="width:210px;background:${sidebarBg};padding:32px 20px;flex-shrink:0;min-height:297mm;">
    <div style="border-bottom:2px solid ${acc};padding-bottom:20px;margin-bottom:18px;text-align:center;">
      <div style="width:72px;height:72px;border-radius:12px;background:linear-gradient(135deg,${acc},#0284c7);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;">${(d.name||'?').charAt(0)}</div>
      <div style="font-size:16px;font-weight:800;color:#fff;line-height:1.2;">${d.name}</div>
      <div style="font-size:10.5px;color:${acc};margin-top:4px;font-weight:500;">${d.title||''}</div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:9px;">Contact</div>
      ${d.email?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;word-break:break-all;">'+d.email+'</div>':''}
      ${d.phone?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.phone+'</div>':''}
      ${d.location?'<div style="font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:5px;">'+d.location+'</div>':''}
      ${d.linkedin?'<div style="font-size:9.5px;color:rgba(255,255,255,0.5);word-break:break-all;margin-bottom:4px;">'+d.linkedin+'</div>':''}
      ${d.website?'<div style="font-size:9.5px;color:rgba(255,255,255,0.5);word-break:break-all;">'+d.website+'</div>':''}
    </div>
    ${d.skills?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;margin-bottom:16px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:9px;">Technical Skills</div>
      ${d.skills.map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?'<div style="font-size:10px;color:rgba(255,255,255,0.8);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'+t+'</div>':''}).join('')}
    </div>` : ''}
    ${d.certifications?.length ? `<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${acc};margin-bottom:9px;">Certifications</div>
      ${d.certifications.map(c=>{const t=typeof c==='string'?c:c?.name||'';return '<div style="font-size:9.5px;color:rgba(255,255,255,0.7);margin-bottom:5px;line-height:1.4;">'+t+'</div>'}).join('')}
    </div>` : ''}
  </div>`;
  const main = `
  <div style="flex:1;padding:32px 28px;background:#fff;">
    ${d.summary ? `<div style="background:#f0f9ff;border-left:3px solid ${acc};padding:12px 16px;margin-bottom:4px;"><p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p></div>` : ''}
    ${d.experience?.length ? `${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
    ${d.education?.length ? `${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
    ${d.projects?.length ? `${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  </div>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css.reset} body{${css.page}}</style></head><body>
  <div style="display:flex;min-height:297mm;">${sidebar}${main}</div>
  </body></html>`;
}

// ─── TEMPLATE 8: Gold Executive (warm tones, luxury feel) ────────────────────
function renderGoldExecutive(d) {
  const acc = '#92400e'; const gold = '#d97706';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:40px 52px;}</style></head><body>
  <div style="background:linear-gradient(135deg,#92400e,#b45309);padding:28px 0 24px;margin:-40px -52px 0;padding-left:52px;padding-right:52px;margin-bottom:0;">
    <h1 style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-0.01em;">${d.name}</h1>
    ${d.title ? `<div style="font-size:14px;color:rgba(255,255,255,0.8);font-weight:500;margin-top:5px;">${d.title}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;font-size:11.5px;color:rgba(255,255,255,0.75);">
      ${d.email ? `<span>✉ ${d.email}</span>` : ''}
      ${d.phone ? `<span>✆ ${d.phone}</span>` : ''}
      ${d.location ? `<span>◎ ${d.location}</span>` : ''}
      ${d.linkedin ? `<span>${d.linkedin}</span>` : ''}
      ${d.website ? `<span>${d.website}</span>` : ''}
    </div>
  </div>
  <div style="height:4px;background:linear-gradient(to right,${gold},#fbbf24);margin-bottom:8px;"></div>
  ${d.summary ? `${secTitle('Executive Summary', acc, gold)}<p style="font-size:12.5px;color:#374151;line-height:1.75;">${d.summary}</p>` : ''}
  ${d.experience?.length ? `${secTitle('Professional Experience', acc, gold)}${d.experience.map(e=>expBlock(e,acc)).join('')}` : ''}
  ${d.skills?.length ? `${secTitle('Core Competencies', acc, gold)}<div>${skillChips(d.skills, acc, '#fef3c7', '#78350f')}</div>` : ''}
  ${d.education?.length ? `${secTitle('Education', acc, gold)}${d.education.map(e=>eduBlock(e,acc)).join('')}` : ''}
  ${d.projects?.length ? `${secTitle('Key Projects', acc, gold)}${d.projects.map(p=>projBlock(p,acc)).join('')}` : ''}
  ${d.certifications?.length ? `${secTitle('Certifications', acc, gold)}${d.certifications.map(c=>`<div style="font-size:12px;color:#333;padding:3px 0;border-bottom:1px solid #fef3c7;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}` : ''}
</body></html>`;
}

// ─── TEMPLATE 9: Double Column ───────────────────────────────────────────────
function renderDoubleColumn(d) {
  const acc = '#2563eb';
  const skills = (d.skills||[]).map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?`<span style="display:inline-block;padding:2px 9px;border-radius:4px;background:#dbeafe;color:#1e40af;font-size:10.5px;font-weight:600;margin:2px 2px;">${t}</span>`:''}).join('');
  const certs = (d.certifications||[]).map(c=>`<div style="font-size:11px;color:#374151;padding:2px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:0;}</style></head><body>
  <div style="background:${acc};padding:24px 32px 20px;">
    <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0;">${d.name}</h1>
    ${d.title?`<div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">${d.title}</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:11px;color:rgba(255,255,255,0.75);">
      ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>✆ ${d.phone}</span>`:''}${d.location?`<span>◎ ${d.location}</span>`:''}${d.linkedin?`<span>${d.linkedin}</span>`:''}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:38% 62%;min-height:calc(297mm - 80px);">
    <div style="background:#f8fafc;padding:22px 18px;border-right:1px solid #e2e8f0;">
      ${d.summary?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin-bottom:10px;">Profile</div><p style="font-size:11px;color:#374151;line-height:1.65;">${d.summary}</p>`:''}
      ${d.skills?.length?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:14px 0 10px;">Skills</div><div>${skills}</div>`:''}
      ${d.education?.length?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:14px 0 10px;">Education</div>${d.education.map(e=>eduBlock(e,acc)).join('')}`:''}
      ${d.certifications?.length?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:14px 0 10px;">Certifications</div>${certs}`:''}
    </div>
    <div style="padding:22px 22px;">
      ${d.experience?.length?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin-bottom:14px;">Experience</div>${d.experience.map(e=>expBlock(e,acc)).join('')}`:''}
      ${d.projects?.length?`<div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:14px 0 12px;">Projects</div>${d.projects.map(p=>projBlock(p,acc)).join('')}`:''}
    </div>
  </div>
</body></html>`;
}

// ─── TEMPLATE 10: Ivy League ─────────────────────────────────────────────────
function renderIvyLeague(d) {
  const acc = '#1c1917';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:40px 52px;}</style></head><body>
  <div style="text-align:center;border-bottom:3px double ${acc};padding-bottom:16px;margin-bottom:14px;">
    <h1 style="font-size:30px;font-weight:900;color:${acc};letter-spacing:0.04em;text-transform:uppercase;">${d.name}</h1>
    ${d.title?`<div style="font-size:13px;color:#57534e;font-style:italic;margin-top:4px;">${d.title}</div>`:''}
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;margin-top:10px;font-size:11px;color:#78716c;">
      ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>✆ ${d.phone}</span>`:''}${d.location?`<span>◎ ${d.location}</span>`:''}${d.linkedin?`<span>${d.linkedin}</span>`:''}
    </div>
  </div>
  ${d.summary?`<div style="margin-bottom:14px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${acc};margin-bottom:6px;">Summary</div><p style="font-size:12px;color:#44403c;line-height:1.75;text-align:justify;">${d.summary}</p></div>`:''}
  ${d.experience?.length?`<div style="border-top:1.5px solid ${acc};padding-top:10px;margin-bottom:12px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${acc};margin-bottom:10px;">Experience</div>${d.experience.map(e=>expBlock(e,acc)).join('')}</div>`:''}
  ${d.education?.length?`<div style="border-top:1.5px solid ${acc};padding-top:10px;margin-bottom:12px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${acc};margin-bottom:10px;">Education</div>${d.education.map(e=>eduBlock(e,acc)).join('')}</div>`:''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1.5px solid ${acc};padding-top:10px;">
    ${d.skills?.length?`<div><div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${acc};margin-bottom:6px;">Skills</div><p style="font-size:11.5px;color:#44403c;line-height:1.9;">${(d.skills||[]).map(s=>typeof s==='string'?s:s?.name||'').filter(Boolean).join(' · ')}</p></div>`:''}
    ${d.certifications?.length?`<div><div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${acc};margin-bottom:6px;">Honors & Certs</div>${(d.certifications||[]).map(c=>`<div style="font-size:11.5px;color:#44403c;padding:1px 0;">${typeof c==='string'?c:c?.name||''}</div>`).join('')}</div>`:''}
  </div>
</body></html>`;
}

// ─── TEMPLATE 11: Timeline ───────────────────────────────────────────────────
function renderTimeline(d) {
  const acc = '#0891b2';
  const timelineExp = (d.experience||[]).map(e=>`
    <div style="display:grid;grid-template-columns:16px 1fr;gap:10px;margin-bottom:18px;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:12px;height:12px;border-radius:50%;background:${acc};flex-shrink:0;margin-top:3px;"></div>
        <div style="width:2px;background:#bae6fd;flex:1;margin-top:4px;"></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div><div style="font-size:13px;font-weight:700;color:#0c4a6e;">${e.title}</div><div style="font-size:12px;color:${acc};font-weight:600;">${e.company}${e.location?` · <span style="color:#64748b;">${e.location}</span>`:''}</div></div>
          ${e.start?`<div style="font-size:10.5px;color:#64748b;white-space:nowrap;">${e.start} – ${e.end||'Present'}</div>`:''}
        </div>
        <ul style="margin:6px 0 0 14px;padding:0;">${(e.bullets||[]).map(b=>`<li style="font-size:11.5px;color:#374151;margin-bottom:3px;line-height:1.55;">${b}</li>`).join('')}</ul>
      </div>
    </div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:32px 44px;}</style></head><body>
  <div style="background:linear-gradient(135deg,${acc},#0e7490);padding:22px 28px;border-radius:12px;margin-bottom:20px;">
    <h1 style="font-size:27px;font-weight:800;color:#fff;margin:0;">${d.name}</h1>
    ${d.title?`<div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">${d.title}</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;font-size:11px;color:rgba(255,255,255,0.75);">
      ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>✆ ${d.phone}</span>`:''}${d.location?`<span>◎ ${d.location}</span>`:''}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:60% 40%;gap:20px;">
    <div>
      ${d.experience?.length?`<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:14px;">Experience</div>${timelineExp}`:''}
    </div>
    <div>
      ${d.summary?`<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Profile</div><p style="font-size:11.5px;color:#374151;line-height:1.65;margin-bottom:16px;">${d.summary}</p>`:''}
      ${d.skills?.length?`<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Skills</div><div style="margin-bottom:16px;">${(d.skills||[]).map(s=>{const t=typeof s==='string'?s:s?.name||'';return t?`<span style="display:inline-block;padding:2px 9px;border-radius:4px;background:#cffafe;color:#0e7490;font-size:10.5px;font-weight:600;margin:2px;">${t}</span>`:''}).join('')}</div>`:''}
      ${d.education?.length?`<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:8px;">Education</div>${d.education.map(e=>eduBlock(e,acc)).join('')}`:''}
      ${d.certifications?.length?`<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-top:12px;margin-bottom:8px;">Certifications</div>${(d.certifications||[]).map(c=>`<div style="font-size:11px;color:#374151;padding:2px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}`:''}
    </div>
  </div>
</body></html>`;
}

// ─── TEMPLATE 12: High Performer ─────────────────────────────────────────────
function renderHighPerformer(d) {
  const acc = '#16a34a';
  const achievements = (d.experience||[]).flatMap(e=>e.bullets||[]).filter(b=>/\d+%|\d+x|\$\d+|\d+[KMB]/.test(b)).slice(0,4);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:36px 46px;}</style></head><body>
  <div style="border-left:6px solid ${acc};padding-left:18px;margin-bottom:20px;">
    <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:0;">${d.name}</h1>
    ${d.title?`<div style="font-size:13.5px;color:${acc};font-weight:700;margin-top:5px;">${d.title}</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;font-size:11px;color:#64748b;">
      ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>✆ ${d.phone}</span>`:''}${d.location?`<span>◎ ${d.location}</span>`:''}${d.linkedin?`<span>${d.linkedin}</span>`:''}
    </div>
  </div>
  ${achievements.length?`<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:18px;"><div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:10px;">Key Achievements</div>${achievements.map(a=>`<div style="display:flex;gap:8px;margin-bottom:7px;"><span style="color:${acc};font-weight:700;flex-shrink:0;">▸</span><span style="font-size:12px;color:#166534;line-height:1.5;">${a}</span></div>`).join('')}</div>`:''}
  ${d.summary?`${secTitle('Professional Summary', acc)}<p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p>`:''}
  ${d.experience?.length?`${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}`:''}
  ${d.skills?.length?`${secTitle('Technical Skills', acc)}<div>${skillChips(d.skills,acc,'#dcfce7','#14532d')}</div>`:''}
  ${d.education?.length?`${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}`:''}
  ${d.projects?.length?`${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}`:''}
</body></html>`;
}

// ─── TEMPLATE 13: Contemporary (centered header, two-col body) ───────────────
function renderContemporary(d) {
  const acc = '#6d28d9';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:0;}</style></head><body>
  <div style="background:linear-gradient(135deg,#4c1d95,${acc});text-align:center;padding:28px 40px 24px;">
    <h1 style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-0.01em;margin:0;">${d.name}</h1>
    ${d.title?`<div style="font-size:13px;color:#ddd6fe;font-weight:600;margin-top:5px;">${d.title}</div>`:''}
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;margin-top:12px;font-size:11px;color:rgba(255,255,255,0.75);">
      ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>✆ ${d.phone}</span>`:''}${d.location?`<span>◎ ${d.location}</span>`:''}${d.linkedin?`<span>${d.linkedin}</span>`:''}
    </div>
  </div>
  ${d.summary?`<div style="background:#faf5ff;border-bottom:1px solid #e9d5ff;padding:14px 40px;"><p style="font-size:12px;color:#4c1d95;line-height:1.7;text-align:center;max-width:600px;margin:0 auto;">${d.summary}</p></div>`:''}
  <div style="display:grid;grid-template-columns:58% 42%;gap:0;padding:20px 28px;">
    <div style="padding-right:20px;border-right:1px solid #e9d5ff;">
      ${d.experience?.length?`${secTitle('Experience', acc)}<div style="margin-top:2px;">${d.experience.map(e=>expBlock(e,acc)).join('')}</div>`:''}
      ${d.projects?.length?`${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}`:''}
    </div>
    <div style="padding-left:20px;">
      ${d.skills?.length?`${secTitle('Skills', acc)}<div>${skillChips(d.skills,acc,'#ede9fe','#4c1d95')}</div>`:''}
      ${d.education?.length?`${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}`:''}
      ${d.certifications?.length?`${secTitle('Certifications', acc)}${(d.certifications||[]).map(c=>`<div style="font-size:11px;color:#374151;padding:2px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}`:''}
    </div>
  </div>
</body></html>`;
}

// ─── TEMPLATE 14: Compact ────────────────────────────────────────────────────
function renderCompact(d) {
  const acc = '#475569';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:28px 42px;font-size:11px;}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${acc};padding-bottom:10px;margin-bottom:10px;">
    <div>
      <h1 style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;margin:0;">${d.name}</h1>
      ${d.title?`<div style="font-size:12px;color:${acc};font-weight:600;margin-top:3px;">${d.title}</div>`:''}
    </div>
    <div style="text-align:right;font-size:10.5px;color:#64748b;line-height:1.8;">
      ${d.email?`<div>✉ ${d.email}</div>`:''}${d.phone?`<div>✆ ${d.phone}</div>`:''}${d.location?`<div>◎ ${d.location}</div>`:''}
    </div>
  </div>
  ${d.summary?`<p style="font-size:11.5px;color:#374151;line-height:1.6;margin-bottom:10px;">${d.summary}</p>`:''}
  ${d.skills?.length?`<div style="margin-bottom:10px;"><div style="font-size:8.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${acc};margin-bottom:5px;">Skills</div><p style="font-size:11.5px;color:#374151;line-height:1.8;">${(d.skills||[]).map(s=>typeof s==='string'?s:s?.name||'').filter(Boolean).join(' · ')}</p></div>`:''}
  ${d.experience?.length?`<div style="margin-bottom:10px;"><div style="font-size:8.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${acc};border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:8px;">Experience</div>${d.experience.map(e=>`<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;"><strong style="font-size:12px;color:#0f172a;">${e.title}${e.company?`, <span style="color:${acc};">${e.company}</span>`:''}</strong><span style="font-size:10.5px;color:#94a3b8;">${e.start||''}${e.end?` – ${e.end}`:''}</span></div><ul style="margin:4px 0 0 14px;padding:0;">${(e.bullets||[]).slice(0,4).map(b=>`<li style="color:#374151;margin-bottom:2px;line-height:1.5;">${b}</li>`).join('')}</ul></div>`).join('')}</div>`:''}
  ${d.education?.length?`<div style="margin-bottom:8px;"><div style="font-size:8.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${acc};border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:6px;">Education</div>${d.education.map(e=>`<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><div><strong style="font-size:12px;color:#0f172a;">${e.degree}</strong><span style="font-size:11px;color:#64748b;"> · ${e.school}</span></div><span style="font-size:10.5px;color:#94a3b8;">${e.year||''}</span></div>`).join('')}</div>`:''}
  ${d.certifications?.length?`<div><div style="font-size:8.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${acc};margin-bottom:5px;">Certifications</div><p style="font-size:11.5px;color:#374151;">${(d.certifications||[]).map(c=>typeof c==='string'?c:c?.name||'').filter(Boolean).join(' · ')}</p></div>`:''}
</body></html>`;
}

// ─── TEMPLATE 15: Polished ───────────────────────────────────────────────────
function renderPolished(d) {
  const acc = '#0f766e';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${css.reset} body{${css.page}padding:0;}</style></head><body>
  <div style="background:${acc};height:8px;"></div>
  <div style="padding:28px 46px 0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.5px solid #ccfbf1;padding-bottom:18px;margin-bottom:6px;">
      <div>
        <h1 style="font-size:29px;font-weight:800;color:#0f172a;letter-spacing:-0.01em;margin:0;">${d.name}</h1>
        ${d.title?`<div style="font-size:13.5px;color:${acc};font-weight:700;margin-top:5px;">${d.title}</div>`:''}
      </div>
      <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.8;">
        ${d.email?`<div>✉ ${d.email}</div>`:''}${d.phone?`<div>✆ ${d.phone}</div>`:''}${d.location?`<div>◎ ${d.location}</div>`:''}${d.linkedin?`<div style="color:${acc};">${d.linkedin}</div>`:''}
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:62% 38%;gap:0;padding:12px 46px;">
    <div style="padding-right:22px;border-right:1px solid #ccfbf1;">
      ${d.summary?`${secTitle('Summary', acc)}<p style="font-size:12.5px;color:#374151;line-height:1.7;">${d.summary}</p>`:''}
      ${d.experience?.length?`${secTitle('Experience', acc)}${d.experience.map(e=>expBlock(e,acc)).join('')}`:''}
      ${d.projects?.length?`${secTitle('Projects', acc)}${d.projects.map(p=>projBlock(p,acc)).join('')}`:''}
    </div>
    <div style="padding-left:22px;">
      ${d.skills?.length?`${secTitle('Skills', acc)}<div>${skillChips(d.skills,acc,'#ccfbf1','#134e4a')}</div>`:''}
      ${d.education?.length?`${secTitle('Education', acc)}${d.education.map(e=>eduBlock(e,acc)).join('')}`:''}
      ${d.certifications?.length?`${secTitle('Certifications', acc)}${(d.certifications||[]).map(c=>`<div style="font-size:11px;color:#374151;padding:2px 0;">• ${typeof c==='string'?c:c?.name||''}</div>`).join('')}`:''}
    </div>
  </div>
</body></html>`;
}

// ─── ATS CLEAN TEMPLATE ──────────────────────────────────────────────────────
// Professional 1-page ATS-optimised layout matching the exact spec.
// Exported separately so pdfExport.js can call it directly.
export function renderATSClean(d) {
  // ── helpers ──────────────────────────────────────────────────────────────
  const e = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const SEC = `
    font-size:11px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.06em; border-bottom:1.5px solid #111;
    padding-bottom:2px; margin:9px 0 4px; color:#111;
  `;

  // Contact line
  const contactParts = [d.location, d.phone, d.email, d.linkedin, d.website].filter(Boolean);
  const contactLine  = contactParts.map(e).join(" &nbsp;|&nbsp; ");

  // ── Skills section ────────────────────────────────────────────────────────
  let skillsHtml = "";
  const cats = d.skills_categorized ?? {};
  const catOrder = [
    ["Programming Languages", "Programming Languages"],
    ["Software Development",  "Software Development"],
    ["Cloud & DevOps",        "Cloud &amp; DevOps"],
    ["Databases",             "Databases"],
    ["AI / ML",               "AI/ML"],
    ["Tools & Platforms",     "Tools &amp; Platforms"],
  ];
  let hasSkillCats = false;
  for (const [key, label] of catOrder) {
    const list = cats[key] ?? [];
    if (list.length) {
      skillsHtml += `<div style="font-size:10px;line-height:1.5;margin-bottom:2px;"><b>${label}:</b> ${list.map(e).join(", ")}</div>`;
      hasSkillCats = true;
    }
  }
  if (!hasSkillCats && (d.skills ?? []).length) {
    skillsHtml = `<div style="font-size:10px;line-height:1.5;"><b>Skills:</b> ${d.skills.map(e).join(", ")}</div>`;
  }

  // ── Experience grouped by company ─────────────────────────────────────────
  const expList = d.experience ?? [];
  const companyOrder = [];
  const companyMap   = {};
  for (const role of expList) {
    const co = role.company || "";
    if (!companyMap[co]) { companyMap[co] = []; companyOrder.push(co); }
    companyMap[co].push(role);
  }

  const expHtml = companyOrder.map((co) => {
    const roles = companyMap[co];
    const coHeader = co
      ? `<div style="font-size:10.5px;font-weight:700;margin-bottom:1px;">${e(co)}</div>`
      : "";
    const rolesHtml = roles.map((r) => {
      const dateStr     = [r.start, r.end || "Present"].filter(Boolean).join(" – ");
      const locDate     = [r.location, dateStr].filter(Boolean).join(" &nbsp;&middot;&nbsp; ");
      const bulletsHtml = (r.bullets ?? []).map(
        (b) => `<li style="font-size:10px;line-height:1.4;margin-bottom:1px;">${e(b)}</li>`
      ).join("");
      return `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:2px;">
          <span style="font-size:10px;font-style:italic;">${e(r.title)}</span>
          <span style="font-size:9.5px;color:#444;white-space:nowrap;margin-left:8px;">${locDate}</span>
        </div>
        ${bulletsHtml ? `<ul style="margin:2px 0 3px 14px;padding:0;">${bulletsHtml}</ul>` : ""}
      `;
    }).join("");
    return `<div style="margin-bottom:6px;">${coHeader}${rolesHtml}</div>`;
  }).join("");

  // ── Education ─────────────────────────────────────────────────────────────
  const eduHtml = (d.education ?? []).map((edu) => `
    <div style="margin-bottom:5px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:10.5px;font-weight:700;">${e(edu.school)}</span>
        <span style="font-size:9.5px;color:#444;white-space:nowrap;margin-left:8px;">${e(edu.duration)}</span>
      </div>
      <div style="font-size:10px;">${e(edu.degree)}</div>
      ${edu.gpa ? `<div style="font-size:10px;">• GPA: ${e(edu.gpa)}</div>` : ""}
      ${edu.coursework ? `<div style="font-size:10px;">• Coursework: ${e(edu.coursework)}</div>` : ""}
    </div>
  `).join("");

  // ── Projects ──────────────────────────────────────────────────────────────
  const projHtml = (d.projects ?? []).map((p) => {
    const dateOrTech  = p.date || p.tech || "";
    const bulletsHtml = (p.bullets ?? []).map(
      (b) => `<div style="font-size:10px;line-height:1.5;margin:1px 0 2px 14px;">&#8226; ${e(b)}</div>`
    ).join("");
    return `<div style="margin-bottom:10px;padding-bottom:0;"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;"><span style="font-size:10.5px;font-weight:700;">${e(p.name)}</span>${dateOrTech ? `<span style="font-size:9.5px;color:#444;white-space:nowrap;margin-left:8px;">${e(dateOrTech)}</span>` : ""}</div>${bulletsHtml}</div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    line-height: 1.35;
    color: #111;
    background: #fff;
    width: 8.5in;
    min-height: 11in;
    padding: 0.5in;
  }
  ul{list-style-type:disc;}
</style>
</head><body>

  <!-- ── Header ── -->
  <div style="margin-bottom:6px;">
    <div style="font-size:18px;font-weight:700;line-height:1.2;margin-bottom:3px;">${e(d.name)}</div>
    <div style="font-size:10px;color:#333;">${contactLine}</div>
    <div style="border-bottom:1.5px solid #111;margin-top:5px;"></div>
  </div>

  ${d.summary ? `
  <!-- ── Summary ── -->
  <div style="margin-bottom:4px;">
    <div style="${SEC}">Professional Summary</div>
    <p style="font-size:10px;line-height:1.4;">${e(d.summary)}</p>
  </div>` : ""}

  ${eduHtml ? `
  <!-- ── Education ── -->
  <div style="margin-bottom:4px;">
    <div style="${SEC}">Education</div>
    ${eduHtml}
  </div>` : ""}

  ${expHtml ? `
  <!-- ── Experience ── -->
  <div style="margin-bottom:4px;">
    <div style="${SEC}">Experience</div>
    ${expHtml}
  </div>` : ""}

  ${projHtml ? `
  <!-- ── Projects ── -->
  <div style="margin-bottom:4px;">
    <div style="${SEC}">Projects</div>
    ${projHtml}
  </div>` : ""}

  ${skillsHtml ? `
  <!-- ── Technical Skills ── -->
  <div>
    <div style="${SEC}">Technical Skills</div>
    ${skillsHtml}
  </div>` : ""}

</body></html>`;
}

// ─── MAIN RENDER FUNCTION ────────────────────────────────────────────────────
export function renderResumeHTML(data, templateId) {
  // Never allow banned/demo data
  const BANNED = ['emily parker','layla morgan','hiremind ai','john doe','jane doe','university name'];
  const isBanned = (s) => s && BANNED.some(b => (s+'').toLowerCase().includes(b));
  
  // Use sample only for gallery previews, never for real user resumes
  const d = data || SAMPLE_PERSON;
  
  // Validate: if name is banned, return empty template
  if (data && isBanned(data.name)) return '<html><body><p style="padding:40px;color:red;">Invalid data — please re-enter your information.</p></body></html>';
  
  switch(templateId) {
    case 'ats-clean':         return renderATSClean(d);
    case 'faang-minimal':     return renderFAANGMinimal(d);
    case 'executive-navy':    return renderExecutiveNavy(d);
    case 'emerald-modern':    return renderEmeraldModern(d);
    case 'slate-clean':       return renderSlateClean(d);
    case 'crimson-bold':      return renderCrimsonBold(d);
    case 'violet-creative':   return renderVioletCreative(d);
    case 'midnight-pro':      return renderMidnightPro(d);
    case 'gold-executive':    return renderGoldExecutive(d);
    case 'double-column':     return renderDoubleColumn(d);
    case 'ivy-league':        return renderIvyLeague(d);
    case 'timeline-clean':    return renderTimeline(d);
    case 'high-performer':    return renderHighPerformer(d);
    case 'modern-centered':   return renderContemporary(d);
    case 'compact-tech':      return renderCompact(d);
    case 'polished-pro':      return renderPolished(d);
    default:                  return renderFAANGMinimal(d);
  }
}
