import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gauge,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { SAMPLE_PERSON, renderResumeHTML } from "../components/ResumeTemplateRenderer";
import ThemeToggle from "../components/ThemeToggle";
import { resumeTemplateSamples } from "../data/careerSamples";
import { usePageTitle } from "../hooks/usePageTitle";

// A4 resume width at 96 dpi — must match the width used in template CSS
const RESUME_PX_WIDTH = 794;

// Renders a template preview scaled to fill 100% of the card width.
// Uses a ref to measure the actual card pixel width and computes scale = cardWidth / 794.
function TemplatePrev({ tpl, height = 280 }) {
  const html = (() => {
    try { return renderResumeHTML(SAMPLE_PERSON, tpl.id); } catch { return ""; }
  })();
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current?.offsetWidth;
      if (w) setScale(w / RESUME_PX_WIDTH);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!html) {
    return (
      <div ref={containerRef} style={{ height, background: tpl.accent ? tpl.accent + "18" : "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ opacity: 0.3, fontWeight: 700, fontSize: 13, color: tpl.accent || "#666" }}>
          {tpl.name}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden", width: "100%", height }}>
      <iframe
        srcDoc={html}
        title={tpl.name}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${RESUME_PX_WIDTH}px`,
          height: "1123px",
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

const BROWN       = "#2C1810";
const GOLD        = "#D4A853";
const CREAM       = "#FAF7F2";
const BORDER      = "#E8DDD4";
const TEXT_MED    = "#6B4C3B";

const navLinks = [
  ["Build Resume",  "/app/resume-expert"],
  ["ATS Checker",  "/app/ats-score"],
  ["Templates",    "/app/resume-templates"],
  ["Cover Letter", "/app/cover-letter-expert"],
  ["JD Match",     "/app/job-analytics"],
];

const features = [
  { icon: FileText,    label: "AI Resume Builder" },
  { icon: ShieldCheck, label: "ATS Checker" },
  { icon: SearchCheck, label: "JD Matcher" },
  { icon: FileCheck2,  label: "Cover Letters" },
  { icon: Gauge,       label: "Career Insights" },
];

const steps = [
  { n: "1", title: "Upload your resume", body: "Upload an existing PDF/DOCX and AI extracts all your content automatically — or start fresh in the guided wizard." },
  { n: "2", title: "Optimize and check ATS", body: "Run the ATS checker for a full report. Paste a job description into the JD Matcher to see keyword gaps and fit score." },
  { n: "3", title: "Download and apply", body: "Export a polished, recruiter-ready PDF or DOCX with your chosen template. Your data, your resume, your career." },
];

const whyItems = [
  ["ATS-Optimized Templates",    "All templates tested for ATS keyword extraction and proper section labeling."],
  ["Real Data Only",              "AI never invents experience — every suggestion is grounded in what you upload."],
  ["Instant PDF Export",          "Download a print-ready PDF in one click, exactly matching what you see."],
  ["JD Match Before You Apply",   "Know your match score and keyword gaps before submitting every application."],
  ["Cover Letter Generator",      "Generate a tailored cover letter from your actual resume content."],
  ["Free to Start",               "All core features available without an account. No credit card needed."],
];

export default function Home() {
  usePageTitle();

  return (
    <div style={{ background: CREAM, color: BROWN, fontFamily: "Inter, sans-serif" }} className="min-h-screen">

      {/* ── Navbar ── */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }} className="sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-6 py-4">
          {/* Logo — text only, no icon, no subtitle */}
          <Link to="/" className="text-[22px] font-bold tracking-tight" style={{ color: BROWN }}>
            HireMind AI
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
            {navLinks.map(([label, href]) => (
              <Link
                key={label}
                to={href}
                style={{ color: BROWN }}
                className="text-[16.5px] font-semibold transition-colors hover:opacity-70"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              to="/login"
              style={{ color: TEXT_MED }}
              className="hidden text-sm font-semibold transition-colors hover:text-[#2C1810] sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/app/resume-expert"
              style={{ background: BROWN, color: "#fff" }}
              className="rounded-xl px-5 py-2.5 text-sm font-bold transition-colors hover:bg-[#4A2318]"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section style={{ background: CREAM }} className="overflow-hidden border-b" style={{ background: CREAM, borderBottom: `1px solid ${BORDER}` }}>
          <div className="mx-auto grid max-w-[92rem] gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">

            {/* Left: copy */}
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: BORDER, color: TEXT_MED }}>
                <Sparkles size={15} style={{ color: GOLD }} />
                AI-Powered Career Platform
              </p>

              <h1
                className="font-display mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BROWN }}
              >
                Build a Resume That{" "}
                <span style={{ color: GOLD }}>Gets You Hired.</span>
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-8" style={{ color: TEXT_MED }}>
                AI resume builder, ATS checker, JD matcher, cover letter generator, and more. All in one place.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/app/resume-expert"
                  style={{ background: BROWN, color: "#fff" }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold shadow-md transition-colors hover:bg-[#4A2318]"
                >
                  Build My Resume <ArrowRight size={18} />
                </Link>
                <Link
                  to="/app/ats-score"
                  style={{ border: `2px solid ${BORDER}`, color: BROWN }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold transition-colors hover:border-[#2C1810]"
                >
                  Check ATS Score
                </Link>
              </div>

              {/* Trust strip */}
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill={GOLD} color={GOLD} />
                  ))}
                  <span className="ml-1.5 text-sm font-bold" style={{ color: BROWN }}>4.9</span>
                  <span className="text-sm" style={{ color: TEXT_MED }}> · from early users</span>
                </div>
                <div style={{ width: 1, height: 16, background: BORDER }} />
                <p className="text-sm font-semibold" style={{ color: TEXT_MED }}>
                  <span className="font-extrabold" style={{ color: BROWN }}>Free</span> to start — no credit card
                </p>
              </div>
            </div>

            {/* Right: 2×2 template cards */}
            <div className="grid grid-cols-2 gap-4">
              {resumeTemplateSamples.slice(0, 4).map((tpl) => (
                <Link
                  key={tpl.id}
                  to={`/app/resume-expert?template=${tpl.id}`}
                  className="group relative overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(44,24,16,0.08)" }}
                >
                  <TemplatePrev tpl={tpl} height={280} />
                  <div
                    className="absolute inset-0 flex items-end opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "rgba(44,24,16,0.55)" }}
                  >
                    <div className="p-3">
                      <p className="text-sm font-bold text-white">{tpl.name}</p>
                    </div>
                  </div>
                  <div className="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: "#2D6A4F" }}>
                    ATS {tpl.atsScore}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature icon row ── */}
        <section style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
          <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-around gap-6 px-6 py-8">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#FBF5E6" }}>
                  <Icon size={22} style={{ color: GOLD }} />
                </div>
                <span className="text-xs font-bold" style={{ color: BROWN }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-[92rem] px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Simple workflow</p>
            <h2
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BROWN }}
            >
              From resume to application in 3 steps
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: TEXT_MED }}>
              No lengthy onboarding. No filler questions. Just the tools you need to land interviews.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.n} className="relative flex flex-col gap-5 rounded-2xl p-8"
                style={{ background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 2px 16px rgba(44,24,16,0.06)" }}>
                {i < 2 && (
                  <div className="absolute left-full top-10 z-10 hidden w-8 -translate-x-4 md:block"
                    style={{ borderTop: `2px dashed ${BORDER}` }} />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: BROWN }}>
                  {step.n}
                </div>
                <h3 className="text-xl font-bold" style={{ color: BROWN }}>{step.title}</h3>
                <p className="text-sm leading-7" style={{ color: TEXT_MED }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Template showcase ── */}
        <section style={{ background: "#fff", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
          className="py-20">
          <div className="mx-auto max-w-[92rem] px-6">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Premium templates</p>
                <h2 className="text-4xl font-bold md:text-5xl"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BROWN }}>
                  Designed to pass ATS and impress recruiters
                </h2>
                <p className="mt-3 max-w-2xl text-lg" style={{ color: TEXT_MED }}>
                  Every template is hand-crafted for readability and ATS compatibility. Your content, presented professionally.
                </p>
              </div>
              <Link to="/app/resume-templates"
                style={{ border: `2px solid ${BORDER}`, color: BROWN }}
                className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors hover:border-[#2C1810]">
                All templates <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {resumeTemplateSamples.slice(0, 4).map((tpl) => (
                <Link key={tpl.id} to={`/app/resume-expert?template=${tpl.id}`}
                  className="group relative overflow-hidden rounded-2xl transition hover:-translate-y-1"
                  style={{ background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)" }}>
                  <div className="relative overflow-hidden">
                    <TemplatePrev tpl={tpl} height={300} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                      style={{ background: "rgba(44,24,16,0.5)" }}>
                      <span className="rounded-xl bg-white px-5 py-2 text-sm font-bold" style={{ color: BROWN }}>
                        Use Template →
                      </span>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                      style={{ background: "#2D6A4F" }}>
                      ATS {tpl.atsScore}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div>
                      <p className="font-bold" style={{ color: BROWN }}>{tpl.name}</p>
                      <p className="text-sm" style={{ color: TEXT_MED }}>{tpl.role}</p>
                    </div>
                    <div className="h-4 w-4 rounded-full border-2" style={{ background: tpl.accent, borderColor: tpl.accent }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why HireMind ── */}
        <section style={{ background: BROWN }} className="py-20">
          <div className="mx-auto max-w-[92rem] px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Why HireMind</p>
                <h2 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Built for the way hiring actually works
                </h2>
                <p className="mb-8 max-w-lg text-lg leading-8" style={{ color: "#C8A88A" }}>
                  ATS systems filter 75% of resumes before a human reads them. HireMind gives you the tools to get past the filter.
                </p>
                <Link to="/app/resume-expert"
                  style={{ background: GOLD, color: BROWN }}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold transition-colors hover:opacity-90">
                  Start Building <ArrowRight size={18} />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {whyItems.map(([title, body]) => (
                  <div key={title} className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <CheckCircle2 size={18} style={{ color: GOLD }} />
                    <p className="mt-3 font-bold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6" style={{ color: "#C8A88A" }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-[92rem] px-6 py-20">
          <div className="rounded-3xl p-12 text-center md:p-20"
            style={{ background: "#FBF5E6", border: `1px solid ${BORDER}` }}>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Get started free</p>
            <h2 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BROWN }}>
              Your next resume is one click away
            </h2>
            <p className="mx-auto mb-9 max-w-xl text-lg leading-8" style={{ color: TEXT_MED }}>
              Build a polished, ATS-ready resume in minutes. No account required to start.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/app/resume-expert"
                style={{ background: BROWN, color: "#fff" }}
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold shadow-md transition-colors hover:bg-[#4A2318]">
                Build Resume Free <ArrowRight size={18} />
              </Link>
              <Link to="/app/ats-score"
                style={{ border: `2px solid ${BORDER}`, color: BROWN }}
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold transition-colors hover:border-[#2C1810]">
                Check ATS Score
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              {["No credit card", "No signup required", "PDF export", "16 premium templates"].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_MED }}>
                  <CheckCircle2 size={15} style={{ color: GOLD }} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: BROWN }} className="px-6 py-12">
        <div className="mx-auto grid max-w-[92rem] gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              HireMind AI
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6" style={{ color: "#C8A88A" }}>
              AI-powered resume platform for job seekers who want to apply smarter and land more interviews.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm font-semibold" style={{ color: "#C8A88A" }}>
            {navLinks.map(([label, href]) => (
              <Link key={label} to={href} className="transition-colors hover:text-white">{label}</Link>
            ))}
            <Link to="/login" className="transition-colors hover:text-white">Login</Link>
            <Link to="/signup" className="transition-colors hover:text-white">Sign Up</Link>
          </nav>
        </div>
        <div className="mx-auto mt-8 max-w-[92rem] border-t pt-6 text-xs" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#9A7A60" }}>
          © {new Date().getFullYear()} HireMind AI. Built to help you get hired.
        </div>
      </footer>
    </div>
  );
}
