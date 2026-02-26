const request = require("supertest");

// Mock the database pool before requiring server
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();

jest.mock("../db", () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
  },
  initDB: jest.fn(),
  seedFromJSON: jest.fn(),
}));

const { app } = require("../server");

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================
// SECURITY HEADERS
// ==================

describe("Security headers", () => {
  it("should set X-Content-Type-Options header", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should set X-Frame-Options header", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("should set Content-Security-Policy header", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
  });

  it("should remove X-Powered-By header", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

// ==================
// AUTH ROUTES
// ==================

describe("POST /api/admin/login", () => {
  it("should reject incorrect password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Incorrect password");
  });

  it("should reject password that is too long", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "a".repeat(300) });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Incorrect password");
  });

  it("should reject non-string password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: 12345 });
    expect(res.status).toBe(401);
  });

  it("should accept correct password and return token", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT session
    mockQuery.mockResolvedValueOnce({ rows: [] }); // DELETE old sessions
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "scor2024" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBe(64); // 32 bytes hex
  });
});

describe("Admin auth middleware", () => {
  it("should reject requests without admin token", async () => {
    const res = await request(app).get("/api/admin/questions");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Admin authentication required");
  });

  it("should reject invalid admin token", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // No matching session
    const res = await request(app)
      .get("/api/admin/questions")
      .set("x-admin-token", "invalid-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired session");
  });
});

// ==================
// PUBLIC API ROUTES
// ==================

describe("GET /api/categories", () => {
  it("should return category names", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: "GAA" }, { id: 2, name: "Geography" }],
    });
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["GAA", "Geography"]);
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to load categories");
  });
});

describe("POST /api/generate", () => {
  it("should require at least one category", async () => {
    const res = await request(app)
      .post("/api/generate")
      .send({ categories: [], mode: "practice" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("category");
  });

  it("should reject missing categories field", async () => {
    const res = await request(app)
      .post("/api/generate")
      .send({ mode: "practice" });
    expect(res.status).toBe(400);
  });
});

// ==================
// FEEDBACK VALIDATION
// ==================

describe("POST /api/feedback", () => {
  it("should require question and feedbackType", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .send({ question: "test" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("required");
  });

  it("should reject invalid feedback types", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .send({ question: "test", feedbackType: "xss_attack" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid feedback type");
  });

  it("should reject overly long input", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .send({
        question: "test",
        feedbackType: "wrong_answer",
        comment: "x".repeat(3000),
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("too long");
  });

  it("should accept valid feedback", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/feedback")
      .send({
        question: "What county won the 2024 All-Ireland?",
        feedbackType: "wrong_answer",
        comment: "Answer should be Armagh",
        suggestedAnswer: "Armagh",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    // UUID format check
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("should not leak PII in response", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/feedback")
      .send({
        question: "test",
        feedbackType: "other",
        email: "user@example.com",
      });
    expect(res.status).toBe(200);
    expect(res.body.received).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("user@example.com");
  });
});

// ==================
// DIFFICULTY RATING
// ==================

describe("POST /api/questions/:id/difficulty", () => {
  it("should reject invalid rating values", async () => {
    const res = await request(app)
      .post("/api/questions/1/difficulty")
      .send({ rating: "medium" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("easy");
  });

  it("should accept valid difficulty rating", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/questions/1/difficulty")
      .send({ rating: "hard" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ==================
// GENERAL FEEDBACK VALIDATION
// ==================

describe("POST /api/general-feedback", () => {
  it("should require a non-empty message", async () => {
    const res = await request(app)
      .post("/api/general-feedback")
      .send({ message: "" });
    expect(res.status).toBe(400);
  });

  it("should reject messages that are too long", async () => {
    const res = await request(app)
      .post("/api/general-feedback")
      .send({ message: "x".repeat(6000) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("too long");
  });

  it("should reject names that are too long", async () => {
    const res = await request(app)
      .post("/api/general-feedback")
      .send({ message: "test", name: "x".repeat(300) });
    expect(res.status).toBe(400);
  });

  it("should accept valid general feedback", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/general-feedback")
      .send({ message: "Great app!", name: "Seamus", email: "s@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ==================
// UPLOAD QUESTIONS
// ==================

describe("POST /api/upload-questions", () => {
  it("should reject empty question arrays", async () => {
    const res = await request(app)
      .post("/api/upload-questions")
      .send({ questions: [] });
    expect(res.status).toBe(400);
  });

  it("should reject more than 100 questions", async () => {
    const questions = Array(101).fill({
      question: "q",
      answer: "a",
      category: "c",
    });
    const res = await request(app)
      .post("/api/upload-questions")
      .send({ questions });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("100");
  });

  it("should skip questions with overly long fields", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // duplicate check — skip
    const res = await request(app)
      .post("/api/upload-questions")
      .send({
        questions: [
          { question: "x".repeat(3000), answer: "a", category: "c" },
          { question: "Valid?", answer: "Yes", category: "Test" },
        ],
      });
    expect(res.status).toBe(200);
    // First question skipped (too long), second skipped (duplicate found)
    expect(res.body.skipped).toBeGreaterThanOrEqual(1);
  });
});

// ==================
// API 404 HANDLING
// ==================

describe("API 404 handling", () => {
  it("should return JSON 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
    expect(res.headers["content-type"]).toContain("json");
  });

  it("should return HTML for non-API routes", async () => {
    const res = await request(app).get("/some-page");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("html");
  });
});

// ==================
// REQUEST SIZE LIMITS
// ==================

describe("Request size limits", () => {
  it("should reject payloads larger than 100kb", async () => {
    const largePayload = { data: "x".repeat(200000) };
    const res = await request(app)
      .post("/api/feedback")
      .send(largePayload);
    expect(res.status).toBe(413);
  });
});
