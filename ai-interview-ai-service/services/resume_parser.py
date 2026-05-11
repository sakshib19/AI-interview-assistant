"""Resume parsing helpers (LLM-first with regex fallback)."""

import asyncio
import re

from google.genai import types

from core.config import GOOGLE_API_KEY, logger, google_client, groq_client, openrouter_client
from services.common import extract_json_from_text, safe_truncate

# ==========================================
# FIX 1: DEFINE REGEX PATTERNS FOR FALLBACK
# ==========================================
EMAIL_RE = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_RE = re.compile(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{9,10}')


def build_full_context(parsed: dict) -> str:
    """
    Deterministically builds interview context.
    ZERO summarization.
    ZERO paraphrasing.
    """
    parts = []

    if parsed.get("skills"):
        parts.append("TECHNICAL SKILLS:\n" + ", ".join(parsed["skills"]))

    for p in parsed.get("projects", []):
        parts.append(
            f"\nPROJECT: {p.get('title','')}\n"
            f"Technologies: {', '.join(p.get('technologies', []))}\n"
            f"Description: {p.get('description','')}"
        )

    for w in parsed.get("work_experience", []):
        parts.append(
            f"\nWORK EXPERIENCE: {w.get('role','')} at {w.get('company','')}\n"
            f"{w.get('description','')}"
        )

    return "\n".join(parts)


# ==========================================
# FIX 2: MAKE FUNCTION ASYNC TO FIX FASTAPI CRASH
# ==========================================
async def ai_parse_resume(text: str) -> dict:
    """
    Resume parsing using Groq 8B or OpenRouter fallback.
    LLM extracts STRUCTURE ONLY.
    """
    if not text or not text.strip():
        return regex_parse_resume(text)

    safe_text = text[:50000]

    prompt = f"""
    You are a Resume Information Extractor.

    Extract structured fields EXACTLY as written.
    Do NOT summarize.
    Do NOT paraphrase.
    Do NOT generalize.

    OUTPUT JSON ONLY:
    {{
        "name": "",
        "email": "",
        "phone": "",
        "skills": [],
        "education": [{{ "degree": "", "institution": "" }}],
        "projects": [
            {{
                "title": "",
                "technologies": [],
                "description": ""
            }}
        ],
        "work_experience": [
            {{
                "role": "",
                "company": "",
                "description": ""
            }}
        ]
    }}

    RESUME TEXT:
    {safe_text}
    """

    parsed = None

    # 1️⃣ Groq 8B (Using proper await)
    if groq_client:
        try:
            resp = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
            raw = resp.choices[0].message.content
            parsed = extract_json_from_text(raw)
        except Exception as e:
            logger.warning(f"Groq parse failed: {e}")

    # 2️⃣ OpenRouter fallback (Using proper await)
    if not parsed and openrouter_client:
        try:
            resp = await openrouter_client.chat.completions.create(
                model="meta-llama/llama-3.3-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=4000
            )
            parsed = extract_json_from_text(resp.choices[0].message.content)
        except Exception as e:
            logger.warning(f"OpenRouter fallback failed: {e}")

    # 3️⃣ Regex Fallback if AI completely fails
    if not parsed:
        logger.info("Falling back to regex parser...")
        return regex_parse_resume(text)

    # 🔥 BUILD FULL CONTEXT YOURSELF (NO AI)
    parsed["full_context_for_prompt"] = build_full_context(parsed)

    return parsed


def regex_parse_resume(text: str) -> dict:
    """Robust regex-based resume parser"""
    
    # Extract name (first non-header line with 2-4 capitalized words)
    name = None
    for line in text.split('\n')[:10]:
        line = line.strip()
        if line and not any(kw in line.lower() for kw in ['resume', 'cv', 'curriculum', 'profile', '@']):
            words = line.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                name = line
                break
    
    # Extract contact info
    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    
    # Extract skills
    common_skills = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby',
        'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring', 'Express',
        'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions',
        'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum'
    ]
    
    skills = []
    text_lower = text.lower()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            skills.append(skill)
    
    # Extract education
    education = []
    edu_keywords = ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'b.sc', 'm.sc', 'diploma', 'degree']
    for line in text.split('\n'):
        if any(kw in line.lower() for kw in edu_keywords):
            education.append({
                "degree": line.strip()[:100],
                "institution": "Not specified",
                "year": None
            })
    
    # Extract projects
    projects = []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(kw in line_lower for kw in ['project:', 'built', 'developed', 'created', 'implemented']):
            description = ' '.join(lines[i:i+3])[:200]
            proj_skills = [s for s in skills if s.lower() in description.lower()]
            projects.append({
                "title": line.strip()[:100],
                "technologies": proj_skills[:5],
                "description": description
            })
    
    return {
        "name": name or "Candidate",
        "email": email.group(0) if email else None,
        "phone": phone.group(0) if phone else None,
        "skills": list(set(skills))[:15], # Deduplicate skills
        "experience_years": None,
        "education": education[:3],
        "projects": projects[:5],
        "work_experience": [],
        "summary": safe_truncate(text.replace('\n', ' ').strip(), 300)
    }