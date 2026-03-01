Community Forum Toolkit
=========

An open source template and playbook for setting up community forums for GP practices, neighbourhoods, and local health communities — starting with Northern Ireland.

People have been getting by with Facebook groups and WhatsApp, but Facebook is losing trust and WhatsApp is only good for lightweight conversation. The holy grail is something that feels as lightweight as a WhatsApp stream but also has threaded, deeper possibility — and that the community actually owns.

This project provides a replicable, forkable toolkit so any neighbourhood or practice can stand up their own community space without starting from scratch.

#### Why?

- Facebook groups are controlled by a corporation, not the community
- WhatsApp chats disappear and can't be searched
- Local communities need a mix of lightweight chat AND deeper threaded discussion
- GP practices and neighbourhoods share common needs that can be templated
- Working and learning in the open means others benefit from what we figure out

### What's in the toolkit

1. **Platform comparison** — research on forum options (Discourse, Flarum, Zulip, etc.)
2. **Discourse setup template** — category structure, permissions, and settings for a health/neighbourhood community
3. **Weeknotes & learning-in-the-open guide** — conventions for documenting what you're doing, what's working, and what isn't
4. **Using LLMs for weeknotes** — practical patterns for using AI to reduce the friction of writing up weeknotes, summaries, and public outputs
5. **Local LLM setup** — how to run Discourse's built-in AI features with a self-hosted model so no data leaves your server
6. **Moderation and onboarding playbook** — how to welcome non-technical users and keep the space safe

### Key design decisions

- **Not for clinical discussions** — this is community, not clinical. No patient data. Clinical conversations belong in NHS systems (EMIS, SystmOne, AccuRx)
- **Learning in the open** — weeknotes and outputs are public so others can learn from them. Honest retrospectives can be members-only so people feel safe being candid
- **Closed conversations where needed** — private groups for practice staff, coordinators, and sensitive topics. Public-by-default, private-where-it-matters
- **Low friction** — if it's harder than WhatsApp, people won't use it. The lightweight stream matters as much as the threaded depth

### Minimum viable implementation feature list
_(don't add nice-to-haves to this list!)_

1. A running Discourse instance with category structure and permissions configured
2. Public weeknotes/blog category for working in the open
3. Public outputs/resources category for sharing what you've learned
4. Members-only general chat (lightweight stream)
5. Members-only retrospectives (safe space for honest reflection)
6. Staff/coordinators private category
7. Onboarding guide for new (non-technical) members
8. A README and setup guide so another community can fork and replicate

### Tech spec basics

- Discourse (self-hosted or free community hosting)
- Configuration as code where possible (category/permissions templates)
- Documentation in markdown

### Active contributors

#### Users
- GP practices and neighbourhood communities in Northern Ireland (first pilot)
- NHS Hack Day community

#### Build team
- _your name here_ — come to NHS Hack Day!

### Links

- Discourse: https://www.discourse.org
- Free hosting application: https://free.discourse.group
- NHS Hack Day: http://nhshackday.com

### TODO list of next-steps

- technical
  - [ ] Apply for free Discourse community hosting
  - [ ] Set up Discourse instance with category template
  - [ ] Configure permissions model
  - [ ] Choose and apply a theme
- user research
  - [ ] Talk to 3-5 people currently running neighbourhood Facebook groups in NI
  - [ ] Talk to GP practice managers about what community communication they need
  - [ ] Understand what makes people stop using Facebook groups
- user testing
  - [ ] Pilot with one neighbourhood / practice
  - [ ] Test onboarding flow with non-technical users
- visual design
  - [ ] Simple, accessible theme (not techy-looking)
- text
  - [ ] Community guidelines
  - [ ] Onboarding welcome message
  - [ ] Weeknotes template
