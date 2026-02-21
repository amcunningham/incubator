const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Load question bank
const questionBank = JSON.parse(
  fs.readFileSync(path.join(__dirname, "question-bank.json"), "utf-8")
);

const CATEGORIES = Object.keys(questionBank);

// Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random questions from a category (8 regular + 2 Irish per 10)
function pickQuestions(category, count) {
  const bank = questionBank[category];
  if (!bank) return [];

  const regular = shuffle(bank.questions);
  const irish = shuffle(bank.irish_questions);

  const result = [];
  let regIdx = 0;
  let irishIdx = 0;

  for (let i = 0; i < count; i++) {
    // Questions 9 and 10 of every set of 10 should be Irish
    const posInRound = (i % 10) + 1;
    if (posInRound >= 9) {
      if (irishIdx < irish.length) {
        result.push({ ...irish[irishIdx], is_irish: true });
        irishIdx++;
      } else if (regIdx < regular.length) {
        result.push({ ...regular[regIdx], is_irish: false });
        regIdx++;
      }
    } else {
      if (regIdx < regular.length) {
        result.push({ ...regular[regIdx], is_irish: false });
        regIdx++;
      } else if (irishIdx < irish.length) {
        result.push({ ...irish[irishIdx], is_irish: true });
        irishIdx++;
      }
    }
  }

  return result;
}

app.get("/api/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Question bank endpoint (instant, no API key needed)
app.post("/api/generate", (req, res) => {
  const { categories, mode, count } = req.body;

  if (!categories || !categories.length) {
    return res.status(400).json({ error: "At least one category is required" });
  }

  if (mode === "practice") {
    const numQuestions = count || 5;
    // Spread questions across selected categories
    const perCategory = Math.ceil(numQuestions / categories.length);
    let allQuestions = [];

    categories.forEach((cat) => {
      const qs = pickQuestions(cat, perCategory);
      qs.forEach((q) => {
        allQuestions.push({ ...q, category: cat });
      });
    });

    // Shuffle and trim to requested count
    allQuestions = shuffle(allQuestions).slice(0, numQuestions);

    // Number them
    const data = allQuestions.map((q, i) => ({
      number: i + 1,
      category: q.category,
      question: q.question,
      answer: q.answer,
      is_irish: q.is_irish,
    }));

    return res.json({ mode, data });
  }

  // Quiz mode — full rounds
  const roundCategories = categories.slice(0, 10);
  const rounds = roundCategories.map((cat, idx) => {
    const qs = pickQuestions(cat, 10);
    return {
      number: idx + 1,
      category: cat,
      questions: qs.map((q, i) => ({
        number: i + 1,
        question: q.question,
        answer: q.answer,
        is_irish: q.is_irish,
      })),
    };
  });

  res.json({ mode, data: { rounds } });
});

// AI-generated questions endpoint (requires ANTHROPIC_API_KEY)
app.post("/api/generate-ai", async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: "ANTHROPIC_API_KEY not configured. Use the question bank instead." });
  }

  const Anthropic = require("@anthropic-ai/sdk").default;
  const client = new Anthropic();

  const { categories, mode, count } = req.body;

  if (!categories || !categories.length) {
    return res.status(400).json({ error: "At least one category is required" });
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("en-IE", { month: "long" });

  const SYSTEM_PROMPT = `You are a quiz master for GAA Scór Senior Quiz competitions in Ireland. You generate quiz questions in the exact style used at county, provincial and All-Ireland Scór Tráth na gCeist competitions.

RULES FOR QUESTION STYLE:
- Each round has exactly 10 questions
- Questions are short, direct, and factual with a single definitive answer
- Questions 9 and 10 in every round MUST be written in Irish (as Gaeilge). The answer can be in English or Irish as appropriate.
- Answers should be concise — typically a name, place, year, or short phrase
- Do NOT include multiple-choice options — these are open-answer questions

DIFFICULTY: Accessible but requiring genuine knowledge. Not pub-quiz easy, not academic-level hard. A well-prepared Scór team should get 7-8 out of 10.

IMPORTANT: Vary the questions each time. Do not repeat questions. Be creative and cover different aspects of each category.`;

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

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Transfer-Encoding", "chunked");
  const keepAlive = setInterval(() => res.write(" "), 5000);

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

    clearInterval(keepAlive);

    const fullText = chunks.join("");
    const jsonMatch = fullText.match(/\[[\s\S]*\]/) || fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.end(JSON.stringify({ error: "Failed to parse quiz data" }));
      return;
    }

    const data = JSON.parse(jsonMatch[0]);
    res.end(JSON.stringify({ mode, data }));
  } catch (err) {
    clearInterval(keepAlive);
    console.error("Claude API error:", err.message);
    res.end(JSON.stringify({ error: "Failed to generate questions. Check your ANTHROPIC_API_KEY." }));
  }
});

// Fallback: serve index.html for any unmatched route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`GAA Scór Quiz Prep running at http://localhost:${PORT}`);
});
