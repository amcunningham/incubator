const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new Anthropic();

const CATEGORIES = [
  "Gaelic and Ladies Football",
  "Hurling and Camogie",
  "General G.A.A.",
  "Irish History",
  "World History and World Geography",
  "Irish Geography",
  "Irish Current Affairs",
  "World Current Affairs",
  "Irish Culture",
  "General Knowledge",
];

const SYSTEM_PROMPT = `You are a quiz master for GAA Scór Senior Quiz competitions in Ireland. You generate quiz questions in the exact style used at county, provincial and All-Ireland Scór Tráth na gCeist competitions.

RULES FOR QUESTION STYLE:
- Each round has exactly 10 questions
- Questions are short, direct, and factual with a single definitive answer
- Questions 9 and 10 in every round MUST be written in Irish (as Gaeilge). The answer can be in English or Irish as appropriate.
- Answers should be concise — typically a name, place, year, or short phrase
- Do NOT include multiple-choice options — these are open-answer questions

CATEGORY-SPECIFIC GUIDANCE:

- Gaelic and Ladies Football: Ask about All-Ireland finals (winners, losers, scores, venues), provincial champions, Sam Maguire and Brendan Martin Cup, referees and their home counties, specific grounds and where they are ("Where is Parnell Park?"), player transfers, management appointments and departures, All-Stars, Footballer of the Year, records (top scorers, most titles), Tailteann Cup, congress venues. Link players to counties. Be specific about years.

- Hurling and Camogie: Same depth — Liam MacCarthy Cup, O'Duffy Cup, All-Ireland finals by year, referees and their counties, current managers, all-time top scorers, All-Stars and which counties won them, Christy Ring Cup, Joe McDonagh Cup. Ask "X and Y play for what county", "What county has won the most O'Duffy Cups", "Who is the current X manager". Link players to clubs and counties.

- General G.A.A.: Cross-code questions covering football, hurling, camogie, handball, rounders. Ask about: the Poc Fada and where it's held, GAA congress venues, GAA grounds and their locations ("Where would one find McGovern Park?"), how many Sam Maguire cups a county has won, GAA organisational structure, sponsors ("What company sponsors the All-Stars?"), former players' careers outside GAA, the Tailteann Cup, rule changes. Include questions like "What GAA game is similar to baseball?" (rounders).

- Irish History: Cover events, figures, dates, treaties, rebellions, political history, cultural history, War of Independence, Civil War, 1916 Rising, Famine, land wars, Home Rule, partition, notable figures and their roles.

- Irish Geography: Rivers and what towns are built on them ("On what river is Ballina, Co. Mayo?"), Irish-language place name translations ("What is the English for Neidín?"), islands and how they connect to the mainland (cable cars, ferries), ferry routes ("From where in Clare do ferries travel to the Aran Islands?"), county borders ("How many counties border County Laois?"), superlatives (largest lake, highest mountain, longest river), mountain locations, lighthouses, bodies of water terminology (estuary), provinces, county towns. Mix well-known and obscure.

- World History and World Geography: Major world events, leaders, capitals, rivers, landmarks, wars, treaties, empires, revolutions, famous explorers and their achievements.

- Irish Current Affairs: A MIX of recent headline events AND standing knowledge with a current flavour. Include: political events, deaths of notable figures, sporting results, media/arts milestones, appointments to positions, anniversaries. Reference specific years. Some questions can be "who currently holds X position" or "what does X acronym stand for" if topical. Not every question needs to be from the last 12 months — some can be timeless knowledge triggered by recent events.

- World Current Affairs: Same mixed approach — headline events (conflicts, elections, natural disasters, deaths of leaders/figures, major incidents) PLUS standing knowledge questions (heads of international organisations, what acronyms stand for, where regular events are held). Reference specific years for events. Include questions about: international organisations (NATO, UN, EU, COP), geopolitics, conflicts, coups, notable deaths, landmark anniversaries, major sporting events. Some questions can reference older events if they were recently topical (e.g. a film or anniversary bringing attention to a historical figure).

- Irish Culture: Very broad category. Include: theatres and where they are ("Where is the Belltable Theatre?"), authors and their books, poets and their poems, songwriters ("Who wrote 'Ireland's Call'?"), music groups and their members (Chieftains, Dubliners etc.), TV programme creators, film, festivals, horse racing venues (Punchestown, Fairyhouse), show jumping figures, Irish Traveller culture (Shelta/Cant), organisations and their headquarters, cultural figures and their connections ("Nora Barnacle was married to whom?"), national institutions (ICA, Abbey Theatre). Mix historical and recent.

- General Knowledge: Science, pop culture, food, entertainment, sport (non-GAA), literature, music, film, nature, space, inventions, famous quotes and who said them.

DIFFICULTY: Accessible but requiring genuine knowledge. Not pub-quiz easy, not academic-level hard. A well-prepared Scór team should get 7-8 out of 10.

IMPORTANT: Vary the questions each time. Do not repeat questions. Be creative and cover different aspects of each category.`;

app.get("/api/categories", (req, res) => {
  res.json(CATEGORIES);
});

app.post("/api/generate", async (req, res) => {
  const { categories, mode, count } = req.body;

  if (!categories || !categories.length) {
    return res.status(400).json({ error: "At least one category is required" });
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("en-IE", { month: "long" });

  let userPrompt;

  if (mode === "practice") {
    const numQuestions = count || 5;
    const categoryList = categories.join(", ");
    userPrompt = `Generate ${numQuestions} practice questions from the following categories: ${categoryList}.

Mix the categories randomly. For each question, provide the category it belongs to.

Today's date is ${currentMonth} ${currentYear}. For current affairs categories, questions should relate to events in the past 12 months.

Return your response as a JSON array with this exact structure:
[
  {
    "number": 1,
    "category": "Category Name",
    "question": "The question text",
    "answer": "The answer",
    "is_irish": false
  }
]

Set "is_irish" to true if the question is written in Irish. For every 10 questions, questions 9 and 10 should be as Gaeilge.`;
  } else {
    // Quiz mode — full rounds
    const roundCategories = categories.slice(0, 10);
    userPrompt = `Generate a full Scór-style quiz with one round for each of the following categories (in this order):
${roundCategories.map((c, i) => `Round ${i + 1}: ${c}`).join("\n")}

Each round has exactly 10 questions. Questions 9 and 10 in each round must be as Gaeilge (in Irish).

Today's date is ${currentMonth} ${currentYear}. For current affairs categories, questions should relate to events in the past 12 months.

Return your response as a JSON object with this exact structure:
{
  "rounds": [
    {
      "number": 1,
      "category": "Category Name",
      "questions": [
        {
          "number": 1,
          "question": "The question text",
          "answer": "The answer",
          "is_irish": false
        }
      ]
    }
  ]
}

Set "is_irish" to true for questions written in Irish.`;
  }

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const chunks = [];
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        chunks.push(event.delta.text);
      }
    }

    const fullText = chunks.join("");

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = fullText.match(/\[[\s\S]*\]/) || fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to parse quiz data" });
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json({ mode, data });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.status(500).json({ error: "Failed to generate questions. Check your ANTHROPIC_API_KEY." });
  }
});

// Fallback: serve index.html for any unmatched route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`GAA Scór Quiz Prep running at http://localhost:${PORT}`);
});
