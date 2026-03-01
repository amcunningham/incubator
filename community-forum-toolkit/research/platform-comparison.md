Platform Comparison
===================

_Last updated: March 2026_

We need a community platform for GP practices and neighbourhoods in Northern Ireland. People currently use Facebook groups and WhatsApp. We want something that feels as lightweight as WhatsApp but has threaded depth when needed — and that the community owns.

## What we need

- **Lightweight stream** — a feed/chat that feels low-friction, like WhatsApp
- **Threaded depth** — ability to have longer, structured discussions when needed
- **Closed conversations** — private spaces for staff, coordinators, sensitive topics
- **Public outputs** — a way to share what we're learning with the wider world
- **Non-technical users** — GPs, practice managers, community workers, residents. Not developers
- **Mobile-first** — if it doesn't work well on a phone, it won't get used
- **Community-owned** — not dependent on Facebook/Meta's decisions
- **Low cost** — ideally free, or very cheap

## Options considered

### Discourse (recommended)

- Modern, open source forum software (Ruby/Ember)
- **Built-in Chat** alongside forum threads — this is the lightweight stream + threaded depth combo we need
- Excellent category-based permissions (public, members-only, staff-only)
- Trust levels that automatically give active members more access
- Login-required mode to keep the whole space private if needed
- Good mobile web experience (no app needed, though apps exist)
- Free to self-host (~£5/mo VPS) or potentially free hosted via community programme
- Free hosting available for open source projects with 10+ contributors
- 50% non-profit discount on paid hosting
- Huge plugin ecosystem and active development
- Weeknotes/blog-style posting works naturally as a category

**Downsides**: Heavier to self-host than PHP options. Mobile experience is decent but doesn't feel native like WhatsApp. Some learning curve for non-technical users.

### Flarum

- Lightweight, modern, open source (PHP)
- Very fast, clean interface
- Runs on cheap shared hosting (~£3/mo)
- Extensible via plugins
- Simpler than Discourse

**Downsides**: No built-in chat feature (need a plugin). Smaller community and ecosystem than Discourse. Less mature permissions system. No managed hosting programme for open source.

### Zulip

- Open source chat platform (Python)
- Topic-based threading built into the core — every message has a topic
- Arguably the closest to "WhatsApp feel + threaded depth"
- Good mobile app
- Free for open source communities

**Downsides**: The topic-per-message model is different and takes getting used to. More of a chat tool than a forum — less suited to long-form posts, weeknotes, or resource sharing. Harder to make public-facing.

### Element / Matrix

- Open source, end-to-end encrypted, federated
- Rooms with threads
- NHS Digital has piloted Matrix internally
- Self-hostable

**Downsides**: More technical to set up and maintain. UI less polished than WhatsApp. Onboarding non-technical people is harder. More of a chat replacement than a forum.

### Signal Groups

- Trusted WhatsApp alternative, E2E encrypted
- Zero friction adoption
- Basic reply-threading

**Downsides**: No web archive, no search, no categories, no permissions model, no public outputs. It's just encrypted WhatsApp. Doesn't solve the depth problem.

### GitHub Discussions

- Free, no hosting needed
- Good for technical communities

**Downsides**: Requires a GitHub account. Not appropriate for non-technical community members. Not mobile-friendly for casual use.

### Circle (SaaS)

- Polished all-in-one community platform
- Chat spaces + discussion spaces in one tool
- Excellent mobile app

**Downsides**: £49+/month. Not open source. Community data lives on their servers. Not replicable.

### Facebook Groups (status quo)

- Everyone already has it
- Zero setup

**Downsides**: Controlled by Meta. Algorithm decides what you see. No data ownership. No export. Growing number of people leaving or wanting to leave. No threading. Ads. Privacy concerns.

### WhatsApp Groups (status quo)

- Everyone already has it
- Feels lightweight and natural

**Downsides**: Messages disappear from view quickly. No search. No categories. No permissions beyond "in the group or not". Can't share outputs publicly. Group size limits. Owned by Meta.

## Decision

**Discourse** — it's the only option that ticks all the boxes:

- Lightweight chat stream (Discourse Chat) ✓
- Threaded depth (forum categories) ✓
- Closed conversations (group permissions) ✓
- Public outputs (public categories, no login required) ✓
- Works for non-technical users (with good onboarding) ✓
- Mobile-friendly ✓
- Community-owned (open source, self-hostable) ✓
- Free or very low cost ✓
- Can qualify for free hosting as an open source project ✓

The main risk is adoption — Discourse is more friction than WhatsApp. The onboarding experience and the lightweight chat feature will be critical.
