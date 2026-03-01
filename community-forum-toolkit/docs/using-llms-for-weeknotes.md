Using LLMs to Help With Weeknotes and Outputs
===============================================

## The problem weeknotes solve (and the problem they have)

Weeknotes are brilliant in theory. Regular, honest documentation of what you're doing and learning. Over time they build an incredible archive.

In practice, most weeknotes habits die within a month. The reason is almost always the same: **the friction of writing them up**. People are busy. They get to Friday afternoon and the thought of writing a structured post feels like homework.

The thinking and reflecting is the valuable part. The writing-it-up-nicely is where it falls over.

LLMs can fix this.

## Pattern 1: Voice memo to weeknote

The lowest-friction version.

**How it works:**
1. At the end of the week (or after a meeting, event, or conversation), record a 2-3 minute voice memo on your phone
2. Transcribe it (most phones can do this natively now, or use any transcription service)
3. Hand the transcript to an LLM with the weeknote template

**Example prompt:**
```
Here's a rough voice transcript from my week. Please turn it into a
weeknote using the format below. Keep my voice and tone — don't make
it sound corporate. If I said something vague, keep it vague rather
than inventing detail.

Format:
## Weeknotes — [date] — [name]
### What happened
### What we learned
### What's stuck

Transcript:
[paste transcript here]
```

**Why it works:** Talking is easier than writing. Most people can ramble for 2 minutes about their week. The LLM handles the structure.

## Pattern 2: Prompted conversation to weeknote

If you don't want to monologue into your phone, have the LLM interview you instead.

**How it works:**
1. Open a chat with an LLM (Claude, ChatGPT, whatever you have)
2. Say: "Help me write my weeknotes. Ask me one question at a time."
3. Answer each question in a sentence or two
4. The LLM drafts the weeknote from your answers

**Example opening prompt:**
```
I need to write my weeknotes for the community forum project. Ask me
one question at a time to draw out what happened this week, what I
learned, and what's stuck. Keep it conversational. When you have
enough, draft the weeknote for me.
```

**Why it works:** Answering questions is easier than staring at a blank page. The LLM acts as a friendly interviewer.

## Pattern 3: Forum threads to digest

When a Discourse thread gets long and busy, an LLM can pull out the signal.

**How it works:**
1. Copy the thread content (or use the Discourse API to pull it)
2. Ask the LLM to summarise: key points, decisions made, open questions, action items
3. Post the summary as a reply in the thread, or as a separate digest post

**Example prompt:**
```
Here's a discussion thread from our community forum. Please summarise:
- Key points raised
- Any decisions that were made or emerging consensus
- Open questions that haven't been resolved
- Any action items or next steps mentioned

Keep it concise. Use bullet points.

Thread:
[paste thread content]
```

**Why it works:** Long threads are hard to follow. A summary helps people who missed the conversation catch up, and helps the people who were in it confirm what was actually agreed.

## Pattern 4: Retrospective to public output

The honest, members-only retrospective discussion often contains learning that would help others. But sharing it raw wouldn't be appropriate. An LLM can help distil it.

**How it works:**
1. Copy the retrospective discussion
2. Ask the LLM to extract the lessons learned, without the personal or sensitive context
3. Review and edit the output (this step matters — you're the human filter)
4. Post the distilled version in the public Weeknotes or Outputs category

**Example prompt:**
```
Here's a candid retrospective discussion from our community team.
Please distil the lessons learned into a public-facing "what we
learned" post. Remove any personal details, names, or sensitive
context. Focus on the transferable learning — what would be useful
for another community trying to do something similar?
```

**Why it works:** This is the bridge between safe, honest reflection (private) and learning in the open (public). The LLM does the first pass of anonymising and distilling; you do the final check.

## Pattern 5: Weeknotes archive to quarterly summary

After a few months of weeknotes, you have raw material that an LLM can synthesise.

**How it works:**
1. Collect all the weeknotes from the past quarter
2. Ask the LLM to identify themes, track progress, and surface patterns
3. Use the output as the starting point for a quarterly report, blog post, or funding bid

**Example prompt:**
```
Here are 12 weeks of weeknotes from our community forum project.
Please:
1. Identify the main themes and how they evolved over time
2. Summarise what progress was made
3. Note recurring blockers or challenges
4. Highlight any surprises or shifts in direction
5. Suggest what the key achievements and lessons are

This will be the basis for a quarterly update to our community.
```

**Why it works:** No one reads back through 12 weeks of weeknotes. But the learning is in there. The LLM surfaces it.

## Important: the human stays in the loop

In every pattern above, the LLM drafts and the human reviews. This matters because:

- **Voice and tone**: The weeknotes should sound like the person who wrote them, not like an AI. Edit to keep your voice.
- **Accuracy**: LLMs can subtly distort meaning or invent connections that weren't there. Read the output and correct it.
- **Sensitivity filter**: For the retro-to-public pattern especially, a human needs to check that nothing sensitive leaked through.
- **The reflection is the point**: Don't outsource the thinking. The voice memo, the conversation, the answers to prompts — that's where the reflection happens. The LLM just handles the formatting.

## Getting started

You don't need any special tools. If you have access to any LLM (Claude, ChatGPT, Copilot, Gemini — whatever), you can do all of the above by copying and pasting.

If you want to get fancier later:
- Discourse has an AI plugin that can summarise threads directly in the forum
- You could set up a simple automation (Zapier, Make, n8n) that takes a voice memo, transcribes it, runs it through an LLM, and posts the weeknote to Discourse
- The Discourse API makes it easy to pull thread content and post summaries programmatically

But start with copy-paste. The habit matters more than the tooling.
