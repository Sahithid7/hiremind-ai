import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { RESUME_TEMPLATES, SAMPLE_PERSON, renderResumeHTML } from "../components/ResumeTemplateRenderer";
import { usePageTitle } from "../hooks/usePageTitle";
import { buildResumeTemplateHtml } from "../utils/resumeTemplateExport";
import { GALLERY_SAMPLE } from "../data/gallerySample";

const BROWN  = "#2C1810";
const GOLD   = "#D4A853";
const CREAM  = "#FAF7F2";
const BORDER = "#E8DDD4";

// Category → color pill mapping
const CAT_STYLE = {
  Tech:         { bg: "#EFF6FF", text: "#2563EB" },
  Professional: { bg: "#F0F4FF", text: "#1E3A5F" },
  Modern:       { bg: "#ECFDF5", text: "#059669" },
  Minimal:      { bg: "#F1F5F9", text: "#475569" },
  Bold:         { bg: "#FFF1F2", text: "#BE123C" },
  Creative:     { bg: "#F5F3FF", text: "#7C3AED" },
  Executive:    { bg: "#FFFBEB", text: "#92400E" },
  Premium:      { bg: "#FBF5E6", text: "#D4A853" },
  Classic:      { bg: "#FAFAF9", text: "#44403C" },
  ATS:          { bg: "#F0FDF4", text: "#16A34A" },
};

const ALL_CATEGORIES = ["All", "Tech", "Professional", "Modern", "Minimal", "Bold", "Creative", "Executive", "Classic"];

function getCategoryCount(cat) {
  if (cat === "All") return RESUME_TEMPLATES.length;
  return RESUME_TEMPLATES.filter((t) => t.category === cat).length;
}

// Renders the preview using the same iframe + scale trick
function TemplatePreview({ tpl, height = 300 }) {
  const html = (() => {
    try {
      return buildResumeTemplateHtml({ ...GALLERY_SAMPLE, id: tpl.id, accent: tpl.accent }, {});
    } catch {
      try { return renderResumeHTML(SAMPLE_PERSON, tpl.id); } catch { return ""; }
    }
  })();

  if (!html) {
    return (
      <div style={{ height, background: (tpl.accent || "#666") + "14",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: tpl.accent || "#888", opacity: 0.5 }}>{tpl.name}</span>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", overflow: "hidden", width: "100%", height }}>
      <iframe
        srcDoc={html}
        title={tpl.name}
        style={{
          width: "820px", height: "1060px", border: "none",
          transform: "scale(0.366)", transformOrigin: "top left",
          position: "absolute", top: 0, left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function ResumeTemplates() {
  usePageTitle("Resume Templates");
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [previewId,    setPreviewId]    = useState(null);

  const visible = activeFilter === "All"
    ? RESUME_TEMPLATES
    : RESUME_TEMPLATES.filter((t) => t.category === activeFilter);

  const previewTpl = RESUME_TEMPLATES.find((t) => t.id === previewId);

  function useTemplate(id) {
    sessionStorage.setItem("selectedTemplateId", id);
    navigate("/app/resume-expert");
  }

  return (
    <div style={{ background: CREAM, color: BROWN, minHeight: "100vh" }}>

      {/* ── Page header ── */}
      <section style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }} className="px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {RESUME_TEMPLATES.length} Premium Templates
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: BROWN }}>
            Resume Templates That Get You Hired
          </h1>
          <p className="mx-auto max-w-2xl text-lg" style={{ color: "#6B4C3B" }}>
            Every template is ATS-tested, recruiter-approved, and renders exactly as your PDF export.
            Switch templates anytime before downloading.
          </p>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-20 px-6 py-4 shadow-sm"
        style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
                style={isActive
                  ? { background: BROWN, color: "#fff", border: `1px solid ${BROWN}` }
                  : { background: "transparent", color: "#6B4C3B", border: `1px solid ${BORDER}` }
                }
              >
                {cat}
                {cat !== "All" && count > 0 && (
                  <span className="ml-1.5 text-xs" style={{ opacity: 0.65 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Template grid ── */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {visible.length === 0 ? (
          <p className="py-20 text-center" style={{ color: "#9A8070" }}>No templates in this category.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                onPreview={() => setPreviewId(tpl.id)}
                onUse={() => useTemplate(tpl.id)}
              />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm" style={{ color: "#9A8070" }}>
          Showing <strong>{visible.length}</strong> of <strong>{RESUME_TEMPLATES.length}</strong> templates
        </p>
      </div>

      {/* ── CTA ── */}
      <section style={{ background: "#fff", borderTop: `1px solid ${BORDER}` }} className="px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="text-xl font-bold" style={{ color: BROWN }}>Not sure which to pick?</h2>
            <p className="mt-1 text-sm" style={{ color: "#6B4C3B" }}>
              Upload your resume and the wizard will guide you through each section. Switch templates anytime before exporting.
            </p>
          </div>
          <button
            onClick={() => navigate("/app/resume-expert")}
            className="shrink-0 rounded-xl px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4A2318]"
            style={{ background: BROWN }}
          >
            Build My Resume →
          </button>
        </div>
      </section>

      {/* ── Preview modal ── */}
      {previewId && previewTpl && (
        <PreviewModal
          tpl={previewTpl}
          onClose={() => setPreviewId(null)}
          onUse={() => { setPreviewId(null); useTemplate(previewId); }}
        />
      )}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ tpl, onPreview, onUse }) {
  const [hovered, setHovered] = useState(false);
  const catStyle = CAT_STYLE[tpl.category] ?? { bg: "#F1F5F9", text: "#475569" };

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        boxShadow: hovered
          ? "0 8px 32px rgba(44,24,16,0.14)"
          : "0 2px 12px rgba(44,24,16,0.06)",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview */}
      <div className="relative overflow-hidden" onClick={onPreview} style={{ cursor: "pointer" }}>
        <TemplatePreview tpl={tpl} height={280} />

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{ background: hovered ? "rgba(44,24,16,0.45)" : "transparent", opacity: hovered ? 1 : 0 }}>
          {hovered && (
            <button type="button" onClick={onPreview}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold shadow-lg transition hover:bg-[#FAF7F2]"
              style={{ color: BROWN }}>
              Full Preview →
            </button>
          )}
        </div>

        {/* ATS badge */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white"
          style={{ background: "#2D6A4F" }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
          ATS {tpl.atsScore}
        </div>

        {/* Layout badge */}
        <div className="absolute left-2.5 top-2.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize backdrop-blur"
          style={{ borderColor: BORDER, background: "rgba(255,255,255,0.9)", color: "#6B4C3B" }}>
          {tpl.layout}
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="font-bold" style={{ color: BROWN }}>{tpl.name}</p>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: catStyle.bg, color: catStyle.text }}>
              {tpl.category}
            </span>
          </div>
          <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2"
            style={{ background: tpl.accent, borderColor: tpl.accent }} />
        </div>

        {tpl.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-5" style={{ color: "#9A8070" }}>
            {tpl.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onPreview}
            className="rounded-xl border py-2 text-xs font-semibold transition hover:bg-[#FAF7F2]"
            style={{ borderColor: BORDER, color: BROWN }}>
            Preview
          </button>
          <button type="button" onClick={onUse}
            className="rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: BROWN }}>
            Use Template
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Full preview modal ────────────────────────────────────────────────────────
function PreviewModal({ tpl, onClose, onUse }) {
  const html = (() => {
    try {
      return buildResumeTemplateHtml({ ...GALLERY_SAMPLE, id: tpl.id, accent: tpl.accent }, {});
    } catch {
      try { return renderResumeHTML(SAMPLE_PERSON, tpl.id); } catch { return ""; }
    }
  })();

  const catStyle = CAT_STYLE[tpl.category] ?? { bg: "#F1F5F9", text: "#475569" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold" style={{ color: BROWN }}>{tpl.name}</h2>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: catStyle.bg, color: catStyle.text }}>{tpl.category}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#9A8070" }}>
              ATS {tpl.atsScore}/100 · {tpl.layout} column · What you see = your exported PDF
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onUse}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
              style={{ background: BROWN }}>
              Use This Template →
            </button>
            <button type="button" onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-[#FAF7F2]"
              style={{ border: `1px solid ${BORDER}`, color: "#6B4C3B" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-5" style={{ background: "#F5F0EA" }}>
          <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-2xl" style={{ maxWidth: 816 }}>
            {html ? (
              <iframe srcDoc={html} className="w-full" style={{ height: 1060, border: "none", display: "block" }}
                title="Full Resume Preview" />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm" style={{ color: "#9A8070" }}>
                Preview not available
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between px-6 py-3"
          style={{ borderTop: `1px solid ${BORDER}`, background: "#FAF7F2" }}>
          <p className="text-xs" style={{ color: "#9A8070" }}>
            Preview uses sample data (Alex Rivera). Your resume replaces it when you build.
          </p>
          <button type="button" onClick={onUse}
            className="rounded-xl px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: BROWN }}>
            Start Building →
          </button>
        </div>
      </div>
    </div>
  );
}
