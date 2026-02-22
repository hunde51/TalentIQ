from __future__ import annotations

import re
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()

KNOWN_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "postgresql",
    "mysql",
    "fastapi",
    "django",
    "flask",
    "react",
    "node",
    "docker",
    "kubernetes",
    "aws",
    "git",
    "linux",
    "pandas",
    "numpy",
    "tensorflow",
    "pytorch",
    "scikit-learn",
}

EDUCATION_KEYWORDS = (
    "bachelor",
    "master",
    "phd",
    "b.sc",
    "m.sc",
    "university",
    "college",
    "degree",
)

EXPERIENCE_PATTERNS = (
    r"\\b\\d+\\+?\\s+years?\\b",
    r"\\b\\d+\\s+yrs?\\b",
    r"\\bsoftware engineer\\b",
    r"\\bbackend developer\\b",
    r"\\bfrontend developer\\b",
    r"\\bdata scientist\\b",
)


def parse_resume_file(file_path: str) -> dict:
    text = _extract_text(file_path)
    if not text.strip():
        return {
            "skills": [],
            "experience": [],
            "education": [],
            "entities": [],
            "parser_source": "empty",
        }

    entities, parser_source = _extract_entities_with_hf(text)
    skills = _extract_skills(text)
    education = _extract_education(text)
    experience = _extract_experience(text)

    return {
        "skills": skills,
        "experience": experience,
        "education": education,
        "entities": entities,
        "parser_source": parser_source,
    }


def _extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_text_from_pdf(path)
    if suffix == ".docx":
        return _extract_text_from_docx(path)
    if suffix == ".doc":
        # Legacy .doc parsing requires extra native tooling; keep a safe fallback.
        return path.read_bytes().decode("latin-1", errors="ignore")

    return path.read_text(encoding="utf-8", errors="ignore")


def _extract_text_from_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    chunks: list[str] = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    return "\n".join(chunks)


def _extract_text_from_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs)


def _extract_entities_with_hf(text: str) -> tuple[list[dict], str]:
    hf_token = settings.ai_api_key
    if not hf_token:
        return [], "heuristic"

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(token=hf_token)
        # Limit size for remote inference latency/cost.
        ner_result = client.token_classification(
            text=text[:4000],
            model="dslim/bert-base-NER",
        )

        entities: list[dict] = []
        for item in ner_result:
            entities.append(
                {
                    "label": getattr(item, "entity_group", None) or getattr(item, "entity", ""),
                    "word": getattr(item, "word", ""),
                    "score": float(getattr(item, "score", 0.0)),
                }
            )

        return entities, "huggingface"
    except Exception:
        return [], "heuristic"


def _extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    found = [skill for skill in KNOWN_SKILLS if skill in text_lower]
    return sorted(set(found))


def _extract_education(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = [line for line in lines if any(keyword in line.lower() for keyword in EDUCATION_KEYWORDS)]
    return matches[:10]


def _extract_experience(text: str) -> list[str]:
    text_lower = text.lower()
    matches: list[str] = []

    for pattern in EXPERIENCE_PATTERNS:
        for found in re.findall(pattern, text_lower):
            matches.append(found)

    return sorted(set(matches))[:15]
