Discourse Categories & Permissions Template
============================================

This is the recommended category structure for a GP practice / neighbourhood community forum. It balances openness (learning in the open, sharing outputs) with safety (closed spaces for honest reflection and staff coordination).

## Guiding principles

1. **Public by default, private where it matters** — share what you're learning so others benefit. Keep sensitive discussions safe.
2. **Not for clinical conversations** — no patient data, no clinical advice. That belongs in NHS clinical systems.
3. **Lightweight on top, depth underneath** — the Chat channels are the front door. Forum categories are where things get explored properly.
4. **Weeknotes are the heartbeat** — regular short updates build an incredible archive over time.

## Site-wide settings

| Setting | Value | Why |
|---|---|---|
| login required | **No** | Public categories (weeknotes, outputs) should be readable by anyone. This is how we work in the open. |
| must approve users | **Yes** | New accounts need approval to prevent spam and ensure real community members. |
| default trust level | 1 | New approved members can post immediately. |
| min trust to create topic | 1 | Anyone approved can start a conversation. |
| allow uncategorized topics | No | Encourage people to put things in the right place. |

## Category structure

### Public categories (visible to everyone, including non-members)

These are how the community works in the open.

#### Weeknotes
- **Access**: Everyone can read. Members can post.
- **Purpose**: Regular updates on what's happening, what we're learning, what's stuck.
- **Convention**: Post title format: `Weeknotes — [date] — [your name or team]`
- **Tags**: `what-happened`, `what-we-learned`, `whats-stuck`, `shoutout`
- **Why public**: This is the core of learning in the open. Others running similar communities can learn from our journey.

#### Outputs & Resources
- **Access**: Everyone can read. Members can post.
- **Purpose**: Finished or shareable things — guides, templates, reports, links, presentations.
- **Convention**: Include a short summary of what the resource is and who it's for.
- **Tags**: `guide`, `template`, `report`, `presentation`, `link`
- **Why public**: The whole point is sharing what we produce.

#### Project Updates
- **Access**: Everyone can read. Members can post.
- **Purpose**: Updates on specific initiatives or projects the community is running.
- **Why public**: Transparency about what the community is working on.

### Members-only categories (visible only to logged-in, approved members)

These are the community's living room — more relaxed, more honest.

#### General Chat
- **Access**: Members only (Trust Level 1+).
- **Purpose**: The lightweight stream. Day-to-day conversation, links, questions, quick updates. This replaces the WhatsApp group.
- **Note**: Also set up a **Discourse Chat channel** called "General" for real-time messaging. The forum category catches things that deserve a longer thread.

#### Local Info & Events
- **Access**: Members only.
- **Purpose**: What's on, what's open, what's changed. Local services, events, useful info.

#### Mutual Aid & Requests
- **Access**: Members only.
- **Purpose**: "Does anyone have...", "Can someone help with...", "I'm offering..."

#### Retrospectives
- **Access**: Members only.
- **Purpose**: Honest reflection on what isn't going well. What we'd do differently. Lessons learned.
- **Why members-only**: People need to feel safe being candid. Once the learning is distilled, it can be shared publicly via Weeknotes or Outputs.

#### Suggestions & Feedback
- **Access**: Members only.
- **Purpose**: Ideas for improving the community, the forum, or local services.

### Staff/Coordinator categories (restricted to specific groups)

#### Staff Room
- **Access**: "Staff" group only (practice staff, coordinators).
- **Purpose**: Internal coordination, planning, sensitive discussions.
- **Examples**: Event planning, moderation decisions, safeguarding concerns, operational stuff.

#### Moderation
- **Access**: "Moderators" group only.
- **Purpose**: Reported posts, user issues, community health.

## Discourse Chat channels

In addition to forum categories, set up these Chat channels for the real-time lightweight stream:

| Channel | Access | Purpose |
|---|---|---|
| **General** | All members | The main stream. Quick chat, links, reactions. The WhatsApp replacement. |
| **Events** | All members | What's on this week. |
| **Staff** | Staff group | Internal quick coordination. |

## Groups

| Group | Members | Access to |
|---|---|---|
| **Members** | All approved community members | All members-only categories + chat |
| **Staff** | GP practice staff, coordinators | Staff Room category + Staff chat channel |
| **Moderators** | Trusted community members | Moderation category + mod tools |

## Trust levels

Discourse has built-in trust levels (0-4). Use them:

- **Level 0** (New): Just signed up, awaiting approval
- **Level 1** (Basic): Approved member, can post and chat
- **Level 2** (Member): Has been active, earns more permissions automatically
- **Level 3** (Regular): Very active, can recategorise and rename topics
- **Level 4** (Leader): Manually granted, near-moderator powers

Don't over-configure these. The defaults are sensible. The main gate is the approval step at Level 0 → Level 1.
