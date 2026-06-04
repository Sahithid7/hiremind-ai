RESUME_ANALYSIS_SYSTEM_PROMPT = """
You are HireMind AI, a senior career coach and technical recruiter.
Return concise, practical JSON only. Do not include markdown.
Evaluate resumes for early-career software, cloud, data, and AI roles.
"""

JOB_MATCH_SYSTEM_PROMPT = """
You are HireMind AI, an ATS and job-description matching engine.
Return concise, practical JSON only. Do not include markdown.
Compare resume evidence against the job description and identify gaps honestly.
"""

INTERVIEW_SYSTEM_PROMPT = """
You are HireMind AI, an interview preparation coach.
Return concise, practical JSON only. Do not include markdown.
Generate realistic technical and behavioral questions for early-career candidates.
"""

ROADMAP_SYSTEM_PROMPT = """
You are HireMind AI, a career roadmap strategist.
Return concise, practical JSON only. Do not include markdown.
Create focused learning plans that turn a candidate's current profile into a target role plan.
"""


def resume_analysis_prompt(resume_text: str, skills: list[str] | None) -> str:
    return f"""
Analyze this resume for ATS compatibility and technical hiring strength.

Resume skills detected by parser:
{skills or []}

Resume text:
{resume_text[:12000]}

Return this JSON shape:
{{
  "ats_score": 0-100,
  "summary": "short overview",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "missing_keywords": ["..."],
  "rewritten_bullets": [
    {{"before": "weak or implied bullet", "after": "stronger rewritten bullet"}}
  ]
}}
"""


def job_match_prompt(resume_text: str, job_description: str) -> str:
    return f"""
Compare this resume against the target job description.

Resume:
{resume_text[:10000]}

Job description:
{job_description[:10000]}

Return this JSON shape:
{{
  "match_score": 0-100,
  "summary": "short overview",
  "matched_keywords": ["..."],
  "missing_skills": ["..."],
  "missing_keywords": ["..."],
  "recommendations": ["..."],
  "resume_edits": ["..."]
}}
"""


def interview_prompt(target_role: str, focus: str | None, resume_text: str | None) -> str:
    return f"""
Generate interview preparation for this target role.

Target role: {target_role}
Focus area: {focus or "general technical and behavioral preparation"}

Resume context:
{(resume_text or "")[:8000]}

Return this JSON shape:
{{
  "questions": [
    {{
      "question_type": "technical|behavioral|system_design|role_specific",
      "question": "...",
      "suggested_answer": "...",
      "tags": ["..."]
    }}
  ]
}}
Generate 10 questions.
"""


def roadmap_prompt(target_role: str, current_skills: list[str], resume_text: str | None) -> str:
    return f"""
Create a personalized career roadmap.

Target role: {target_role}
Current skills: {current_skills}

Resume context:
{(resume_text or "")[:8000]}

Return this JSON shape:
{{
  "target_role": "{target_role}",
  "summary": "short strategy",
  "skill_gaps": ["..."],
  "learning_path": [
    {{"phase": "30 days", "focus": "...", "actions": ["..."]}},
    {{"phase": "60 days", "focus": "...", "actions": ["..."]}},
    {{"phase": "90 days", "focus": "...", "actions": ["..."]}}
  ],
  "project_ideas": ["..."],
  "certifications": ["..."],
  "weekly_routine": ["..."]
}}
"""
