const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { pool, initDB, seedFromJSON } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "scor2024";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
}));

// ==================
// AUTH MIDDLEWARE
// ==================

async function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT token FROM admin_sessions WHERE token = $1 AND created_at > NOW() - INTERVAL '24 hours'",
      [token]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Auth check failed" });
  }
}

// ==================
// AUTH ROUTES
// ==================

app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  await pool.query("INSERT INTO admin_sessions (token) VALUES ($1)", [token]);
  // Clean up old sessions
  await pool.query(
    "DELETE FROM admin_sessions WHERE created_at < NOW() - INTERVAL '24 hours'"
  );
  res.json({ token });
});

app.post("/api/admin/logout", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token) {
    await pool.query("DELETE FROM admin_sessions WHERE token = $1", [token]);
  }
  res.json({ success: true });
});

app.get("/api/admin/check", requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

// ==================
// HELPER FUNCTIONS
// ==================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getCategories() {
  const { rows } = await pool.query(
    "SELECT id, name FROM categories ORDER BY id"
  );
  return rows;
}

async function pickQuestions(categoryName, count) {
  const catResult = await pool.query(
    "SELECT id FROM categories WHERE name = $1",
    [categoryName]
  );
  if (catResult.rows.length === 0) return [];
  const categoryId = catResult.rows[0].id;

  const regResult = await pool.query(
    "SELECT id, question, answer, translation FROM questions WHERE category_id = $1 AND is_irish = false ORDER BY RANDOM()",
    [categoryId]
  );
  const irishResult = await pool.query(
    "SELECT id, question, answer, translation FROM questions WHERE category_id = $1 AND is_irish = true ORDER BY RANDOM()",
    [categoryId]
  );

  const regular = regResult.rows;
  const irish = irishResult.rows;
  const result = [];
  let regIdx = 0;
  let irishIdx = 0;

  for (let i = 0; i < count; i++) {
    const posInRound = (i % 8) + 1;
    if (posInRound === 8) {
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

// ==================
// PUBLIC API ROUTES
// ==================

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories.map((c) => c.name));
  } catch (err) {
    res.status(500).json({ error: "Failed to load categories" });
  }
});

app.post("/api/generate", async (req, res) => {
  const { categories, mode, count } = req.body;

  if (!categories || !categories.length) {
    return res
      .status(400)
      .json({ error: "At least one category is required" });
  }

  try {
    if (mode === "practice") {
      const numQuestions = count || 5;
      const perCategory = Math.ceil(numQuestions / categories.length);
      let allQuestions = [];

      for (const cat of categories) {
        const qs = await pickQuestions(cat, perCategory);
        qs.forEach((q) => {
          allQuestions.push({ ...q, category: cat });
        });
      }

      allQuestions = shuffle(allQuestions).slice(0, numQuestions);

      const data = allQuestions.map((q, i) => ({
        id: q.id,
        number: i + 1,
        category: q.category,
        question: q.question,
        answer: q.answer,
        is_irish: q.is_irish,
        translation: q.translation || "",
      }));

      return res.json({ mode, data });
    }

    // Quiz mode
    const roundCategories = categories.slice(0, 10);
    const rounds = [];

    for (let idx = 0; idx < roundCategories.length; idx++) {
      const cat = roundCategories[idx];
      const qs = await pickQuestions(cat, 8);
      rounds.push({
        number: idx + 1,
        category: cat,
        questions: qs.map((q, i) => ({
          number: i + 1,
          question: q.question,
          answer: q.answer,
          is_irish: q.is_irish,
          translation: q.translation || "",
        })),
      });
    }

    res.json({ mode, data: { rounds } });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// ==================
// DIFFICULTY RATING
// ==================

app.post("/api/questions/:id/difficulty", async (req, res) => {
  const { rating } = req.body;
  const questionId = parseInt(req.params.id, 10);

  if (!rating || !["easy", "hard"].includes(rating)) {
    return res.status(400).json({ error: "Rating must be 'easy' or 'hard'" });
  }

  try {
    await pool.query(
      "INSERT INTO difficulty_ratings (question_id, rating) VALUES ($1, $2)",
      [questionId, rating]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Difficulty rating error:", err);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// ==================
// FEEDBACK ROUTES
// ==================

app.post("/api/feedback", async (req, res) => {
  const {
    question,
    answer,
    category,
    feedbackType,
    comment,
    suggestedAnswer,
    suggestedQuestion,
    email,
    isAI,
  } = req.body;

  console.log("Feedback received:", JSON.stringify({ question, feedbackType, comment, suggestedAnswer, suggestedQuestion, email }));

  if (!question || !feedbackType) {
    return res
      .status(400)
      .json({ error: "Question and feedback type are required" });
  }

  const id =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  try {
    await pool.query(
      `INSERT INTO feedback (id, question, answer, category, feedback_type, comment, suggested_answer, suggested_question, email, is_ai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        question,
        answer || "",
        category || "",
        feedbackType,
        comment || "",
        suggestedAnswer || "",
        suggestedQuestion || "",
        email || "",
        !!isAI,
      ]
    );
    res.json({ success: true, id, received: { comment, suggestedAnswer, suggestedQuestion, email } });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

app.get("/api/feedback", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM feedback ORDER BY created_at DESC"
    );
    // Map column names for frontend compatibility
    const items = rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      category: r.category,
      feedbackType: r.feedback_type,
      comment: r.comment,
      suggestedAnswer: r.suggested_answer,
      suggestedQuestion: r.suggested_question || "",
      email: r.email || "",
      isAI: r.is_ai,
      resolved: r.resolved,
      timestamp: r.created_at,
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

app.patch("/api/feedback/:id", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE feedback SET resolved = NOT resolved WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update feedback" });
  }
});

app.delete("/api/feedback/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM feedback WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

// ==================
// ADMIN QUESTION MANAGEMENT
// ==================

app.post("/api/questions/remove", requireAdmin, async (req, res) => {
  const { question, category } = req.body;

  if (!question || !category) {
    return res
      .status(400)
      .json({ error: "Question text and category are required" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM questions WHERE question = $1 AND category_id = (SELECT id FROM categories WHERE name = $2)`,
      [question, category]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Question not found in bank" });
    }

    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM questions WHERE category_id = (SELECT id FROM categories WHERE name = $1)",
      [category]
    );

    res.json({ success: true, remaining: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove question" });
  }
});

app.post("/api/questions/edit", requireAdmin, async (req, res) => {
  const { originalQuestion, category, newQuestion, newAnswer } = req.body;

  if (!originalQuestion || !category) {
    return res
      .status(400)
      .json({ error: "Original question and category are required" });
  }

  try {
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (newQuestion) {
      updates.push(`question = $${paramIdx++}`);
      values.push(newQuestion);
    }
    if (newAnswer) {
      updates.push(`answer = $${paramIdx++}`);
      values.push(newAnswer);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    values.push(originalQuestion, category);

    const result = await pool.query(
      `UPDATE questions SET ${updates.join(", ")}
       WHERE question = $${paramIdx++} AND category_id = (SELECT id FROM categories WHERE name = $${paramIdx})`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Question not found in bank" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Edit question error:", err);
    res.status(500).json({ error: "Failed to edit question" });
  }
});

app.post("/api/questions/add", requireAdmin, async (req, res) => {
  const { question, answer, category, isIrish } = req.body;

  if (!question || !answer || !category) {
    return res
      .status(400)
      .json({ error: "Question, answer and category are required" });
  }

  try {
    const catResult = await pool.query(
      "SELECT id FROM categories WHERE name = $1",
      [category]
    );
    if (catResult.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    await pool.query(
      "INSERT INTO questions (category_id, question, answer, is_irish) VALUES ($1, $2, $3, $4)",
      [catResult.rows[0].id, question, answer, !!isIrish]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add question" });
  }
});

// Get all questions (admin only)
app.get("/api/admin/questions", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.question, q.answer, q.is_irish, q.translation, c.name as category,
              COALESCE(d.easy_count, 0)::int as easy_count,
              COALESCE(d.hard_count, 0)::int as hard_count
       FROM questions q
       JOIN categories c ON q.category_id = c.id
       LEFT JOIN (
         SELECT question_id,
                COUNT(*) FILTER (WHERE rating = 'easy') as easy_count,
                COUNT(*) FILTER (WHERE rating = 'hard') as hard_count
         FROM difficulty_ratings
         GROUP BY question_id
       ) d ON d.question_id = q.id
       ORDER BY c.name, q.is_irish, q.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// Get question bank stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const questions = await pool.query(
      `SELECT c.name as category, COUNT(*) as total,
              SUM(CASE WHEN q.is_irish THEN 1 ELSE 0 END) as irish
       FROM questions q JOIN categories c ON q.category_id = c.id
       GROUP BY c.name ORDER BY c.name`
    );
    const feedback = await pool.query(
      "SELECT COUNT(*) as total, SUM(CASE WHEN resolved THEN 1 ELSE 0 END) as resolved FROM feedback"
    );
    const aiQuestions = await pool.query(
      "SELECT COUNT(*) as total, SUM(CASE WHEN added_to_bank THEN 1 ELSE 0 END) as added FROM ai_questions"
    );

    res.json({
      categories: questions.rows,
      feedback: feedback.rows[0],
      aiQuestions: aiQuestions.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// ==================
// AI QUESTION ROUTES
// ==================

app.post("/api/generate-ai", async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res
      .status(400)
      .json({
        error: "ANTHROPIC_API_KEY not configured. Use the question bank instead.",
      });
  }

  const Anthropic = require("@anthropic-ai/sdk").default;
  const client = new Anthropic();

  const { categories, mode, count } = req.body;

  if (!categories || !categories.length) {
    return res
      .status(400)
      .json({ error: "At least one category is required" });
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("en-IE", { month: "long" });

  const SYSTEM_PROMPT = `You are a quiz master for GAA Scór Senior Quiz competitions in Ireland. You generate quiz questions in the exact style used at county, provincial and All-Ireland Scór Tráth na gCeist competitions.

RULES FOR QUESTION STYLE:
- Each round has exactly 8 questions
- Questions are short, direct, and factual with a single definitive answer
- Question 8 in every round MUST be written in Irish (as Gaeilge). The answer can be in English or Irish as appropriate.
- Answers should be concise — typically a name, place, year, or short phrase
- Do NOT include multiple-choice options — these are open-answer questions

DIFFICULTY — THIS IS CRITICAL:
Questions must be at genuine Scór competition standard. They should test real knowledge, not just surface-level facts. Here are examples of the right difficulty level:
- "What is the name of the All-Ireland Minor Football Championship cup?" → "Tom Markham Cup"
- "What county plays home games at Páirc Seán Mac Diarmada?" → "Leitrim"
- "What year did the GAA allow soccer and rugby at Croke Park?" → "2007"
- "What is the official capacity of Croke Park?" → "82,300"
- "Who was the first GAA President?" → "Maurice Davin"
- "What county won the first Ladies All-Ireland Senior Football title in 1974?" → "Tipperary"

Avoid questions that are too obvious (e.g. "What sport uses a sliotar?" or "How many players on a GAA team?"). Focus on specific grounds, cup names, historical years, records, captains, managers, county nicknames, and detailed knowledge that a well-prepared Scór team would need to study for.

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
    "is_irish": false,
    "translation": ""
  }
]

Set "is_irish" to true if the question is written in Irish. For every 8 questions, question 8 should be as Gaeilge. For Irish-language questions, provide an English translation of the question in the "translation" field. Leave "translation" as an empty string for English questions.`;
  } else {
    const roundCategories = categories.slice(0, 10);
    userPrompt = `Generate a full Scór-style quiz with one round for each of the following categories (in this order):
${roundCategories.map((c, i) => `Round ${i + 1}: ${c}`).join("\n")}

Each round has exactly 8 questions. Question 8 in each round must be as Gaeilge (in Irish).

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
          "is_irish": false,
          "translation": ""
        }
      ]
    }
  ]
}

Set "is_irish" to true for questions written in Irish. For Irish-language questions, provide an English translation of the question in the "translation" field. Leave "translation" as an empty string for English questions.`;
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
    const jsonMatch =
      fullText.match(/\[[\s\S]*\]/) || fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.end(JSON.stringify({ error: "Failed to parse quiz data" }));
      return;
    }

    const data = JSON.parse(jsonMatch[0]);

    // Store AI-generated questions for review
    try {
      let questionsToStore;
      if (mode === "practice") {
        // Map AI category names back to the requested category names
        questionsToStore = data.map((q) => {
          const matched = categories.find((c) => c.toLowerCase().includes((q.category || "").toLowerCase()) || (q.category || "").toLowerCase().includes(c.toLowerCase()));
          return { ...q, category: matched || q.category || "" };
        });
      } else {
        // Use the requested category names, not the AI's response
        questionsToStore = data.rounds?.flatMap((r, i) => {
          const requestedCategory = categories[i] || r.category;
          return r.questions.map((q) => ({ ...q, category: requestedCategory }));
        }) || [];
      }

      for (const q of questionsToStore) {
        await pool.query(
          "INSERT INTO ai_questions (category, question, answer, is_irish) VALUES ($1, $2, $3, $4)",
          [q.category || "", q.question, q.answer, !!q.is_irish]
        );
      }
    } catch (storeErr) {
      console.error("Failed to store AI questions:", storeErr);
    }

    res.end(JSON.stringify({ mode, data }));
  } catch (err) {
    clearInterval(keepAlive);
    console.error("Claude API error:", err.message);
    res.end(
      JSON.stringify({
        error: "Failed to generate questions. Check your ANTHROPIC_API_KEY.",
      })
    );
  }
});

// ==================
// AI QUESTION MANAGEMENT (admin)
// ==================

app.get("/api/admin/ai-questions", requireAdmin, async (req, res) => {
  try {
    const { rows: questions } = await pool.query(
      "SELECT * FROM ai_questions ORDER BY created_at DESC"
    );
    // Attach any feedback for each AI question
    const { rows: feedback } = await pool.query(
      "SELECT * FROM feedback WHERE is_ai = true ORDER BY created_at DESC"
    );
    const feedbackByQuestion = {};
    feedback.forEach((f) => {
      if (!feedbackByQuestion[f.question]) feedbackByQuestion[f.question] = [];
      feedbackByQuestion[f.question].push({
        id: f.id,
        feedbackType: f.feedback_type,
        comment: f.comment,
        suggestedAnswer: f.suggested_answer,
        suggestedQuestion: f.suggested_question || "",
        resolved: f.resolved,
      });
    });
    const result = questions.map((q) => ({
      ...q,
      feedback: feedbackByQuestion[q.question] || [],
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to load AI questions" });
  }
});

// Bulk import questions into ai_questions table
app.post("/api/admin/ai-questions/bulk-import", requireAdmin, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "No questions provided" });
  }
  try {
    let imported = 0;
    let skipped = 0;
    for (const q of questions) {
      if (!q.question || !q.answer || !q.category) { skipped++; continue; }
      // Skip duplicates
      const { rows } = await pool.query(
        "SELECT id FROM ai_questions WHERE question = $1 LIMIT 1",
        [q.question]
      );
      if (rows.length > 0) { skipped++; continue; }
      await pool.query(
        "INSERT INTO ai_questions (category, question, answer, is_irish, rating) VALUES ($1, $2, $3, $4, $5)",
        [q.category, q.question, q.answer, !!q.is_irish, q.rating || 5]
      );
      imported++;
    }
    res.json({ success: true, imported, skipped });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({ error: "Failed to import questions" });
  }
});

// Edit an AI question from feedback — finds by text or creates a new ai_questions entry
app.post("/api/admin/ai-feedback/edit", requireAdmin, async (req, res) => {
  const { originalQuestion, category, newQuestion, newAnswer } = req.body;
  if (!originalQuestion || (!newQuestion && !newAnswer)) {
    return res.status(400).json({ error: "Original question and changes required" });
  }
  try {
    // Try to find existing AI question
    const { rows } = await pool.query(
      "SELECT * FROM ai_questions WHERE question = $1 ORDER BY created_at DESC LIMIT 1",
      [originalQuestion]
    );
    if (rows.length > 0) {
      // Update existing
      const updates = [];
      const values = [];
      let idx = 1;
      if (newQuestion) { updates.push(`question = $${idx++}`); values.push(newQuestion); }
      if (newAnswer) { updates.push(`answer = $${idx++}`); values.push(newAnswer); }
      values.push(rows[0].id);
      await pool.query(`UPDATE ai_questions SET ${updates.join(", ")} WHERE id = $${idx}`, values);
    }
    // Either way, resolve successfully — the feedback itself records the correction
    res.json({ success: true });
  } catch (err) {
    console.error("Edit AI feedback error:", err);
    res.status(500).json({ error: "Failed to edit AI question" });
  }
});

// Add an AI question to bank from feedback — finds by text or adds directly
app.post("/api/admin/ai-feedback/add-to-bank", requireAdmin, async (req, res) => {
  const { question, answer, category, is_irish } = req.body;
  if (!question || !answer || !category) {
    return res.status(400).json({ error: "Question, answer, and category required" });
  }
  try {
    // Find or create category
    let catResult = await pool.query("SELECT id FROM categories WHERE name = $1", [category]);
    if (catResult.rows.length === 0) {
      catResult = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [category]);
    }
    // Add to question bank
    await pool.query(
      "INSERT INTO questions (category_id, question, answer, is_irish) VALUES ($1, $2, $3, $4)",
      [catResult.rows[0].id, question, answer, !!is_irish]
    );
    // Mark AI question as added if it exists
    await pool.query("UPDATE ai_questions SET added_to_bank = true WHERE question = $1", [question]);
    res.json({ success: true });
  } catch (err) {
    console.error("Add AI to bank error:", err);
    res.status(500).json({ error: "Failed to add to bank" });
  }
});

app.post("/api/admin/ai-questions/:id/edit", requireAdmin, async (req, res) => {
  const { question, answer } = req.body;
  if (!question && !answer) {
    return res.status(400).json({ error: "No changes provided" });
  }
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (question) { updates.push(`question = $${idx++}`); values.push(question); }
    if (answer) { updates.push(`answer = $${idx++}`); values.push(answer); }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE ai_questions SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Edit AI question error:", err);
    res.status(500).json({ error: "Failed to edit AI question" });
  }
});

app.post("/api/admin/ai-questions/:id/rate", requireAdmin, async (req, res) => {
  const { rating } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE ai_questions SET rating = $1 WHERE id = $2 RETURNING *",
      [rating, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to rate question" });
  }
});

app.post("/api/admin/ai-questions/:id/add-to-bank", requireAdmin, async (req, res) => {
  try {
    // Get the AI question
    const { rows } = await pool.query(
      "SELECT * FROM ai_questions WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    const q = rows[0];

    // Find or create the category
    let catResult = await pool.query(
      "SELECT id FROM categories WHERE name = $1",
      [q.category]
    );
    if (catResult.rows.length === 0) {
      catResult = await pool.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING id",
        [q.category]
      );
    }

    // Add to question bank
    await pool.query(
      "INSERT INTO questions (category_id, question, answer, is_irish) VALUES ($1, $2, $3, $4)",
      [catResult.rows[0].id, q.question, q.answer, q.is_irish]
    );

    // Mark as added
    await pool.query(
      "UPDATE ai_questions SET added_to_bank = true WHERE id = $1",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Add to bank error:", err);
    res.status(500).json({ error: "Failed to add question to bank" });
  }
});

app.delete("/api/admin/ai-questions/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM ai_questions WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete AI question" });
  }
});

// ==================
// PUBLIC QUESTION UPLOAD
// ==================

app.post("/api/upload-questions", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "No questions provided" });
  }
  if (questions.length > 100) {
    return res.status(400).json({ error: "Maximum 100 questions per upload" });
  }
  try {
    let imported = 0;
    let skipped = 0;
    for (const q of questions) {
      if (!q.question || !q.answer || !q.category) { skipped++; continue; }
      // Skip duplicates
      const { rows } = await pool.query(
        "SELECT id FROM ai_questions WHERE question = $1 LIMIT 1",
        [q.question]
      );
      if (rows.length > 0) { skipped++; continue; }
      await pool.query(
        "INSERT INTO ai_questions (category, question, answer, is_irish, rating, source) VALUES ($1, $2, $3, $4, 0, 'user')",
        [q.category, q.question, q.answer, !!q.is_irish]
      );
      imported++;
    }
    res.json({ success: true, imported, skipped });
  } catch (err) {
    console.error("Public upload error:", err);
    res.status(500).json({ error: "Failed to upload questions" });
  }
});

// ==================
// GENERAL FEEDBACK
// ==================

app.post("/api/general-feedback", async (req, res) => {
  const { name, email, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }
  try {
    await pool.query(
      "INSERT INTO general_feedback (name, email, message) VALUES ($1, $2, $3)",
      [name || "", email || "", message.trim()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("General feedback error:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

app.get("/api/general-feedback", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM general_feedback ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

app.delete("/api/general-feedback/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM general_feedback WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Fallback: serve index.html for any unmatched route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================
// STARTUP
// ==================

async function start() {
  try {
    await initDB();

    // Seed from JSON file if database is empty
    const questionBankPath = path.join(__dirname, "question-bank.json");
    if (fs.existsSync(questionBankPath)) {
      const questionBank = JSON.parse(
        fs.readFileSync(questionBankPath, "utf-8")
      );
      await seedFromJSON(questionBank);
    }

    // Merge split/misnamed categories across all tables
    try {
      const categoryMerges = {
        "World History": "World History and World Geography",
        "World Geography": "World History and World Geography",
        "General GAA": "General G.A.A.",
      };
      for (const [oldName, mergedName] of Object.entries(categoryMerges)) {
        // Merge in ai_questions
        const { rowCount: aiCount } = await pool.query(
          "UPDATE ai_questions SET category = $1 WHERE category = $2",
          [mergedName, oldName]
        );
        if (aiCount > 0) console.log(`Merged ${aiCount} ai_questions from "${oldName}" into "${mergedName}"`);
        // Merge in feedback
        await pool.query(
          "UPDATE feedback SET category = $1 WHERE category = $2",
          [mergedName, oldName]
        );
        // Merge in categories table (move questions, then delete old category)
        const oldCat = await pool.query("SELECT id FROM categories WHERE name = $1", [oldName]);
        const mergedCat = await pool.query("SELECT id FROM categories WHERE name = $1", [mergedName]);
        if (oldCat.rows.length > 0 && mergedCat.rows.length > 0) {
          await pool.query(
            "UPDATE questions SET category_id = $1 WHERE category_id = $2",
            [mergedCat.rows[0].id, oldCat.rows[0].id]
          );
          await pool.query("DELETE FROM categories WHERE id = $1", [oldCat.rows[0].id]);
          console.log(`Merged category "${oldName}" into "${mergedName}" in categories table`);
        } else if (oldCat.rows.length > 0 && mergedCat.rows.length === 0) {
          // Just rename the old category
          await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [mergedName, oldCat.rows[0].id]);
          console.log(`Renamed category "${oldName}" to "${mergedName}"`);
        }
      }
    } catch (err) {
      console.error("Category merge error:", err);
    }

    // Seed Scór revision questions into ai_questions
    const scorQuestionsPath = path.join(__dirname, "scor-questions.json");
    if (fs.existsSync(scorQuestionsPath)) {
      try {
        const scorQuestions = JSON.parse(fs.readFileSync(scorQuestionsPath, "utf-8"));
        let imported = 0;
        for (const q of scorQuestions) {
          const { rows } = await pool.query(
            "SELECT id FROM ai_questions WHERE question = $1 LIMIT 1",
            [q.question]
          );
          if (rows.length === 0) {
            await pool.query(
              "INSERT INTO ai_questions (category, question, answer, is_irish, rating) VALUES ($1, $2, $3, $4, $5)",
              [q.category, q.question, q.answer, !!q.is_irish, q.rating || 5]
            );
            imported++;
          }
        }
        if (imported > 0) console.log(`Imported ${imported} Scór revision questions`);
      } catch (err) {
        console.error("Failed to import Scór questions:", err);
      }
    }

    app.listen(PORT, () => {
      console.log(`GAA Scór Quiz Prep running at http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
