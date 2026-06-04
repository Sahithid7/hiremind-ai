import { Outlet } from "react-router-dom";

import BrandMark from "../components/BrandMark";
import ThemeToggle from "../components/ThemeToggle";

export default function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-mist text-ink transition-colors duration-300 lg:grid-cols-[1fr_1.1fr]">
      <section className="hidden border-r border-line bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
        <BrandMark to="/" inverse />
        <div>
          <p className="max-w-lg text-4xl font-semibold leading-tight">
            Build ATS-ready resumes, generate cover letters, and analyze your job fit — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["Resume Builder", "8 premium templates with AI guidance"],
              ["ATS Checker", "Real score with section-by-section review"],
              ["JD Match", "Compare your resume to any job description"]
            ].map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-300">Your resume data stays private and is never shared.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandMark to="/" />
            <ThemeToggle compact />
          </div>
          <div className="mb-6 hidden justify-end lg:flex">
            <ThemeToggle />
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
