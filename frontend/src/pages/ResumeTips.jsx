import { ArrowRight, Check, ChevronDown, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import { AiAvatarIntro } from "../components/CareerWorkflow";
import { writingGuideSteps } from "../data/careerSamples";
import { usePageTitle } from "../hooks/usePageTitle";

export default function ResumeTips() {
  usePageTitle("Resume Writing Tips");
  const [openStep, setOpenStep] = useState(0);
  const activeStep = writingGuideSteps[openStep];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <AiAvatarIntro
        title={<>Hi! I&apos;m <span className="text-signal">Nia</span>, your AI resume expert</>}
        subtitle="A great resume opens doors. Follow this 10-step guide to write a resume that stands out to recruiters and passes ATS with ease."
        panel={
          <div className="rounded-2xl border border-line bg-lilac/60 p-5">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lilac text-signal">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="font-bold text-ink">10-Step Guide to Write a Winning Resume</p>
                <p className="mt-1 text-sm text-graphite">Research-backed tips, best practices, real examples, and ATS-friendly formatting guidance.</p>
              </div>
            </div>
          </div>
        }
      />

      <nav className="overflow-x-auto pb-2" aria-label="Resume writing steps">
        <div className="flex min-w-max items-center justify-between gap-4">
          {writingGuideSteps.map((step, index) => (
            <button key={step.title} type="button" onClick={() => setOpenStep(index)} className="focus-ring flex flex-col items-center gap-2 rounded-xl px-2 py-1">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${openStep === index ? "bg-gradient-to-br from-mint to-signal text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                {index + 1}
              </span>
              <span className={`text-xs font-bold ${openStep === index ? "text-signal" : "text-graphite"}`}>{step.short}</span>
            </button>
          ))}
        </div>
      </nav>

      <section className="grid gap-6 rounded-3xl border border-line bg-white p-7 shadow-sm lg:grid-cols-[minmax(0,1fr)_340px]">
        <article>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-mint to-signal text-lg font-bold text-white">{openStep + 1}</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-signal">Step {openStep + 1}</p>
              <h2 className="text-3xl font-bold tracking-tight text-ink">{activeStep.title}</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-graphite">{activeStep.why}</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <GuidePanel title="What to include" items={activeStep.include} />
            <GuidePanel title="Best practices" items={activeStep.practices} check />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-coral/25 bg-coral/5 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-coral"><X size={17} />Common mistakes</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-graphite">
                {activeStep.mistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber/25 bg-amber/10 p-5">
              <p className="text-sm font-bold text-ink">Why it matters</p>
              <p className="mt-3 text-sm leading-6 text-graphite">{activeStep.why}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-signal/15 bg-lilac p-5">
            <p className="text-sm font-bold text-signal">Pro tip</p>
            <p className="mt-2 text-sm leading-6 text-graphite">{activeStep.tip}</p>
          </div>
        </article>

        <aside className="space-y-5">
          <ExampleCard title="Good Example" content={activeStep.goodExample} good />
          <ExampleCard title="Bad Example" content={activeStep.badExample} />
        </aside>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="divide-y divide-line">
          {writingGuideSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setOpenStep(openStep === index ? 0 : index)}
              className="focus-ring flex w-full items-center justify-between gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${openStep === index ? "bg-signal text-white" : "bg-slate-100 text-graphite"}`}>
                  {index + 1}
                </span>
                <span>
                  <span className="block font-bold text-ink">{step.title}</span>
                  <span className="mt-1 block text-sm text-graphite">{step.example}</span>
                </span>
              </span>
              <ChevronDown className={`shrink-0 text-slate-500 transition ${openStep === index ? "rotate-180" : ""}`} size={18} />
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-mint/20 bg-gradient-to-r from-mint/12 to-lilac p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint text-white"><ShieldCheck size={22} /></span>
          <div>
            <h2 className="text-xl font-bold text-mint">Follow all 10 steps and boost your chances.</h2>
            <p className="mt-1 text-sm leading-6 text-graphite">A well-written resume gets more interviews. Take your time, follow the steps, and then build your resume with Nia.</p>
          </div>
        </div>
        <Button as={Link} to="/app/resume-expert" variant="mint">Start Building Resume <ArrowRight size={17} /></Button>
      </section>
    </div>
  );
}

function GuidePanel({ title, items, check = false }) {
  return (
    <div>
      <p className="font-bold text-ink">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-graphite">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            {check ? <Check size={16} className="mt-1 shrink-0 text-mint" /> : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExampleCard({ title, content, good = false }) {
  const lines = String(content || "").split("\n").filter(Boolean);
  return (
    <div className={`rounded-2xl border p-4 ${good ? "border-mint/30 bg-mint/5" : "border-coral/30 bg-coral/5"}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${good ? "text-mint" : "text-coral"}`}>
        {good ? <Check size={18} /> : <X size={18} />}
        {title}
      </p>
      <div className="mt-4 rounded-xl border border-line bg-white p-4">
        <div className="space-y-2 whitespace-pre-line text-sm leading-6 text-ink">
          {lines.map((line, index) => (
            <p key={`${line}-${index}`} className={index === 0 && good ? "font-bold text-ink" : ""}>{line}</p>
          ))}
        </div>
      </div>
      {!good && <p className="mt-3 text-sm leading-6 text-graphite">Missing key details, looks unprofessional, and is hard to contact.</p>}
    </div>
  );
}
