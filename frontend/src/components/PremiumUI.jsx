import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { useState } from "react";

export function NiaAvatar({ size = "lg", label = "Nia", subtitle = "Your AI Resume Expert" }) {
  const dimensions = size === "sm" ? "h-20 w-20" : "h-40 w-40";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-gradient-to-br from-lilac via-white to-mint/20 p-3 shadow-card">
        <div className={`${dimensions} relative overflow-hidden rounded-full border border-line bg-gradient-to-br from-purple-100 to-emerald-50`}>
          <div className="absolute inset-x-0 top-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber/25 to-signal/20">
            <UserRound size={size === "sm" ? 34 : 54} className="text-signal" aria-hidden="true" />
          </div>
          <div className="absolute bottom-0 left-1/2 h-20 w-24 -translate-x-1/2 rounded-t-[3rem] bg-[#b9a7ff]" />
          <div className="absolute bottom-2 left-1/2 h-16 w-16 -translate-x-1/2 rounded-t-full bg-white/80" />
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-signal">{label}</p>
      <p className="text-sm text-graphite">{subtitle}</p>
    </div>
  );
}

export function AvatarIntro({ title, children, cta, subtitle = "your AI resume expert" }) {
  return (
    <section className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <NiaAvatar subtitle={subtitle} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
        <div className="mt-4 max-w-3xl text-base leading-7 text-graphite">{children}</div>
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </section>
  );
}

export function Stepper({ steps, activeStep }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
              index <= activeStep ? "bg-gradient-to-br from-mint to-signal text-white shadow-card" : "bg-slate-100 text-graphite"
            }`}
          >
            {index + 1}
          </span>
          <span className={`hidden text-sm font-semibold md:block ${index <= activeStep ? "text-ink" : "text-graphite"}`}>{step}</span>
          {index < steps.length - 1 && <span className="hidden h-px w-20 bg-line xl:block" />}
        </div>
      ))}
    </div>
  );
}

export function AccordionSection({ title, children, defaultOpen = false, complete = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-line bg-white/80 shadow-sm">
      <button
        type="button"
        className="focus-ring flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-3 text-sm font-semibold text-ink">
          {complete ? <CheckCircle2 size={18} className="text-mint" /> : <FileText size={18} className="text-signal" />}
          {title}
        </span>
        <ChevronDown size={18} className={`text-graphite transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </div>
  );
}

export function ScoreCard({ title, score, status, tone = "mint", icon: Icon = ShieldCheck }) {
  const toneClass = tone === "warning" ? "text-amber bg-amber/10" : tone === "danger" ? "text-coral bg-coral/10" : "text-mint bg-mint/10";
  return (
    <div className="rounded-xl border border-line bg-white/85 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold text-ink">{score}<span className="text-xs text-graphite">/100</span></span>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className={`mt-1 text-xs font-semibold ${tone === "warning" ? "text-amber" : tone === "danger" ? "text-coral" : "text-mint"}`}>{status}</p>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${tone === "warning" ? "bg-amber" : tone === "danger" ? "bg-coral" : "bg-mint"}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function CTASection({ title, description, action }) {
  return (
    <section className="rounded-2xl border border-mint/20 bg-gradient-to-r from-mint/12 via-white to-signal/10 p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint text-white shadow-card">
            <ShieldCheck size={24} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-mint">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-graphite">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}

export function ProTip({ children }) {
  return (
    <div className="flex gap-3 rounded-xl border border-signal/10 bg-lilac/80 p-4 text-sm text-graphite">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-signal">
        <Lightbulb size={18} aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-ink">Pro Tip</p>
        <p className="mt-1 leading-6">{children}</p>
      </div>
    </div>
  );
}

export function AiBadge({ children = "AI tools ready" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/80 px-3 py-2 text-sm font-semibold text-ink shadow-sm">
      <span className="h-2 w-2 rounded-full bg-mint" />
      {children}
    </span>
  );
}

export function SectionCard({ children, className = "" }) {
  return <section className={`rounded-2xl border border-line bg-white/90 p-5 shadow-sm ${className}`}>{children}</section>;
}

export function SparkleLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-signal">
      <Sparkles size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
