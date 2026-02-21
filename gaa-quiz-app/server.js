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
- GAA categories (Football, Hurling, Camogie, General GAA): Ask about All-Ireland finals, provincial champions, cup names, referees, venues, rule specifics, famous players, records, and award winners. Be specific about years.
- Irish History: Cover events, figures, dates, treaties, rebellions, political history, cultural history
- Irish Geography: Counties, rivers, lakes, mountains, islands, Irish-language place name translations, provinces, county towns
- World History and World Geography: Major world events, leaders, capitals, rivers, landmarks, wars, treaties
- Irish Current Affairs: A MIX of recent headline events AND standing knowledge with a current flavour. Include: political events, deaths of notable figures, sporting results, media/arts milestones, appointments to positions, anniversaries. Reference specific years. Some questions can be "who currently holds X position" or "what does X acronym stand for" if topical. Not every question needs to be from the last 12 months — some can be timeless knowledge triggered by recent events.
- World Current Affairs: Same mixed approach — headline events (conflicts, elections, natural disasters, deaths of leaders/figures, major incidents) PLUS standing knowledge questions (heads of international organisations, what acronyms stand for, where regular events are held). Reference specific years for events. Include questions about: international organisations (NATO, UN, EU, COP), geopolitics, conflicts, coups, notable deaths, landmark anniversaries, major sporting events. Some questions can reference older events if they were recently topical (e.g. a film or anniversary bringing attention to a historical figure).
- Irish Culture: Theatre, music, literature, festivals, TV, film, Irish language, arts — both historical and recent
- General Knowledge: Science, pop culture, food, entertainment, sport (non-GAA), literature, music, film, nature

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

app.listen(PORT, () => {
  console.log(`GAA Scór Quiz Prep running at http://localhost:${PORT}`);
});
