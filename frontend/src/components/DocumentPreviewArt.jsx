export function ResumeTemplateArt({ accent = "from-mint to-signal", compact = false, sidebar = true }) {
  return (
    <div className={`resume-paper mx-auto ${compact ? "min-h-72 p-4" : "min-h-[520px] p-7"}`}>
      <div className={`mb-4 h-2 rounded-full bg-gradient-to-r ${accent}`} />
      <div className={sidebar ? "grid grid-cols-[0.36fr_0.64fr] gap-4" : "grid gap-4"}>
        {sidebar && (
          <aside className="rounded-md bg-ink p-4 text-white">
            <div className="h-3 w-24 rounded-full bg-white/80" />
            <div className="mt-2 h-2 w-16 rounded-full bg-white/40" />
            <PreviewGroup inverse title="Contact" rows={3} />
            <PreviewGroup inverse title="Skills" rows={5} />
            <PreviewGroup inverse title="Tools" rows={4} />
          </aside>
        )}
        <main>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`${compact ? "h-3 w-28" : "h-5 w-52"} rounded-full bg-ink`} />
              <div className="mt-3 h-2 w-44 rounded-full bg-line" />
            </div>
            <div className="h-12 w-12 rounded-full bg-lilac" />
          </div>
          <PreviewGroup title="Summary" rows={compact ? 3 : 4} />
          <PreviewGroup title="Experience" rows={compact ? 6 : 8} />
          <PreviewGroup title="Projects" rows={compact ? 3 : 5} />
          {!compact && <PreviewGroup title="Education" rows={3} />}
        </main>
      </div>
    </div>
  );
}

export function CoverLetterArt({ accent = "from-peach to-lilac", compact = false }) {
  return (
    <div className={`resume-paper mx-auto ${compact ? "min-h-72 p-4" : "min-h-[500px] p-7"}`}>
      <div className={`mb-5 h-2 rounded-full bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between border-b border-line pb-4">
        <div>
          <div className={`${compact ? "h-3 w-32" : "h-5 w-48"} rounded-full bg-ink`} />
          <div className="mt-3 h-2 w-56 rounded-full bg-line" />
        </div>
        <div className="h-12 w-12 rounded-full bg-peach" />
      </div>
      <div className="mt-5 space-y-4">
        <LetterBlock tone="bg-lilac/70" rows={compact ? 3 : 4} />
        <LetterBlock tone="bg-mint/10" rows={compact ? 4 : 6} />
        <LetterBlock tone="bg-peach" rows={compact ? 3 : 4} />
      </div>
    </div>
  );
}

function PreviewGroup({ title, rows, inverse = false }) {
  return (
    <section className="border-b border-line/70 py-4 last:border-b-0">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${inverse ? "text-white/65" : "text-signal"}`}>{title}</p>
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full ${inverse ? "bg-white/35" : "bg-line"} ${
              index % 4 === 0 ? "w-8/12" : index % 3 === 0 ? "w-10/12" : "w-full"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function LetterBlock({ rows, tone }) {
  return (
    <div className={`rounded-lg p-4 ${tone}`}>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={`h-2 rounded-full bg-line ${index % 3 === 0 ? "w-9/12" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}
