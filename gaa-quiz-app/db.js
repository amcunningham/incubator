const { Pool } = require("pg");
const dns = require("dns");
const net = require("net");

// Force IPv4 to avoid ENETUNREACH on Render (no IPv6 support)
dns.setDefaultResultOrder("ipv4first");

// Override dns.lookup to always request IPv4
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === "number") {
    options = { family: 4 };
  } else {
    options = Object.assign({}, options, { family: 4 });
  }
  return originalLookup.call(dns, hostname, options, callback);
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_irish BOOLEAN DEFAULT false,
        translation TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT DEFAULT '',
        category TEXT DEFAULT '',
        feedback_type TEXT NOT NULL,
        comment TEXT DEFAULT '',
        suggested_answer TEXT DEFAULT '',
        suggested_question TEXT DEFAULT '',
        email TEXT DEFAULT '',
        is_ai BOOLEAN DEFAULT false,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_questions (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_irish BOOLEAN DEFAULT false,
        translation TEXT DEFAULT '',
        rating INTEGER DEFAULT 0,
        added_to_bank BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS difficulty_ratings (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        rating TEXT NOT NULL CHECK (rating IN ('easy', 'hard')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS general_feedback (
        id SERIAL PRIMARY KEY,
        name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // Add translation column if missing (migration for existing databases)
    await client.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT '';
      ALTER TABLE ai_questions ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT '';
      ALTER TABLE ai_questions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS suggested_question TEXT DEFAULT '';
      ALTER TABLE general_feedback ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
    `);

    console.log("Database tables initialized");
  } finally {
    client.release();
  }
}

async function seedFromJSON(questionBank) {
  const client = await pool.connect();
  try {
    // Check if we already have questions
    const { rows } = await client.query("SELECT COUNT(*) FROM questions");
    if (parseInt(rows[0].count) > 0) {
      // Backfill translations for existing Irish questions that have none
      await backfillTranslations(client, questionBank);
      // Remove duplicate questions (keep the oldest entry)
      const { rowCount } = await client.query(`
        DELETE FROM questions WHERE id NOT IN (
          SELECT MIN(id) FROM questions GROUP BY question
        )
      `);
      if (rowCount > 0) console.log(`Removed ${rowCount} duplicate questions from bank`);
      console.log("Database already seeded, skipping");
      return;
    }

    console.log("Seeding database from question bank...");
    await client.query("BEGIN");

    for (const [categoryName, data] of Object.entries(questionBank)) {
      // Insert category
      const catResult = await client.query(
        "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id",
        [categoryName]
      );
      const categoryId = catResult.rows[0].id;

      // Insert regular questions
      for (const q of data.questions) {
        await client.query(
          "INSERT INTO questions (category_id, question, answer, is_irish) VALUES ($1, $2, $3, false)",
          [categoryId, q.question, q.answer]
        );
      }

      // Insert irish questions
      for (const q of data.irish_questions) {
        await client.query(
          "INSERT INTO questions (category_id, question, answer, is_irish, translation) VALUES ($1, $2, $3, true, $4)",
          [categoryId, q.question, q.answer, q.translation || ""]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function backfillTranslations(client, questionBank) {
  let updated = 0;
  for (const [categoryName, data] of Object.entries(questionBank)) {
    for (const q of data.irish_questions) {
      if (!q.translation) continue;
      const result = await client.query(
        `UPDATE questions SET translation = $1
         WHERE question = $2 AND is_irish = true AND (translation IS NULL OR translation = '')`,
        [q.translation, q.question]
      );
      updated += result.rowCount;
    }
  }
  if (updated > 0) {
    console.log(`Backfilled translations for ${updated} Irish questions`);
  }
}

module.exports = { pool, initDB, seedFromJSON };
