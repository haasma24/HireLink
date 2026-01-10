from dataclasses import dataclass
from typing import Optional, Literal
import os
import requests
from dotenv import load_dotenv

load_dotenv()

EmailType = Literal["refus", "relance", "invitation"]


@dataclass
class EmailContext:
    candidate_name: str
    candidate_email: str
    job_title: str
    company_name: str
    application_date: str  # "YYYY-MM-DD"
    interview_date: Optional[str]  # None or "" if not applicable
    email_type: EmailType
    # Force English by default
    language: str = "en"
    # Tone for English emails
    tone: str = "professional"


def build_prompt(ctx: EmailContext) -> str:
    # Full context in English
    base_context = (
        "Recruitment context:\n"
        f"- Candidate: {ctx.candidate_name}\n"
        f"- Position: {ctx.job_title}\n"
        f"- Company: {ctx.company_name}\n"
        f"- Application date: {ctx.application_date}\n"
    )

    if ctx.interview_date:
        base_context += f"- Planned interview date: {ctx.interview_date}\n"

    # Objectives in English, language controlled by {lang}
    if ctx.email_type == "refus":
        objective = (
            "Write a rejection email for this job application in {lang}, "
            "with a {tone} tone, polite and respectful, "
            "without proposing any specific alternative position."
        )
    elif ctx.email_type == "relance":
        objective = (
            "Write a follow-up email for a candidate who is still in the hiring process, "
            "in {lang}, with a {tone} tone, asking if they are still interested."
        )
    elif ctx.email_type == "invitation":
        objective = (
            "Write an interview invitation email for this position, "
            "in {lang}, with a {tone} tone, clearly mentioning the planned interview date."
        )
    else:
        raise ValueError(f"Unsupported email type: {ctx.email_type}")

    guidelines = (
        "Writing constraints:\n"
        "- Directly address the candidate by their first or last name.\n"
        "- Keep a professional and human tone.\n"
        "- Do not write more than a few short paragraphs.\n"
        "- Do not change factual information (name, job title, company, dates).\n"
        "- Do not use placeholders like [Your Name], [Phone], or [Email].\n"
        "- End the email with a generic signature such as 'Best regards' followed by 'Actia Recruitment Team'.\n"
    )


    prompt = (
        "You are an AI assistant specialized in recruitment.\n"
        f"{base_context}\n"
        f"{objective.format(lang=ctx.language, tone=ctx.tone)}\n\n"
        f"{guidelines}\n"
        "Expected output: only the body of the email, in plain text, without HTML tags."
    )

    return prompt


def call_llm_api(prompt: str, language: str) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Environment variable OPENROUTER_API_KEY is not set."
        )

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "HireLink AI Email Assistant",
    }

    # System message in English, explicit about language
    system_content = (
        "You are an AI assistant for a recruitment platform. "
        f"You write professional emails in {language} for job candidates."
    )

    data = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {
                "role": "system",
                "content": system_content,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.4,
    }

    response = requests.post(url, headers=headers, json=data, timeout=30)
    response.raise_for_status()
    payload = response.json()

    try:
        return payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise RuntimeError(f"Unexpected OpenRouter API response: {payload}")


def generate_email(ctx: EmailContext) -> str:
    prompt = build_prompt(ctx)
    generated = call_llm_api(prompt, ctx.language)
    return generated
