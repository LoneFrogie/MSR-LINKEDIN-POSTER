"""
LinkedIn Content Generator
Generates 3 distinct 250-word LinkedIn post options using Claude,
writing in the voice of MS. READ's seasoned HR Manager.
"""

import json
import re
import sys
import os
from typing import List, Optional

# Ensure BettieAI root is on path when run directly

from backend.claude_client import ask_claude
from config.brand import COMPANY, HR_PERSONA, CONTENT_STRATEGY


_SYSTEM_PROMPT = f"""You are {HR_PERSONA['role']} at {HR_PERSONA['company']}.

About you:
{HR_PERSONA['personality']}

Your expertise covers: {', '.join(HR_PERSONA['expertise'])}.

About the company:
{COMPANY['about']}

LinkedIn objective:
{CONTENT_STRATEGY['objective']}

Voice & tone: {HR_PERSONA['voice']['tone']}

Avoid: {', '.join(HR_PERSONA['voice']['avoid'])}

IMPORTANT RULES:
- Every post must be EXACTLY around 250 words (240-260 words)
- Write in first-person as the HR Manager
- Posts must feel authentic, not like marketing copy
- Each post must end with 3-5 relevant hashtags from this pool:
  {' '.join(CONTENT_STRATEGY['hashtags'])}
- Always include a clear CTA at the end (before hashtags)
- Do NOT include the word count or label in the output
- Malaysia context: write for a Malaysian professional audience on LinkedIn

WRITE LIKE A REAL HUMAN. AI detectors will flag this post — your job is to make it undetectable. Follow every rule below:

BANNED WORDS (zero tolerance — replace with simpler alternatives):
em dash (—), transformative, game-changing, pivotal, crucial, foster, leverage, navigate, landscape, delve, tapestry, underscore, testament, beacon, realm, elevate, unlock, empower (as a buzzword), holistic, robust, seamless, streamline, cutting-edge, innovative (as filler)

BANNED OPENER PHRASES:
"In today's world", "In today's fast-paced", "It's worth noting", "Let that sink in", "As we navigate", "I'm excited to share", "I'm thrilled to announce", "I'd like to share", "Let's dive in", "Let's explore", "It goes without saying", "Needless to say", "At the end of the day", "I've been reflecting", "This got me thinking"

SENTENCE LENGTH — THIS IS CRITICAL:
AI text fails detection because every sentence is a similar length. You must vary dramatically:
- Some sentences: 4-6 words. Punchy. Direct.
- Some sentences run longer, winding through a thought the way a person actually talks when they're trying to explain something they genuinely care about, before landing on the point.
- Never write 3 consecutive sentences of similar length.
- Start some sentences mid-thought, like you're continuing a conversation.

STRUCTURE RULES:
- Do NOT open with a question or a dramatic one-liner hook every time
- Sometimes start with a specific memory, observation, or situation: "Last week a candidate asked me..." / "We had a 10-year anniversary celebration for one of our retail staff..."
- Avoid perfectly balanced paragraph lengths — vary them
- One paragraph can be a single sentence. Or two. That's normal.
- No bullet lists inside the post body
- Include one specific real detail: a number, a name, a place, a date, a dollar amount, a percentage

PERSONALITY & IMPERFECTION:
- Occasionally use "honestly", "to be fair", "I'll be real", "I think", "I suppose" — these break the AI cadence
- It's okay to express mild uncertainty: "I'm not sure if this is the right take, but..."
- Personal opinion is fine: "Personally, I think..." rather than stating everything as universal fact
- Don't wrap up every post with a perfect bow — a slightly open ending feels more human

MALAYSIAN VOICE:
- Reference real Malaysian context where natural: EPF, HRDF/HRD Corp, Raya office culture, CNY leave, public holidays, Klang Valley traffic, "HRDF claimable", shift work in retail, minimum wage updates
- Malaysian English rhythm is okay: slightly less formal, direct, warm
- "lah" only if it flows naturally — do not force it
"""


def _load_reference_posts() -> List[dict]:
    """Load saved reference posts from DB settings."""
    try:
        from backend.database import get_setting
        raw = get_setting("reference_posts") or "[]"
        refs = json.loads(raw)
        return [r for r in refs if r.get("text", "").strip()]
    except Exception:
        return []


def _build_reference_block(refs: List[dict]) -> str:
    if not refs:
        return ""
    lines = ["\nREFERENCE EXAMPLES — study these real MS. READ LinkedIn posts for tone, structure, and voice. Mirror this style:"]
    for i, ref in enumerate(refs[:6], 1):  # cap at 6 references
        label = ref.get("label") or f"Example {i}"
        text = ref.get("text", "").strip()
        lines.append(f"\n--- {label} ---\n{text}")
    lines.append("\n--- END OF REFERENCES ---")
    lines.append("Use these as your style guide. Do NOT copy or paraphrase them — generate original content that matches this voice.\n")
    return "\n".join(lines)


def _build_user_prompt(topic: Optional[str], blocked_keywords: List[str]) -> str:
    topic_line = f"Main topic (optional guidance): {topic}" if topic else "No specific topic provided — choose the most timely and relevant angle."

    blocked_line = ""
    if blocked_keywords:
        blocked_line = f"\nAVOID these recently rejected topics/angles (blocked for 6 months): {'; '.join(blocked_keywords[:10])}"

    refs = _load_reference_posts()
    reference_block = _build_reference_block(refs)

    angles = CONTENT_STRATEGY["content_angles"]

    return f"""Generate exactly 3 LinkedIn posts for MS. READ's company page.

{topic_line}
{blocked_line}
{reference_block}
Each post must use a DIFFERENT angle as described below:

Option A — {angles[0]['name']}:
{angles[0]['description']}

Option B — {angles[1]['name']}:
{angles[1]['description']}

Option C — {angles[2]['name']}:
{angles[2]['description']}

Return your response as a valid JSON object in this exact format:
{{
  "options": [
    {{
      "label": "A",
      "angle_name": "{angles[0]['name']}",
      "content": "<full 250-word post text including CTA and hashtags>"
    }},
    {{
      "label": "B",
      "angle_name": "{angles[1]['name']}",
      "content": "<full 250-word post text including CTA and hashtags>"
    }},
    {{
      "label": "C",
      "angle_name": "{angles[2]['name']}",
      "content": "<full 250-word post text including CTA and hashtags>"
    }}
  ]
}}

Only return the JSON object — no markdown fences, no extra text.
"""


_HUMANIZE_PROMPT = """You are a human writing editor. Your job is to rewrite the LinkedIn post below so it passes AI detection tools like ZeroGPT and GPTZero.

Rules:
1. Vary sentence lengths dramatically — mix 4-word punchy sentences with longer flowing ones
2. Remove any remaining AI vocabulary: transformative, pivotal, crucial, foster, leverage, navigate, landscape, delve, underscore, tapestry, elevate, unlock, seamless, robust, holistic
3. Remove em dashes (—), replace with commas or full stops
4. Add one or two natural imperfections: "honestly", "I think", "to be fair", "I'll be real"
5. If the opening is a dramatic hook or question, rewrite it as a specific observation or memory instead
6. Make sure NOT every paragraph is the same length
7. Keep the total word count around 250 words
8. Keep all hashtags exactly as-is
9. Keep the core message and CTA intact

Return ONLY the rewritten post text. No explanation, no labels, no markdown."""


def _humanize_post(content: str) -> str:
    """Run a second-pass humanizer on a generated post."""
    try:
        rewritten = ask_claude(_HUMANIZE_PROMPT, content, max_tokens=1024)
        return rewritten.strip() if rewritten.strip() else content
    except Exception:
        return content


def generate_options(topic: Optional[str], blocked_keywords: Optional[List[str]] = None) -> List[dict]:
    """
    Call Claude and return a list of 3 option dicts:
    [{"label": "A", "angle_name": ..., "content": ...}, ...]
    """
    prompt = _build_user_prompt(topic, blocked_keywords or [])
    raw = ask_claude(_SYSTEM_PROMPT, prompt, max_tokens=4096)

    # Strip any accidental markdown fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw.strip())

    try:
        data = json.loads(raw)
        options = data.get("options", [])
        if len(options) != 3:
            raise ValueError(f"Expected 3 options, got {len(options)}")
        # Validate required fields
        for opt in options:
            assert opt.get("label") in ("A", "B", "C"), "Invalid label"
            assert opt.get("angle_name"), "Missing angle_name"
            assert opt.get("content"), "Missing content"
        # Second-pass humanizer on each post
        for opt in options:
            opt["content"] = _humanize_post(opt["content"])
        return options
    except (json.JSONDecodeError, ValueError, AssertionError) as e:
        # Fallback: attempt to extract JSON from within the response
        match = re.search(r'\{.*"options"\s*:.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return data.get("options", [])
        raise RuntimeError(f"Content generation failed to parse: {e}\nRaw: {raw[:500]}")
