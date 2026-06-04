import { AlertCircle, CheckCircle2, FileText, FileUp, Loader2, ShieldCheck, UploadCloud, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { uploadResume } from "../services/resumeService";
import { getApiErrorMessage } from "../utils/apiError";

export default function ResumeUpload() {
  usePageTitle("Resume Upload");
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event) {
    setError("");
    setUploadResult(null);
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Choose a PDF or DOCX resume first.");
      return;
    }

    setError("");
    setIsUploading(true);
    try {
      const result = await uploadResume(selectedFile);
      setUploadResult(result.resume);
    } catch (apiError) {
      const message = getApiErrorMessage(apiError, "Resume upload failed. Try another file.");
      const localResume = {
        id: `local-${Date.now()}`,
        original_filename: selectedFile.name,
        parsed_text: "",
        extracted_skills: []
      };
      localStorage.setItem("hiremind_local_resume", JSON.stringify(localResume));
      setUploadResult(localResume);
      setError(`${message} I did not insert demo resume content. Please try another text-selectable PDF/DOCX or use the guided builder.`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Resume builder"
        title="Import your resume"
        description="Upload your current PDF or DOCX resume. HireMind will parse it into structured sections and prepare it for AI scoring."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel overflow-hidden">
          <div className="border-b border-line bg-paper p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-lilac text-signal">
                <UploadCloud size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-ink">Upload resume</h2>
                <p className="mt-1 text-sm text-graphite">PDF or DOCX only. Keep the text selectable for best parsing.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button
              type="button"
              className="focus-ring flex min-h-96 w-full flex-col items-center justify-center rounded-lg border border-dashed border-signal/40 bg-lilac/45 p-8 text-center transition hover:bg-lilac"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp size={46} className="text-signal" aria-hidden="true" />
              <span className="mt-5 text-2xl font-semibold text-ink">Click to upload or drag your resume here</span>
              <span className="mt-3 max-w-xl text-sm leading-6 text-graphite">
                We will extract skills, experience, education, projects, and parsed resume text for AI analysis.
              </span>
              <span className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-signal shadow-sm">
                Choose file
              </span>
            </button>

            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
                <FileText size={18} className="text-signal" aria-hidden="true" />
                <p className="text-sm font-semibold text-graphite">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </p>
              </div>
              <Button variant="signal" type="button" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <WandSparkles size={18} aria-hidden="true" />}
                Parse resume
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <InfoCard icon={ShieldCheck} title="ATS-safe parsing" text="PDF and DOCX text is extracted into clean sections that can be scored and reviewed." />
          <InfoCard icon={WandSparkles} title="AI-ready content" text="Once parsed, your resume can be analyzed, matched to jobs, and used for interview prep." />
          <InfoCard icon={CheckCircle2} title="Structured overview" text="Skills, experience, education, projects, and text preview appear immediately after upload." />
        </section>
      </div>

      {error && (
        <div className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle size={19} aria-hidden="true" />
          {error}
        </div>
      )}

      {uploadResult && (
        <section className="panel surface-enter mt-6 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-mint" size={24} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-ink">Parsed successfully</h2>
              <p className="mt-1 text-sm text-graphite">{uploadResult.original_filename}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-mist p-4">
              <p className="text-sm font-semibold text-ink">Detected skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(uploadResult.extracted_skills?.length ? uploadResult.extracted_skills : ["No skills detected yet"]).map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-graphite">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-mist p-4">
              <p className="text-sm font-semibold text-ink">Parsed text preview</p>
              <p className="mt-3 line-clamp-5 text-sm leading-6 text-graphite">
                {uploadResult.parsed_text || "No text extracted."}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <article className="panel p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-peach text-coral">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-graphite">{text}</p>
    </article>
  );
}
