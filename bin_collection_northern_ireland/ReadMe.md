Bin Collection - Northern Ireland
=========

Tell me when to put my bins out, and which ones.

Enter your address (or postcode + street), pick your council, and get your upcoming bin collection dates with colour/type reminders.

#### Why?

Every council in Northern Ireland has its own website, its own lookup tool, and its own way of presenting the information. Some have apps, some have downloadable PDFs, some just have web forms. None of them talk to each other.

Northern Ireland is uniquely suited to a unified bin app because there are **only 11 councils** (since the 2015 local government reform). That's a manageable number to build and maintain integrations for, unlike England's 300+ councils.

People just want a simple answer: _what bin do I put out this week, and when?_

#### Why Northern Ireland first (and maybe only)?

- Only 11 councils to integrate vs 300+ in England, 32 in Scotland, 22 in Wales
- Most councils already have online lookup tools to work with
- Several councils share service providers (e.g. Bryson Recycling), reducing unique integrations
- Small enough to build, test, and maintain as a side project

### Minimum viable implementation feature list
_(don't add nice-to-haves to this list!)_

1. User enters postcode and selects their street/address
2. App determines which council area they're in
3. App shows their next bin collection date(s)
4. App shows which bin type(s) to put out (with colour coding)
5. Works on mobile browsers (responsive web app)

### Data sources - the 11 councils

| Council | Current lookup | Notes |
|---|---|---|
| Antrim & Newtownabbey | antrimandnewtownabbey.gov.uk/binchecker | Street-based lookup |
| Ards & North Down | ardsandnorthdown.gov.uk | Online lookup |
| Armagh City, Banbridge & Craigavon | armaghbanbridgecraigavon.gov.uk | Online lookup |
| Belfast | belfastcity.gov.uk/bins/collections | Also has Bin-Ovation app |
| Causeway Coast & Glens | causewaycoastandglens.gov.uk | Online lookup |
| Derry City & Strabane | recycling.derrystrabane.com | Calendar download + online |
| Fermanagh & Omagh | fermanaghomagh.com | Online lookup |
| Lisburn & Castlereagh | lisburncastlereagh.gov.uk | Online lookup |
| Mid & East Antrim | midandeastantrim.gov.uk | Online lookup |
| Mid Ulster | midulstercouncil.org | Online lookup |
| Newry, Mourne & Down | newrymournedown.org | Postcode-based checker |

### Tech spec basics
_(platforms, programming languages, infrastructure)_

- **Approach**: Responsive web app (mobile-first, works everywhere)
- **Frontend**: Simple HTML/CSS/JS or lightweight framework (e.g. Svelte, plain React)
- **Backend**: Node.js or Python - needed for scraping/proxying council data
- **Data strategy**: Scrape or reverse-engineer council lookup endpoints; cache results; update schedules periodically
- **Hosting**: Low cost - Vercel, Fly.io, or similar
- **No app store needed** for MVP - just a fast mobile website

### Risks and challenges

- Council websites may change without notice, breaking scrapers
- Some councils may use CAPTCHAs or anti-scraping measures
- Data accuracy - need to handle bank holiday schedule changes
- Potential concerns from councils about scraping (though it's public data)
- Maintenance burden: 11 integrations to keep working

### Active contributors
#### Users

#### Build team

### Current top naming suggestions
_useful as a sanity check for your minimum viable implementation_

- Bin Night NI
- BinDay
- Which Bin NI

### TODO list of next-steps
- technical
  - survey all 11 council websites and document their lookup mechanisms (forms, APIs, calendar downloads)
  - identify which councils share backend providers (reduces integration work)
  - build a proof-of-concept scraper for one council (Belfast or Antrim & Newtownabbey look simplest)
  - check for existing open data on opendatani.gov.uk
- user research
  - talk to people in NI about how they currently find out their bin day
  - find out what information matters most (just the date? bin colour? what goes in each bin?)
  - understand if reminders/notifications are a must-have or nice-to-have
- user testing
- visual design
  - keep it dead simple - ideally one screen with the answer
  - use bin colours that match what councils actually use
- text
