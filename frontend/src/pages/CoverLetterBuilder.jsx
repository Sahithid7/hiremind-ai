import { Download, Loader2, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { coverLetterTemplates } from "../data/templates";
import { usePageTitle } from "../hooks/usePageTitle";
import { generateCoverLetter } from "../utils/careerIntelligence";
import { exportElementAsPdf } from "../utils/exportDocument";

const defaultCoverForm = {
  name: "",
  company: "",
  role: "",
  jobDescription: ""
};

function readCoverOnboarding() {
  const saved = localStorage.getItem("hiremind_cover_onboarding");
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("hiremind_cover_onboarding");
    return null;
  }
}

export default function CoverLetterBuilder() {
  usePageTitle("Cover Letter Builder");
  const [searchParams] = useSearchParams();
  const letterRef = useRef(null);
  const [initialState] = useState(() => {
    const saved = readCoverOnboarding();
    const templateId = searchParams.get("template") || saved?.template || "professional";
    const form = {
      ...defaultCoverForm,
      name: saved?.name || defaultCoverForm.name,
      company: saved?.company || defaultCoverForm.company,
      role: saved?.role || defaultCoverForm.role,
      jobDescription: saved?.jobDescription || defaultCoverForm.jobDescription
    };
    const template = coverLetterTemplates.find((item) => item.id === templateId) ?? coverLetterTemplates[0];
    const letter = saved?.generatedLetter || generateCoverLetter({ ...form, tone: template.name });

    return { templateId, form, letter };
  });
  const [templateId, setTemplateId] = useState(initialState.templateId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState(initialState.form);
  const selectedTemplate = coverLetterTemplates.find((template) => template.id === templateId) ?? coverLetterTemplates[0];
  const [letter, setLetter] = useState(initialState.letter);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      setLetter(generateCoverLetter({ ...form, tone: selectedTemplate.name }));
      setIsGenerating(false);
    }, 450);
  }

  function exportPdf() {
    exportElementAsPdf("HireMind Cover Letter", letterRef.current?.innerHTML ?? "");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Cover letter"
        title={searchParams.get("source") === "expert" ? "Your AI expert cover letter draft" : "AI cover letter builder"}
        description="Enter company, role, and job description details. Generate a letter, edit it, and export as PDF."
        action={
          <Button variant="signal" onClick={exportPdf}>
            <Download size={18} aria-hidden="true" />
            Export PDF
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5">
          <div className="panel p-5">
            <label className="text-sm font-semibold text-ink">Template</label>
            <select className="focus-ring mt-2 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm text-ink" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {coverLetterTemplates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <p className="mt-2 text-sm leading-6 text-graphite">{selectedTemplate.tone}</p>
            <Button as={Link} to="/app/cover-letter-templates" variant="outline" className="mt-3">
              Browse templates
            </Button>
          </div>
          <div className="panel grid gap-4 p-5">
            <Field label="Your name" name="name" value={form.name} onChange={updateField} />
            <Field label="Company" name="company" value={form.company} onChange={updateField} />
            <Field label="Role" name="role" value={form.role} onChange={updateField} />
            <label>
              <span className="text-sm font-semibold text-ink">Job description</span>
              <textarea className="focus-ring mt-2 min-h-48 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm leading-6 text-ink" name="jobDescription" value={form.jobDescription} onChange={updateField} />
            </label>
            <Button variant="signal" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <WandSparkles size={18} aria-hidden="true" />}
              Generate cover letter
            </Button>
          </div>
        </section>

        <section className="space-y-5">
          <div className="resume-paper p-8" ref={letterRef}>
            <p className="text-sm font-semibold uppercase tracking-wide text-signal">{selectedTemplate.name} cover letter</p>
            <div className="mt-5 whitespace-pre-line text-base leading-8 text-ink">{letter}</div>
          </div>
          <div className="panel p-5">
            <label className="text-sm font-semibold text-ink">Editable letter</label>
            <textarea className="focus-ring mt-3 min-h-96 w-full rounded-lg border border-line bg-glass/70 p-4 text-sm leading-7 text-ink" value={letter} onChange={(event) => setLetter(event.target.value)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input className="focus-ring mt-2 w-full rounded-lg border border-line bg-glass/70 px-3 py-3 text-sm text-ink" {...props} />
    </label>
  );
}
