
// careerSamples.js — HireMind AI
// All sample data uses Alex Rivera (clearly fictional sample person)
// Emily Parker, Layla Morgan, and all other demo names are permanently removed

import { SAMPLE_PERSON } from "../components/ResumeTemplateRenderer";

export const resumeTemplateFilters = [
  "All","Tech","Professional","Modern","Minimal","Bold","Creative","Executive"
];

export const resumeTemplateSamples = [
  // ── Core templates ──────────────────────────────────────────────────────────
  { id: "faang-minimal",       name: "FAANG Minimal",       role: "Software Engineer",    category: "Tech",         layout: "single",  tags: ["All","Tech","Minimal"],          atsScore: 98, accent: "#0ea5e9", description: "Clean single-column used by top engineers. Maximum keyword density, zero visual clutter.", person: SAMPLE_PERSON },
  { id: "executive-navy",      name: "Executive Navy",      role: "Senior Engineer",      category: "Professional", layout: "sidebar", tags: ["All","Professional","Executive"], atsScore: 96, accent: "#1e3a5f", description: "Dark sidebar with strong contrast. Projects authority for senior and leadership roles.", person: SAMPLE_PERSON },
  { id: "gold-executive",      name: "Gold Executive",      role: "Engineering Manager",  category: "Executive",    layout: "single",  tags: ["All","Executive","Professional"], atsScore: 95, accent: "#92400e", description: "Elegant gold-accented serif header. Built for executive, management, and consulting roles.", person: SAMPLE_PERSON },
  { id: "slate-clean",         name: "Slate Clean",         role: "Software Developer",   category: "Minimal",      layout: "single",  tags: ["All","Minimal"],                 atsScore: 97, accent: "#334155", description: "Ultra-minimal slate design. Lets your experience speak without any visual distraction.", person: SAMPLE_PERSON },
  { id: "midnight-pro",        name: "Midnight Pro",        role: "Cloud Engineer",       category: "Professional", layout: "sidebar", tags: ["All","Professional","Tech"],     atsScore: 94, accent: "#0f172a", description: "Dark sidebar with premium look for senior individual contributors.", person: SAMPLE_PERSON },
  { id: "crimson-bold",        name: "Crimson Bold",        role: "Backend Engineer",     category: "Bold",         layout: "single",  tags: ["All","Bold"],                    atsScore: 93, accent: "#be123c", description: "High-contrast with bold accent. Achievement boxes make metrics pop for recruiters.", person: SAMPLE_PERSON },
  { id: "violet-creative",     name: "Violet Creative",     role: "Frontend Developer",   category: "Creative",     layout: "sidebar", tags: ["All","Creative"],                atsScore: 91, accent: "#7c3aed", description: "Purple-toned sidebar with personality. Great for design-adjacent and startup roles.", person: SAMPLE_PERSON },
  { id: "emerald-modern",      name: "Emerald Modern",      role: "Full Stack Developer", category: "Modern",       layout: "single",  tags: ["All","Modern","Tech"],            atsScore: 95, accent: "#059669", description: "Fresh green-accented header. Ideal for modern tech and full-stack product roles.", person: SAMPLE_PERSON },

  // ── Role-specific templates ─────────────────────────────────────────────────
  { id: "cloud-engineer",      name: "Cloud Engineer",      role: "Cloud Engineer",       category: "Tech",         layout: "single",  tags: ["All","Tech","Cloud"],            atsScore: 96, accent: "#0891b2", description: "Teal gradient header, cloud skills prioritized. Built for AWS/GCP/Azure engineers.", person: SAMPLE_PERSON },
  { id: "backend-engineer",    name: "Backend Engineer",    role: "Backend Engineer",     category: "Tech",         layout: "single",  tags: ["All","Tech","Bold"],             atsScore: 95, accent: "#1e40af", description: "Achievement highlight box, metrics-first bullets. Designed for API and systems engineers.", person: SAMPLE_PERSON },
  { id: "data-analyst",        name: "Data Engineer",       role: "Data Engineer",        category: "Tech",         layout: "sidebar", tags: ["All","Tech","Modern"],           atsScore: 94, accent: "#059669", description: "Sidebar layout with data tools prioritized. Built for data pipeline and analytics roles.", person: SAMPLE_PERSON },

  // ── Additional templates ────────────────────────────────────────────────────
  { id: "double-column",       name: "Double Column",       role: "Product Manager",      category: "Modern",       layout: "sidebar", tags: ["All","Modern"],                  atsScore: 94, accent: "#2563eb", description: "True two-column layout for experienced professionals with dense skill sets.", person: SAMPLE_PERSON },
  { id: "ivy-league",          name: "Ivy League",          role: "Business Analyst",     category: "Classic",      layout: "single",  tags: ["All","Classic","Professional"],  atsScore: 97, accent: "#1c1917", description: "Academic-inspired centered header. Ideal for finance, consulting, and business roles.", person: SAMPLE_PERSON },
  { id: "modern-centered",     name: "Contemporary",        role: "AI Engineer",          category: "Modern",       layout: "sidebar", tags: ["All","Modern","Creative"],       atsScore: 93, accent: "#6d28d9", description: "Purple sidebar with centered header. Works well for AI/ML and product engineering.", person: SAMPLE_PERSON },
  { id: "polished-pro",        name: "Polished",            role: "Senior Developer",     category: "Professional", layout: "single",  tags: ["All","Professional"],            atsScore: 95, accent: "#0f766e", description: "Teal-accented gold executive variant. Professional and polished for senior roles.", person: SAMPLE_PERSON },
  { id: "compact-tech",        name: "Compact",             role: "Systems Engineer",     category: "Minimal",      layout: "single",  tags: ["All","Minimal","Tech"],          atsScore: 96, accent: "#475569", description: "Maximum information density. Ideal for experienced engineers with extensive skills.", person: SAMPLE_PERSON },
];

export const coverLetterTemplateSamples = [
  { id: "cover-minimal",    name: "Clean Minimal",    atsScore: 97, accent: "#0ea5e9" },
  { id: "cover-executive",  name: "Executive",        atsScore: 96, accent: "#1e3a5f" },
  { id: "cover-modern",     name: "Modern Bold",      atsScore: 94, accent: "#059669" },
  { id: "cover-corporate",  name: "Corporate",        atsScore: 95, accent: "#334155" },
  { id: "cover-creative",   name: "Creative Accent",  atsScore: 91, accent: "#7c3aed" },
  { id: "cover-serif",      name: "Elegant Serif",    atsScore: 93, accent: "#92400e" },
];

// writingGuideSteps — 10-step resume writing guide for ResumeTips.jsx
export const writingGuideSteps = [
  {
    title: "Contact Information",
    short: "Contact",
    why: "Recruiters need to reach you quickly. Missing or poorly formatted contact info can cost you an interview even when your experience is strong.",
    include: ["Full legal name", "Professional email (name@domain.com)", "Phone number with area code", "City and state (not full address)", "LinkedIn URL", "GitHub or portfolio (if relevant)"],
    practices: ["Use a professional email — avoid nicknames or numbers", "Keep LinkedIn URL clean by customizing it", "Location matters — include it even for remote roles", "List GitHub only if your repos are active and relevant"],
    mistakes: ["Using a unprofessional email address", "Including a full home address", "Forgetting to update your LinkedIn URL", "Leaving out your phone number"],
    tip: "Put your name in a slightly larger font (16–18pt) so recruiters can quickly remember who you are after scanning dozens of resumes.",
    goodExample: "Alex Rivera\nBackend Engineer\nalex.rivera@gmail.com | (415) 555-0192\nSan Francisco, CA | linkedin.com/in/alexrivera | github.com/alexrivera",
    badExample: "alex_guy99@hotmail.com\n555-1234\n123 Main Street, Apt 4B, San Francisco, CA 94105",
    example: "Name · Email · Phone · City · LinkedIn · GitHub"
  },
  {
    title: "Professional Summary",
    short: "Summary",
    why: "The summary is the first thing a recruiter reads. A strong 3-line summary immediately signals your target role, strongest skills, and top impact — saving the recruiter 30 seconds of guessing.",
    include: ["Target role title", "Years of experience or level", "2-3 core technical skills", "One measurable career achievement"],
    practices: ["Keep it 2-4 lines maximum", "Lead with role and experience level", "Reference technologies relevant to the target job", "End with a quantified result or impact statement"],
    mistakes: ["Writing a generic summary that could fit any resume", "Using filler phrases like 'hardworking' or 'team player'", "Making it too long — longer than 5 lines looks like padding", "Starting with 'I am a software engineer' instead of the role itself"],
    tip: "Tailor your summary for each application by including 1-2 keywords from the job description. This takes 5 minutes and measurably improves ATS match scores.",
    goodExample: "Backend engineer with 3+ years building scalable APIs, microservices, and cloud-deployed systems. Reduced API response latency 40% at previous role. Proficient in Python, FastAPI, PostgreSQL, and AWS.",
    badExample: "I am a hardworking software engineer who loves learning new technologies and working in team environments. I have experience in various programming languages and I am looking for a challenging opportunity.",
    example: "Role · Years · Core skills · Top impact"
  },
  {
    title: "Work Experience",
    short: "Experience",
    why: "Experience is the highest-weighted section in most ATS and recruiter reviews. Bullet points with measurable outcomes prove capability far better than a list of responsibilities.",
    include: ["Job title, company name, location, and dates", "4-6 strong action-verb bullets per role", "Quantified outcomes (%, $, x, users, latency)", "Technologies used in context", "Scope of ownership and team impact"],
    practices: ["Start every bullet with a strong past-tense action verb", "Add a metric or result to at least 3 bullets per role", "Show ownership — 'Built and owned the payments service' beats 'Worked on payments'", "List technologies only where they appear organically in context"],
    mistakes: ["Writing job duties instead of accomplishments", "Starting bullets with 'Responsible for...'", "Listing the same tech stack in every bullet", "Missing dates or having unexplained employment gaps"],
    tip: "Use the CAR formula: Context, Action, Result. Even one extra metric per bullet ('Reduced P99 latency by 38%') can move your ATS score from 65 to 82.",
    goodExample: "Software Engineer — Stripe  |  Jan 2022 – Dec 2023\n• Redesigned payment reconciliation API reducing processing time by 60% for 500K+ monthly transactions\n• Led migration of legacy webhook service to event-driven architecture, cutting error rate from 4% to 0.2%\n• Mentored 2 junior engineers; both promoted within 12 months",
    badExample: "Software Engineer — Stripe  |  2022 – 2023\n• Worked on payment APIs\n• Responsible for backend development\n• Participated in code reviews",
    example: "Role · Company · Dates · Metric-rich bullets"
  },
  {
    title: "Skills Section",
    short: "Skills",
    why: "ATS systems scan for exact keyword matches before a human ever reads your resume. A well-grouped skills section ensures you're not filtered out for missing a term that's actually in your arsenal.",
    include: ["Programming languages", "Frameworks and libraries", "Cloud and infrastructure tools", "Databases and data tools", "Testing and DevOps tools"],
    practices: ["Group skills into 3-5 labeled categories", "List skills in order of proficiency within each category", "Only include skills you can discuss confidently in an interview", "Keep each category on one line for ATS readability"],
    mistakes: ["Listing too many skills just to fill space", "Including skills from 10 years ago that you've forgotten", "Writing 'Microsoft Office' for a software engineering role", "Mixing tools of wildly different relevance in the same line"],
    tip: "After uploading your resume to HireMind, run the JD Match Analyzer on the job you want. Add any missing keywords to your skills section where they genuinely reflect your experience.",
    goodExample: "Languages: Python, TypeScript, Go, SQL\nFrameworks: FastAPI, React, Node.js, Django\nCloud: AWS (EC2, S3, Lambda, RDS), GCP\nDatabases: PostgreSQL, Redis, MongoDB\nDevOps: Docker, Kubernetes, GitHub Actions, Terraform",
    badExample: "Python, JavaScript, HTML, CSS, React, Angular, Vue, Java, C++, PHP, Ruby, Swift, SQL, NoSQL, MongoDB, Redis, Docker, Kubernetes, Git, Microsoft Office, Photoshop, Excel",
    example: "Grouped by category · Proficiency-ordered · Honest"
  },
  {
    title: "Education",
    short: "Education",
    why: "Education is a basic qualification filter and is usually ATS-parsed. Missing or poorly formatted education can drop your score even when your experience is strong.",
    include: ["Degree and major", "University or institution name", "Graduation year", "GPA (only if 3.5+)", "Relevant honors, activities, or coursework (only if early-career)"],
    practices: ["List the most recent degree first", "Include university and graduation year even for older degrees", "Skip GPA if below 3.5 — omitting it is neutral, not suspicious", "List relevant coursework only in your first 1-2 years post-graduation"],
    mistakes: ["Listing high school after earning a bachelor's degree", "Forgetting to include the graduation year", "Listing GPA when it's below 3.5", "Using abbreviated school names that ATS may not recognize"],
    tip: "For roles requiring specific education, match the exact degree name in the job description (e.g., 'B.S. Computer Science' not 'undergrad CS'). ATS systems match exact strings.",
    goodExample: "B.S. Computer Science — University of California, Berkeley\nMay 2022 · GPA: 3.7 · Dean's List 2020–2022",
    badExample: "BS CS - UCB 2022\nRelevant coursework: Took some programming classes and a math course",
    example: "Degree · School · Year · GPA (if strong)"
  },
  {
    title: "Projects Section",
    short: "Projects",
    why: "For early-career candidates, projects are the second-strongest proof of skill after experience. A well-written project shows you can build real things — not just study them.",
    include: ["Project name and brief description", "Technologies used (stack)", "Problem solved or goal", "Measurable result or usage (stars, users, uptime)", "Live URL or GitHub link if available"],
    practices: ["Use the same CAR formula as experience bullets", "Emphasize deployment or production quality where possible", "Show at least 1 project per technology cluster you want to be hired for", "Keep each project to 2-3 lines maximum"],
    mistakes: ["Listing class homework projects without context", "Forgetting to add a GitHub or demo link", "Describing what the project does without saying why it matters", "Using vague project names like 'Personal Project 1'"],
    tip: "A deployed project beats a local one. Even a free Heroku, Railway, or Vercel deployment shows initiative and real shipping experience.",
    goodExample: "OpenMetrics — Python, Prometheus, Grafana\nOpen-source observability library with 1.4K GitHub stars used by 50+ companies in production.\ngithub.com/alexrivera/openmetrics",
    badExample: "Class Project (Python)\nBuilt a program for one of my courses that did some data analysis.\nWas part of a group project.",
    example: "Name · Stack · Impact · Live link"
  },
  {
    title: "ATS Optimization",
    short: "ATS",
    why: "Most Fortune 500 companies and tech companies use ATS to automatically rank resumes before a human reviews them. A resume that scores poorly gets filtered before any recruiter sees it.",
    include: ["Keywords from the exact job description", "Standard section headers (Experience, Education, Skills)", "Dates in consistent MM/YYYY or Month YYYY format", "Clean formatting without tables or columns that confuse parsers"],
    practices: ["Run your resume through HireMind's ATS checker before applying", "Match keyword phrasing exactly — 'CI/CD' not 'continuous deployment pipeline'", "Use standard section headings — creative headers like 'My Story' confuse parsers", "Submit as PDF unless the posting specifies Word format"],
    mistakes: ["Using tables, text boxes, or columns that ATS can't parse", "Using images, logos, or headers/footers with important info", "Submitting a resume with photos or colors in PDF form", "Ignoring ATS score before applying to large companies"],
    tip: "Print your resume to plain text (copy/paste to Notepad). If it's unreadable, ATS will struggle too. Clean, linear formatting always wins.",
    goodExample: "Section: Work Experience\nSoftware Engineer | Stripe | Jan 2022 – Dec 2023\n• Built payment API using Python, FastAPI, and PostgreSQL\n• Deployed on AWS with 99.99% uptime using Docker and Kubernetes",
    badExample: "[Two-column table with name in header, experience and skills side by side, footer with contact info, text inside image]\nSoftware Engineer who built cool stuff at Stripe.",
    example: "Keywords · Standard headers · No tables · Clean PDF"
  },
  {
    title: "Formatting & Layout",
    short: "Format",
    why: "Formatting affects both ATS parsing and recruiter readability. A cluttered or inconsistent layout signals disorganization — recruiters spend 7 seconds on average on a first scan.",
    include: ["Consistent font (Inter, Calibri, or Georgia at 10-12pt)", "Single-column layout for best ATS compatibility", "Adequate whitespace between sections", "Bold for section titles and company names", "Consistent date alignment (right-justify or left-justify, not both)"],
    practices: ["Use 0.5–0.75 inch margins to maximize content space", "Keep line length comfortable — not too wide", "Use bullet points, not paragraphs, in experience", "Ensure section headers are clearly larger or bolder than body text"],
    mistakes: ["Using less than 10pt font to cram more content", "Mixing multiple fonts or inconsistent font sizes", "Using colored text for anything other than section headings", "Leaving inconsistent spacing between different sections"],
    tip: "Limit resume to one page if under 10 years of experience, two pages if more. Never go to three pages. Quality beats quantity.",
    goodExample: "WORK EXPERIENCE (bold, 14pt)\nSoftware Engineer at Stripe (bold, 12pt)\nJan 2022 – Present\n• Bullet point in 11pt regular weight (consistent spacing below)",
    badExample: "Work experience:\nS.E. @ Stripe (Jan 22 – now)\n- worked on stuff\n\n\nEDUCATION (font suddenly 16pt, different font family)",
    example: "Single font · 10–12pt · 1–2 pages · Consistent spacing"
  },
  {
    title: "Tailoring to the Job",
    short: "Tailoring",
    why: "A generic resume sent to every job performs worse than a tailored one. Every hour spent tailoring is worth far more than spending that hour sending one more cold application.",
    include: ["Keywords and phrases from the exact job description", "Relevant projects or experience reordered for the role", "Summary updated to match the target role title", "Skills reordered to prioritize what the role needs most"],
    practices: ["Use the JD Match Analyzer to find your exact keyword gap before applying", "Adjust 3-4 experience bullets to mirror the language of the JD", "Update your summary title to match the exact role title", "Move the most relevant experience to the top if you have multiple roles"],
    mistakes: ["Sending the exact same resume to 50 different job titles", "Adding keywords to your skills section that you cannot explain in an interview", "Tailoring only the cover letter but not the resume", "Over-tailoring by removing legitimate experience that the role values"],
    tip: "You don't need to rewrite the whole resume. Changing your summary, reordering two bullets, and adding 3 keywords typically moves your JD match score from 55% to 75%+.",
    goodExample: "Target: Backend Engineer at Stripe\nSummary updated: 'Backend engineer with 3+ years building payment APIs and event-driven services in Python and Go. Experienced with high-availability systems and PostgreSQL at scale.'\nBullets rewritten to mention payments, reliability, and API performance.",
    badExample: "Target: Backend Engineer at Stripe\n[Same summary that says 'full-stack developer with 2 years of experience in various technologies']\n[Same generic bullets about 'worked on backend APIs' without context or metrics]",
    example: "Keywords · Summary · Ordered for role · JD match"
  },
  {
    title: "Review & Final Checks",
    short: "Review",
    why: "Typos, broken links, and formatting errors create an immediately negative impression. A single error can overshadow strong experience — proofreading is the highest-ROI step before applying.",
    include: ["Spell-check every word including company names", "Verify all links (LinkedIn, GitHub, portfolio)", "Check date consistency and math (employment gaps, durations)", "Confirm contact info is current", "Validate PDF renders correctly on Windows and Mac"],
    practices: ["Read the resume out loud — your ear catches errors your eye misses", "Ask one trusted person to review it", "Run the resume through HireMind's ATS checker one final time", "Open the PDF on a different device before submitting"],
    mistakes: ["Trusting only spell-check without reading carefully", "Forgetting to update dates when re-using an old resume", "Not verifying links are working and point to the right pages", "Submitting a .docx file when a .pdf was requested"],
    tip: "Print the resume to paper. Errors that you miss on screen jump out immediately on paper — a technique used by professional editors.",
    goodExample: "Final checklist complete:\n✓ No spelling errors\n✓ All dates consistent and verified\n✓ LinkedIn URL tested and correct\n✓ PDF renders correctly\n✓ ATS score checked (HireMind: 87/100)\n✓ Tailored for target role",
    badExample: "Submitting resume with:\n✗ 'Softwareenginer' in the title\n✗ Broken GitHub link\n✗ Dates: 'Jan 2022 – Feb 2021' (end before start)\n✗ Old email from previous company still listed",
    example: "Spell-check · Links · Dates · PDF · ATS score"
  }
];

// coverLetterSamples mirrors the CoverLetterTemplateEngine options with category metadata
// used by CoverLetterTemplates.jsx gallery page
export const coverLetterSamples = [
  { id: "modern-minimal",         name: "Modern Minimal",         category: "Modern",       accent: "#14B87A" },
  { id: "executive-clean",        name: "Executive Clean",        category: "Executive",    accent: "#0B1220" },
  { id: "creative-accent",        name: "Creative Accent",        category: "Creative",     accent: "#7C5CFF" },
  { id: "corporate-professional", name: "Corporate Professional", category: "Professional", accent: "#2563EB" },
  { id: "faang-minimal",          name: "FAANG Minimal",          category: "Technical",    accent: "#111827" },
  { id: "elegant-serif",          name: "Elegant Serif",          category: "Classic",      accent: "#8B5E34" },
  { id: "sidebar-premium",        name: "Sidebar Premium",        category: "Professional", accent: "#164E63" },
  { id: "ats-clean",              name: "ATS Clean",              category: "Minimal",      accent: "#059669" },
];
