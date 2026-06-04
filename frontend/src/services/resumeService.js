import { api } from "./api";

// Always use the AI-powered extract endpoint for the resume wizard.
// gpt-4o PDF processing can take 30-90 seconds — use a 3-minute timeout.
export async function uploadResume(file) {
  console.log(`[uploadResume] → POST /resume/extract  file=${file.name}  size=${file.size} bytes`);
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/resume/extract", formData, { timeout: 180000 });
  console.log("[uploadResume] ← response:", {
    name: data?.resume?.name,
    email: data?.resume?.email,
    exp_count: (data?.resume?.extracted_experience || []).length,
    edu_count: (data?.resume?.extracted_education || []).length,
    diagnostics: data?.resume?.diagnostics,
  });
  return data;
}

export async function fetchResumes() {
  const { data } = await api.get("/resume");
  return data;
}

export async function fetchResume(resumeId) {
  const { data } = await api.get(`/resume/${resumeId}`);
  return data;
}
