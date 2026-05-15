"""
Claude API client for content generation.
Reads ANTHROPIC_API_KEY from environment or database settings.
"""

import os


CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-5")


def ask_claude(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    """Call Claude API and return the response text."""
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError(
            "No Anthropic API key configured. Set ANTHROPIC_API_KEY environment variable."
        )
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def _get_api_key() -> str:
    # Try env var first
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if key:
        return key
    # Fall back to database setting
    try:
        from backend.database import get_setting
        return get_setting("anthropic_api_key") or ""
    except Exception:
        return ""
