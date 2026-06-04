import { AlertCircle, FileQuestion, HelpCircle, Mail, SearchCheck, ShieldCheck, UploadCloud } from "lucide-react";
import { useState } from "react";

import Button from "../components/Button";
import { SectionCard } from "../components/PremiumUI";
import { usePageTitle } from "../hooks/usePageTitle";

const helpCards = [
  ["How to use HireMind", "Start with Build Resume, check ATS, generate a cover letter, then run JD Match Analyzer before applying.", HelpCircle],
  ["Resume upload help", "Upload PDF, DOC, or DOCX files. If the backend is unavailable, HireMind keeps the local workflow usable.", UploadCloud],
  ["ATS score explanation", "Scores combine formatting, content quality, keywords, skills, experience, and section completeness.", ShieldCheck],
  ["JD Match Analyzer", "Paste a job description to compare match score, missing keywords, and truthful optimization ideas.", SearchCheck]
];

const faqs = [
  ["Do I need to sign in?", "No. You can explore the main tools in guest mode. Signing in is only needed later for cloud-saved history."],
  ["Does HireMind invent experience?", "No. JD optimization should only rewrite truthful experience and add keywords where your background supports them."],
  ["Why is my ATS score low?", "Common reasons include missing keywords, weak summary, vague experience bullets, poor section labels, or limited metrics."],
  ["Can I download PDF and DOCX?", "The export buttons generate print-ready or Word-compatible files from the current preview workflow."]
];

export default function HelpSupport() {
  usePageTitle("Help & Support");
  const [openFaq, setOpenFaq] = useState(0);
  const [issue, setIssue] = useState("");
  const [sent, setSent] = useState(false);

  function reportIssue() {
    setSent(true);
    setIssue("");
    window.setTimeout(() => setSent(false), 1800);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-white via-white to-lilac/60 p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-signal">Help & Support</p>
        <h1 className="mt-2 text-4xl font-bold text-ink">How can HireMind help?</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">
          Get quick answers about resume uploads, ATS scoring, cover letters, JD analytics, exports, and local app setup.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {helpCards.map(([title, description, Icon]) => (
          <SectionCard key={title}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lilac text-signal">
              <Icon size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-graphite">{description}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard>
          <h2 className="text-2xl font-bold text-ink">FAQ</h2>
          <div className="mt-5 divide-y divide-line">
            {faqs.map(([question, answer], index) => (
              <button
                key={question}
                type="button"
                className="block w-full py-4 text-left"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <span className="flex items-center justify-between gap-4 font-bold text-ink">
                  {question}
                  <FileQuestion size={18} className="text-signal" />
                </span>
                {openFaq === index && <span className="mt-2 block text-sm leading-6 text-graphite">{answer}</span>}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-bold text-ink">Report an issue</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">Tell us what went wrong. This stores a local confirmation for now and can later connect to support tickets.</p>
          <textarea
            className="focus-ring mt-5 min-h-36 w-full rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-ink"
            value={issue}
            onChange={(event) => setIssue(event.target.value)}
            placeholder="Describe the issue, page, and what you expected..."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="mint" onClick={reportIssue} disabled={!issue.trim()}>
              <AlertCircle size={17} />
              Report Issue
            </Button>
            <Button as="a" href="mailto:support@hiremind.ai" variant="outline">
              <Mail size={17} />
              Contact Support
            </Button>
          </div>
          {sent && <p className="mt-4 rounded-xl bg-mint/10 p-3 text-sm font-bold text-mint">Issue noted locally. Thank you for the clear report.</p>}
        </SectionCard>
      </div>

      <SectionCard className="bg-gradient-to-r from-mint/10 to-signal/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Local app checklist</h2>
            <p className="mt-2 text-sm leading-6 text-graphite">Frontend should run at port 5173 and backend API at port 8010. Add your OpenAI key in the environment files before using cloud AI features.</p>
          </div>
          <Button variant="mint" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
