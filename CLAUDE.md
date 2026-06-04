# HireMind AI — Claude Code Guide

## Project Overview
Full-stack AI-powered career platform. FastAPI backend + React/Vite frontend.

## Running the Project

### Backend — MUST use venv Python
```bash
cd backend
.venv\Scripts\uvicorn app.main:app --reload --port 8011
```

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://127.0.0.1:5173
```

### IMPORTANT: Two things that must be true
1. Backend runs on **port 8011** (not 8010 — old process holds 8010)
2. `frontend/.env` must have `VITE_API_BASE_URL=http://127.0.0.1:8011/api/v1`
3. Run uvicorn with `.venv\Scripts\uvicorn` (not system Python — groq/pdfplumber are in venv)

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, SQLite (local), OpenAI gpt-4o-mini
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **AI**: OpenAI `gpt-4o-mini` — resume parsing, rewriting, summary improvement

## Key Environment Variables (`backend/.env`)
```
DATABASE_URL=sqlite:///./hiremind_local.db
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174","http://localhost:5175","http://127.0.0.1:5175"]
```

## Architecture

### Backend Key Files
| File | Purpose |
|------|---------|
| `backend/app/services/resume_parser.py` | PDF/DOCX text extraction (pdfplumber + PyPDF2) |
| `backend/app/services/ai_service.py` | AI parsing, rewriting, validation, summary improvement |
| `backend/app/services/resume_service.py` | Upload handler — calls AI parser automatically |
| `backend/app/api/routes/resume.py` | Resume API routes |
| `backend/app/api/router.py` | Main API router |
| `backend/app/ai/openai_client.py` | OpenAI client wrapper (generate_json method) |

### Frontend Key Files
| File | Purpose |
|------|---------|
| `frontend/src/pages/ResumeExpert.jsx` | Resume build wizard (upload → section wizard → templates) |
| `frontend/src/pages/ResumeBuilder.jsx` | Live resume editor with 15 templates |
| `frontend/src/pages/JobMatch.jsx` | JD keyword match analyzer |
| `frontend/src/pages/CoverLetterBuilder.jsx` | Cover letter builder |
| `frontend/src/utils/resumeExtraction.js` | Schema mapping, validation, confidence scoring |
| `frontend/src/utils/resumeTemplateExport.js` | `buildResumeTemplateHtml(form, opts)` — 15 templates |
| `frontend/src/components/ResumeTemplateRenderer.jsx` | `renderResumeHTML(person, templateId)` — template renderer |
| `frontend/src/services/aiService.js` | Frontend AI service (parse-ai, rewrite, improve-summary) |

## Resume Build Workflow (ResumeExpert.jsx)
1. **Input** — user uploads PDF/DOCX or pastes text
2. **Loading** — 5-step animation while backend extracts
3. **Wizard** — multi-step section editor (Heading → Education → Experience → Skills → Summary → Certifications → Finalize)
4. **Templates** — grid of 15 templates; click to open builder

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/resume/extract` | Upload + AI-parse resume (no auth) |
| POST | `/api/v1/resume/parse-ai` | Precision AI parse of raw text |
| POST | `/api/v1/resume/rewrite` | ATS rewrite with validation + retry |
| POST | `/api/v1/resume/improve-summary` | AI-improve professional summary |

## Design System
- **Primary**: Purple `#7c3aed` / `bg-purple-600`
- **Accent (signal)**: Emerald `#14B87A`
- **Dark bg**: `#080C15` (page) / `#10141F` (card)
- **Dark mode**: use `useTheme()` hook → `isDark` boolean
- **Font**: System sans-serif, Tailwind utilities

## Known Rules / Lessons Learned
- NEVER use `gpt-5.4-mini` — correct model is `gpt-4o-mini`
- `BACKEND_CORS_ORIGINS` must be JSON array format: `["url1","url2"]`
- `_fix_line()` in resume_parser.py must ONLY apply to ALL-CAPS heading lines (not body text)
- `_is_tech_continuation_line()` check must come BEFORE `_split_project_name_tech()` in `_extract_projects()`
- All extraction must be wrapped in try/except — never throw for content failures
- Loading animation: don't clear step timers early; await full MIN_MS before advancing stage
- `schemaToForm(schema)` converts structured schema → flat form for builder
- `renderResumeHTML(person, templateId)` expects SAMPLE_PERSON-format object
- `buildResumeTemplateHtml(form, opts)` expects schemaToForm output

## Data Schemas

### ResumeSchema (frontend)
```js
{
  personal: { name, title, email, phone, location, linkedin, github },
  summary: "",
  experience: [{ job_title, company, location, start_date, end_date, bullets[] }],
  education: [{ school, degree, gpa, graduation_date, coursework }],
  skills: string[],
  skills_categorized: { "Category": string[] },
  projects: [{ name, technologies, description, bullets[] }],
  certifications: string[],
}
```

### AI Parse Response (backend → frontend)
```json
{
  "contact": { "name", "email", "phone", "location", "linkedin", "github" },
  "professional_title": "",
  "summary": "",
  "experience": [{ "company", "title", "location", "start_date", "end_date", "bullets" }],
  "education": [{ "institution", "degree", "start_date", "end_date", "gpa", "coursework" }],
  "projects": [{ "name", "date", "bullets" }],
  "skills": { "programming_languages", "software_development", "cloud_devops", "databases", "ai_ml", "tools_platforms" },
  "_validation": { "checks": {}, "failed": [], "passed": true }
}
```
