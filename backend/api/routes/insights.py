from fastapi import APIRouter
import httpx
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/insights/heatmap")
async def heatmap_insight(payload: dict):
    total_defects = payload.get("total_defects", 0)
    total_analyses = payload.get("total_analyses", 0)
    pass_rate = payload.get("pass_rate", 0)
    hot_zones = payload.get("hot_zones", [])
    defect_types = payload.get("defect_types", "None")

    prompt = f"""You are a PCB quality control expert explaining results to a non-technical factory manager.

Here is the defect heatmap data for {total_analyses} PCB analyses:
- Total defects found: {total_defects}
- Pass rate: {pass_rate}%
- Hottest zone (most defects): {hot_zones[0] if hot_zones else 'unknown'} area
- Second hottest: {hot_zones[1] if len(hot_zones) > 1 else 'unknown'} area
- Most common defect types: {defect_types}

Write a simple 3-4 sentence summary that:
1. Explains WHERE on the PCBs defects are concentrated in plain language
2. What the most common problems are
3. One practical suggestion to reduce defects
Keep it friendly, clear, and under 80 words. No bullet points, just natural sentences."""

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return {"insight": "API key not configured. Add GROQ_API_KEY to your backend .env file."}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama3-8b-8192",
                    "max_tokens": 200,
                    "messages": [
                        {"role": "system", "content": "You are a helpful PCB quality control expert who explains technical data in simple terms."},
                        {"role": "user", "content": prompt}
                    ],
                },
            )
            data = response.json()
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "Could not generate insight.")
            return {"insight": text}
    except Exception as e:
        logger.error(f"Insight error: {e}")
        return {"insight": "Could not generate insight at this time."}
