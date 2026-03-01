Local LLM Setup for Discourse AI
==================================

_Last updated: March 2026_

Discourse has AI features built into its core. These include topic summarisation, chat digests, a composer helper for drafting posts, auto-tagging, and configurable AI personas. By default these features point at cloud APIs (OpenAI, Anthropic, etc.), but they can be pointed at a local, self-hosted model instead.

This means: **community-owned forum + community-owned AI. No data leaves the server.**

## Two paths

### Path 1: Self-hosted Discourse + self-hosted model (full local)

Everything runs on your own hardware. No data goes anywhere.

**What you need:**

| Component | What | Why |
|---|---|---|
| Discourse | Self-hosted via Docker | The forum itself |
| Model server | vLLM or HuggingFace TGI | Serves the local LLM. These are the backends Discourse has tested and documented. |
| LLM | Llama 3 8B, Mistral 7B, or similar | The actual model that does summarisation, drafting, etc. |
| Embedding model | all-MiniLM-L6-v2 or similar | For semantic search and related topics (optional but useful) |

**Hardware requirements:**

| Setup | GPU VRAM | System RAM | What it runs |
|---|---|---|---|
| Minimum viable | 12-16 GB (e.g. RTX 4060 Ti 16GB) | 16 GB | 7-8B model, good enough for summarisation |
| Recommended | 24 GB (e.g. RTX 4090) | 32 GB | 7-13B models comfortably, better quality |
| CPU-only (no GPU) | None | 32+ GB | 7B quantised model — slower but works for low-traffic forums |

For a small community forum with modest traffic, CPU-only inference is a viable starting point. Summarisation doesn't need to be instant — a 30-second wait for a thread summary is fine.

**Setup overview:**

1. Install Discourse via their standard Docker setup
2. Run vLLM or HuggingFace TGI in a separate Docker container on the same server
3. Download a model (e.g. `meta-llama/Llama-3.1-8B-Instruct`)
4. In Discourse admin → AI → LLM Settings, add a new LLM pointing at your local model server
5. Enable the features you want (summarisation, composer helper, etc.)

**Detailed guides from Discourse:**

- Self-hosting an open source LLM for Discourse AI: https://meta.discourse.org/t/self-hosting-an-opensource-llm-for-discourseai/290923
- Self-hosting embeddings for Discourse AI: https://meta.discourse.org/t/self-hosting-embeddings-for-discourseai/290925
- Discourse AI self-hosted guide: https://meta.discourse.org/t/discourse-ai-self-hosted-guide/259598

**Note on Ollama:** Ollama is the most popular local model runner, but as of late 2025 it has unresolved compatibility issues with Discourse AI (tokenizer errors). Use vLLM or HuggingFace TGI instead. They serve the same models — Ollama is just not the right serving tool for this integration yet.

### Path 2: Discourse free hosting + their hosted LLM (easiest)

If you qualify for Discourse's free community hosting programme, they now provide a **free hosted open-weights LLM** that powers all the AI features. No setup, no hardware, no API keys.

**What you need:**
- An approved Discourse free hosting application
- That's it

**Trade-offs:**
- Data is on Discourse's servers, not yours (but Discourse is open source and reputable)
- Less control over which model is used
- The fastest way to get started by far

**Apply at:** https://free.discourse.group

This is the recommended starting point. You can always migrate to self-hosted later if you need full local control.

## Which AI features to enable

Not everything needs to be turned on at once. Start with the features that directly support the weeknotes and learning-in-the-open workflow:

### Start with these

| Feature | What it does | Why it helps |
|---|---|---|
| **Topic summarisation** | Generates a short summary at the top of long threads | Helps people catch up on busy discussions without reading everything |
| **Chat channel summarisation** | Weekly digest of chat conversations | Turns the lightweight WhatsApp-like stream into something searchable and reviewable |
| **Composer helper** | Assists with drafting posts — proofreading, suggesting titles, structuring | Lowers the friction of writing weeknotes. Someone can dump rough notes and get help structuring them |

### Add later if useful

| Feature | What it does | Why it might help |
|---|---|---|
| **Auto-tagging** | AI applies tags to topics | Keeps the weeknotes and outputs well-organised without manual effort |
| **AI personas** | Configurable bot that answers questions | Could be set up as a "community guide" that helps new members find things |
| **Semantic search** | Search by meaning, not just keywords | Useful once you have a large archive of weeknotes and outputs |
| **Sentiment analysis** | Tracks community health over time | Interesting for retrospectives — are people generally positive? What changed? |

### Don't enable

| Feature | Why not |
|---|---|
| **Content classification / NSFW detection** | Overkill for a small trusted community. Use human moderation |
| **Spam detection** | The approval-required signup handles this |

## Architecture diagram

```
┌─────────────────────────────────────────────┐
│  Your server (VPS or local machine)         │
│                                             │
│  ┌─────────────┐     ┌──────────────────┐   │
│  │  Discourse   │────▶│  vLLM / HF TGI   │   │
│  │  (Docker)    │     │  (Docker)        │   │
│  │              │     │                  │   │
│  │  Forum +     │     │  Llama 3 8B or   │   │
│  │  AI features │◀────│  Mistral 7B      │   │
│  └─────────────┘     └──────────────────┘   │
│         │                                   │
│         ▼                                   │
│  ┌─────────────┐                            │
│  │  PostgreSQL  │                            │
│  │  + Redis     │                            │
│  └─────────────┘                            │
│                                             │
│  All data stays here. Nothing phones home.  │
└─────────────────────────────────────────────┘
```

## Cost

| Setup | Monthly cost | Notes |
|---|---|---|
| Discourse free hosting + their LLM | **Free** | Must qualify for community programme |
| Self-hosted, CPU-only (Hetzner CX32 or similar) | **~£8-15/mo** | Slow inference but works for small communities |
| Self-hosted with GPU (cloud GPU VPS) | **~£40-80/mo** | Fast inference, more capable models |
| Self-hosted on own hardware | **Electricity only** | Need a machine with a decent GPU |

For a first pilot, **free Discourse hosting is the obvious starting point**. Move to self-hosted if and when you need full local control.
