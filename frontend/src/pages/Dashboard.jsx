import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gauge,
  MessageSquareText,
  SearchCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import { CTASection, SectionCard, SparkleLabel } from "../components/PremiumUI";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

const stats = [
  { label: "Total resumes uploaded", value: "3", detail: "2 parsed this week", icon: FileText, tone: "text-signal bg-lilac" },
  { label: "Current ATS score", value: "65", detail: "Good, can improve", icon: Gauge, tone: "text-amber bg-amber/10" },
  { label: "Predicted improved ATS", value: "92", detail: "After recommendations", icon: TrendingUp, tone: "text-mint bg-mint/10" },
  { label: "Applications tracked", value: "12", detail: "4 interviews active", icon: BriefcaseBusiness, tone: "text-sky-600 bg-sky-50" },
  { label: "Interview sessions", value: "5", detail: "Backend and cloud prep", icon: MessageSquareText, tone: "text-signal bg-lilac" },
  { label: "Job match average", value: "78%", detail: "Across saved roles", icon: SearchCheck, tone: "text-mint bg-mint/10" }
];

const quickActions = [
  { label: "Build Resume", to: "/app/resume-expert", icon: FileText },
  { label: "Check ATS Score", to: "/app/ats-score", icon: Gauge },
  { label: "Generate Cover Letter", to: "/app/cover-letter-expert", icon: FileCheck2 },
  { label: "Match Job", to: "/app/job-match", icon: SearchCheck },
  { label: "Practice Interview", to: "/app/interview-prep", icon: MessageSquareText }
];

const activity = [
  "Resume parsed and saved from upload workflow",
  "ATS analysis found 7 missing backend keywords",
  "Cover letter draft generated for Backend Engineer role",
  "Application moved to Interview stage"
];

export default function Dashboard() {
  usePageTitle("Career OS Dashboard");
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-white via-white to-lilac/70 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <SparkleLabel>Career Intelligence Platform</SparkleLabel>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-graphite">
              HireMind is your Career OS for resumes, ATS scoring, cover letters, job matching, applications, and interview prep.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white/80 p-5 shadow-card">
            <p className="text-sm font-semibold text-graphite">Career readiness</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-6xl font-semibold text-ink">82</span>
              <span className="pb-2 text-sm font-semibold text-mint">Strong</span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-mint to-signal" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <SectionCard key={label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-graphite">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
                <p className="mt-1 text-xs font-semibold text-graphite">{detail}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
            </div>
          </SectionCard>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.66fr_0.34fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">Resume progress</h2>
              <p className="mt-1 text-sm text-graphite">Your strongest path to better matches and interviews.</p>
            </div>
            <Button as={Link} to="/app/resume-expert" variant="mint">
              Continue
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {["Profile", "Experience", "Keywords", "Export"].map((item, index) => (
              <div key={item} className="rounded-xl border border-line bg-slate-50 p-4">
                <CheckCircle2 size={20} className={index < 3 ? "text-mint" : "text-graphite"} aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-ink">{item}</p>
                <p className="mt-1 text-xs text-graphite">{index < 3 ? "Complete" : "Ready next"}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-xl font-semibold text-ink">Recent activity</h2>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-mint" />
                <p className="text-sm leading-6 text-graphite">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
        <SectionCard>
          <h2 className="text-xl font-semibold text-ink">AI recommendations</h2>
          <div className="mt-5 space-y-3">
            {[
              "Add Docker, CI/CD, and REST API keywords to your resume summary.",
              "Rewrite project bullets with measurable outcomes and tools.",
              "Generate a tailored cover letter before applying to backend roles."
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-lilac/60 p-3 text-sm leading-6 text-graphite">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-xl font-semibold text-ink">Quick actions</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="focus-ring flex items-center justify-between rounded-xl border border-line bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lilac text-signal">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  {label}
                </span>
                <ArrowRight size={17} className="text-graphite" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </section>

      <CTASection
        title="Your next interview is closer than you think."
        description="Build a stronger resume, match it to real roles, and prepare with AI-generated interview practice."
        action={<Button as={Link} to="/app/resume-expert" variant="mint">Start Building Resume <ArrowRight size={17} /></Button>}
      />
    </div>
  );
}
