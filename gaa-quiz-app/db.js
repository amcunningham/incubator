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

module.exports = { pool, initDB };
