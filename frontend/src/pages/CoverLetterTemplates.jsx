import { ArrowRight, CheckCircle2, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button";
import { CoverLetterDocumentPreview, TemplatePreviewModal } from "../components/CareerWorkflow";
import { coverLetterSamples } from "../data/careerSamples";
import { usePageTitle } from "../hooks/usePageTitle";

const filters = ["All", "Professional", "Classic", "Minimal", "Executive", "Technical", "Creative"];

export default function CoverLetterTemplates() {
  usePageTitle("Cover Letter Templates");
  const [activeFilter, setActiveFilter] = useState("All");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const visibleTemplates = useMemo(() => {
    if (activeFilter === "All") return coverLetterSamples;
    return coverLetterSamples.filter((template) => template.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="rounded-3xl border border-line bg-gradient-to-br from-white via-white to-lilac/70 p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-signal">Cover Letter Templates</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Designed cover letters for every application style</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">
          Choose a polished one-page letter design, preview the full document, and open it directly in the AI cover letter builder.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-bold text-ink">
          <Filter size={17} className="text-mint" aria-hidden="true" />
          Template filters
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`focus-ring rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                activeFilter === filter
                  ? "border-mint bg-mint/10 text-mint"
                  : "border-line bg-white text-graphite hover:border-signal/40 hover:text-ink"
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {visibleTemplates.map((template) => (
          <article key={template.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-card">
            <div className="rounded-xl bg-slate-50 p-3">
              <CoverLetterDocumentPreview template={template} mode="card" />
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-signal">{template.category}</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{template.name}</h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint">
                <CheckCircle2 size={14} aria-hidden="true" />
                Ready
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setPreviewTemplate(template)}>Preview</Button>
              <Button as={Link} to={`/app/cover-letter-expert?template=${template.id}`} variant="mint">
                Use Template <ArrowRight size={17} />
              </Button>
            </div>
          </article>
        ))}
      </section>

      {previewTemplate && <TemplatePreviewModal template={previewTemplate} type="cover" onClose={() => setPreviewTemplate(null)} />}
    </div>
  );
}
