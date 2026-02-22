// State
let currentMode = null;
let selectedCategories = [];
let questions = [];
let rounds = [];
let currentIndex = 0;
let currentRound = 0;
let timerInterval = null;
let timerSeconds = 0;
let isAISession = false;
let ratedQuestions = new Set();

// Screen management
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goBack(screenId) {
  clearTimer();
  selectedCategories = [];
  questions = [];
  rounds = [];
  currentIndex = 0;
  currentRound = 0;
  ratedQuestions = new Set();
  showScreen(screenId);
}

// Mode selection
function selectMode(mode) {
  currentMode = mode;
  selectedCategories = [];

  const heading = document.getElementById("category-heading");
  const instructions = document.getElementById("category-instructions");
  const practiceOpts = document.getElementById("practice-options");

  if (mode === "practice") {
    heading.textContent = "Select Categories";
    instructions.textContent = "Pick one or more categories to practise.";
    practiceOpts.classList.remove("hidden");
  } else {
    heading.textContent = "Select Round Categories";
    instructions.textContent =
      "Pick the categories for each round (in order). Select as many as you want rounds.";
    practiceOpts.classList.add("hidden");
  }

  loadCategories();
  showScreen("category-select");
}

// Load categories
async function loadCategories() {
  const res = await fetch("/api/categories");
  const categories = await res.json();
  const grid = document.getElementById("category-list");
  grid.innerHTML = "";

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = cat;
    btn.addEventListener("click", () => toggleCategory(btn, cat));
    grid.appendChild(btn);
  });
}

function toggleCategory(btn, cat) {
  if (selectedCategories.includes(cat)) {
    selectedCategories = selectedCategories.filter((c) => c !== cat);
    btn.classList.remove("selected");
  } else {
    selectedCategories.push(cat);
    btn.classList.add("selected");
  }
}

// Start quiz generation
async function startQuiz() {
  if (!selectedCategories.length) return;

  const useAI = document.getElementById("use-ai").checked;
  isAISession = useAI;
  const endpoint = useAI ? "/api/generate-ai" : "/api/generate";

  if (useAI) {
    showScreen("loading");
  }

  const body = {
    categories: selectedCategories,
    mode: currentMode,
  };

  if (currentMode === "practice") {
    body.count = parseInt(document.getElementById("question-count").value, 10);
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const result = JSON.parse(text.trim());

    if (!res.ok || result.error) {
      alert(result.error || "Failed to generate questions");
      showScreen("category-select");
      return;
    }

    if (currentMode === "practice") {
      questions = result.data;
      currentIndex = 0;
      showPracticeQuestion();
      showScreen("practice-mode");
    } else {
      rounds = result.data.rounds;
      currentRound = 0;
      showRound();
      showScreen("quiz-mode");
    }
  } catch (e) {
    alert("Network error. Please try again.");
    showScreen("category-select");
  }
}

// ==================
// PRACTICE MODE
// ==================

function showPracticeQuestion() {
  const q = questions[currentIndex];
  document.getElementById("practice-progress").textContent =
    `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById("practice-category-badge").textContent = q.category;
  document.getElementById("practice-question").textContent = q.question;
  document.getElementById("practice-answer").textContent = q.answer;

  // Reset flip and difficulty
  document.getElementById("flashcard-inner").classList.remove("flipped");
  const diffRow = document.getElementById("difficulty-row");
  diffRow.classList.add("hidden");
  diffRow.classList.remove("rated");
  diffRow.innerHTML = '<span class="difficulty-prompt">How was this question?</span><button class="btn-difficulty btn-easy" onclick="rateDifficulty(\'easy\')">Easy</button><button class="btn-difficulty btn-hard" onclick="rateDifficulty(\'hard\')">Hard</button>';

  // Irish badge and translation
  const badge = document.getElementById("practice-irish-badge");
  const translationContainer = document.getElementById("practice-translation");
  const translationText = document.getElementById("translation-text");
  if (q.is_irish) {
    badge.classList.remove("hidden");
    if (q.translation) {
      translationContainer.classList.remove("hidden");
      translationText.textContent = q.translation;
      translationText.classList.add("hidden");
      // Reset button text
      translationContainer.querySelector(".btn-translation").textContent = "Show Translation";
    } else {
      translationContainer.classList.add("hidden");
    }
  } else {
    badge.classList.add("hidden");
    translationContainer.classList.add("hidden");
  }

  // Button states
  document.getElementById("prev-btn").disabled = currentIndex === 0;
  document.getElementById("next-btn").textContent =
    currentIndex === questions.length - 1 ? "Finish" : "Next";
}

function flipCard() {
  const inner = document.getElementById("flashcard-inner");
  inner.classList.toggle("flipped");

  const diffRow = document.getElementById("difficulty-row");
  const q = questions[currentIndex];
  if (inner.classList.contains("flipped") && q && q.id && !ratedQuestions.has(q.id)) {
    diffRow.classList.remove("hidden");
  } else {
    diffRow.classList.add("hidden");
  }
}

async function rateDifficulty(rating) {
  const q = questions[currentIndex];
  if (!q || !q.id || ratedQuestions.has(q.id)) return;

  ratedQuestions.add(q.id);
  const diffRow = document.getElementById("difficulty-row");
  diffRow.classList.add("rated");
  diffRow.innerHTML = `<span class="difficulty-thanks">Rated ${rating === "easy" ? "Easy" : "Hard"} — thanks!</span>`;

  try {
    await fetch(`/api/questions/${q.id}/difficulty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
  } catch (e) {
    // Silent fail — rating is non-critical
  }
}

function toggleTranslation() {
  const text = document.getElementById("translation-text");
  const btn = document.querySelector(".btn-translation");
  if (text.classList.contains("hidden")) {
    text.classList.remove("hidden");
    btn.textContent = "Hide Translation";
  } else {
    text.classList.add("hidden");
    btn.textContent = "Show Translation";
  }
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showPracticeQuestion();
  } else {
    goBack("mode-select");
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    showPracticeQuestion();
  }
}

// ==================
// QUIZ MODE
// ==================

function showRound() {
  const round = rounds[currentRound];
  document.getElementById("round-title").textContent =
    `Round ${round.number}: ${round.category}`;
  document.getElementById("round-category").textContent =
    `${currentRound + 1} of ${rounds.length}`;

  const container = document.getElementById("quiz-questions");
  container.innerHTML = "";

  round.questions.forEach((q) => {
    const row = document.createElement("div");
    row.className = "quiz-question-row" + (q.is_irish ? " irish" : "");

    const translationHtml = q.is_irish && q.translation
      ? `<div class="q-translation"><button class="btn-translation-small" onclick="toggleQuizTranslation(this)">Show Translation</button><span class="q-translation-text hidden">${q.translation}</span></div>`
      : "";

    row.innerHTML = `
      <span class="q-number">${q.number}</span>
      <div class="q-content">
        <div class="q-text">${q.question}</div>
        ${translationHtml}
        <div class="q-answer" id="answer-${currentRound}-${q.number}">${q.answer}</div>
      </div>
      <div class="q-actions">
        <button class="btn-flag-small" title="Give feedback on this question" onclick="flagQuizQuestion(${currentRound}, ${q.number})">Feedback</button>
      </div>
    `;

    container.appendChild(row);
  });

  // Button states
  document.getElementById("reveal-answers-btn").style.display = "";
  document.getElementById("next-round-btn").textContent =
    currentRound === rounds.length - 1 ? "Finish" : "Next Round";

  // Start timer (3 minutes per round)
  startTimer(180);
}

function startTimer(seconds) {
  clearTimer();
  timerSeconds = seconds;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      timerSeconds = 0;
      clearTimer();
    }
    updateTimerDisplay();
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const el = document.getElementById("timer");
  el.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;

  el.classList.remove("warning", "danger");
  if (timerSeconds <= 30) {
    el.classList.add("danger");
  } else if (timerSeconds <= 60) {
    el.classList.add("warning");
  }
}

function toggleQuizTranslation(btn) {
  const text = btn.nextElementSibling;
  if (text.classList.contains("hidden")) {
    text.classList.remove("hidden");
    btn.textContent = "Hide Translation";
  } else {
    text.classList.add("hidden");
    btn.textContent = "Show Translation";
  }
}

function revealRoundAnswers() {
  clearTimer();
  const round = rounds[currentRound];
  round.questions.forEach((q) => {
    const el = document.getElementById(`answer-${currentRound}-${q.number}`);
    if (el) el.classList.add("visible");
  });
  document.getElementById("reveal-answers-btn").style.display = "none";
}

function nextRound() {
  clearTimer();
  if (currentRound < rounds.length - 1) {
    currentRound++;
    showRound();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    goBack("mode-select");
  }
}

// ==================
// FEEDBACK SYSTEM
// ==================

let currentFeedbackType = null;
let feedbackTarget = null; // { question, answer, category, isAI }

function openFeedbackModal(question, answer, category) {
  // If called with no args, use the current practice question
  if (!question && currentMode === "practice" && questions[currentIndex]) {
    const q = questions[currentIndex];
    question = q.question;
    answer = q.answer;
    category = q.category;
  }

  feedbackTarget = { question, answer, category, isAI: isAISession };
  currentFeedbackType = null;

  document.getElementById("modal-question-preview").textContent = question || "";
  document.getElementById("modal-answer-preview").textContent = answer ? "Current answer: " + answer : "";
  document.getElementById("suggested-answer").value = "";
  document.getElementById("feedback-comment").value = "";
  document.getElementById("feedback-email").value = "";

  // Reset type buttons
  document.querySelectorAll(".feedback-type-btn").forEach((b) => b.classList.remove("selected"));

  document.getElementById("feedback-modal").classList.remove("hidden");
}

function closeFeedbackModal() {
  document.getElementById("feedback-modal").classList.add("hidden");
  feedbackTarget = null;
  currentFeedbackType = null;
}

function selectFeedbackType(btn) {
  document.querySelectorAll(".feedback-type-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  currentFeedbackType = btn.dataset.type;
}

async function submitFeedback() {
  if (!currentFeedbackType) {
    alert("Please select an issue type.");
    return;
  }

  const payload = {
    question: feedbackTarget?.question || "",
    answer: feedbackTarget?.answer || "",
    category: feedbackTarget?.category || "",
    feedbackType: currentFeedbackType,
    suggestedAnswer: document.getElementById("suggested-answer").value.trim(),
    comment: document.getElementById("feedback-comment").value.trim(),
    email: document.getElementById("feedback-email").value.trim(),
    isAI: feedbackTarget?.isAI || false,
  };

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      closeFeedbackModal();
      showToast("Feedback submitted — thanks!");
    } else {
      alert("Failed to submit feedback.");
    }
  } catch (e) {
    alert("Network error.");
  }
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("visible"), 10);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Open feedback modal for quiz mode questions
function flagQuizQuestion(roundIdx, qNum) {
  const round = rounds[roundIdx];
  if (!round) return;
  const q = round.questions.find((x) => x.number === qNum);
  if (!q) return;
  openFeedbackModal(q.question, q.answer, round.category);
}

// Feedback review screen (read-only for users, admin actions in /admin)
async function showFeedbackReview() {
  showScreen("feedback-review");

  const list = document.getElementById("feedback-list");
  list.innerHTML = '<p style="color: var(--gray-500);">Loading...</p>';

  try {
    const res = await fetch("/api/feedback");
    const items = await res.json();

    document.getElementById("feedback-count").textContent =
      items.length === 0 ? "No feedback submitted yet." : items.length + " item(s) — manage in Admin panel";

    if (items.length === 0) {
      list.innerHTML = '<p style="color: var(--gray-500);">No feedback yet. Flag questions during practice or quiz mode.</p>';
      return;
    }

    list.innerHTML = "";
    const typeLabels = {
      wrong_answer: "Wrong Answer",
      unclear: "Unclear",
      too_easy: "Too Easy",
      outdated: "Outdated",
      other: "Other",
    };

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "feedback-card" + (item.resolved ? " resolved" : "");

      card.innerHTML = `
        <div class="feedback-card-header">
          <span class="feedback-type-label feedback-type-${item.feedbackType}">${typeLabels[item.feedbackType] || item.feedbackType}</span>
          <span class="feedback-category">${item.category || ""}</span>
          ${item.isAI ? '<span class="feedback-ai-badge">AI Generated</span>' : ""}
          ${item.resolved ? '<span class="feedback-resolved-badge">Resolved</span>' : ""}
        </div>
        <div class="feedback-question">${item.question}</div>
        <div class="feedback-current-answer">Current answer: ${item.answer}</div>
        ${item.suggestedAnswer ? '<div class="feedback-suggested">Suggested: <strong>' + item.suggestedAnswer + "</strong></div>" : ""}
        ${item.comment ? '<div class="feedback-comment-text">' + item.comment + "</div>" : ""}
      `;

      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '<p style="color: #842029;">Failed to load feedback.</p>';
  }
}

// Remove question from bank — now admin-only, redirect to admin panel
function removeQuestion() {
  showToast("Use the Admin panel to manage questions");
}

function removeFromModal() {
  showToast("Use the Admin panel to manage questions");
  closeFeedbackModal();
}

function removeQuizQuestion() {
  showToast("Use the Admin panel to manage questions");
}

// ==================
// UPLOAD QUESTIONS
// ==================

async function loadUploadCategories() {
  try {
    const res = await fetch("/api/categories");
    const categories = await res.json();
    // Populate both single and bulk category dropdowns
    const selects = [
      document.getElementById("upload-category"),
      document.getElementById("upload-bulk-category"),
    ].filter(Boolean);
    selects.forEach((select) => {
      select.innerHTML = "";
      categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    });
  } catch (e) {
    console.error("Failed to load categories for upload:", e);
  }
}

async function submitSingleQuestion() {
  const category = document.getElementById("upload-category").value;
  const question = document.getElementById("upload-question").value.trim();
  const answer = document.getElementById("upload-answer").value.trim();

  if (!question) { alert("Please enter a question."); return; }
  if (!answer) { alert("Please enter an answer."); return; }
  if (!category) { alert("Please select a category."); return; }

  try {
    const res = await fetch("/api/upload-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [{ question, answer, category, is_irish: false }],
      }),
    });
    const result = await res.json();

    if (res.ok && result.success) {
      document.getElementById("upload-question").value = "";
      document.getElementById("upload-answer").value = "";
      showToast("Question submitted — go raibh maith agat!");
    } else {
      alert(result.error || "Failed to submit.");
    }
  } catch (e) {
    alert("Network error. Please try again.");
  }
}

function parseUploadText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l);
  const questions = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Strip leading numbering like "1." or "1)"
    line = line.replace(/^\d+[\.\)]\s*/, "");

    // Pipe separated: Question | Answer
    if (line.includes("|")) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        questions.push({ question: parts[0], answer: parts[1] });
        continue;
      }
    }

    // Tab separated: Question\tAnswer
    if (line.includes("\t")) {
      const parts = line.split("\t").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        questions.push({ question: parts[0], answer: parts[1] });
        continue;
      }
    }

    // Two-line format: Question? then Answer on next line
    if (line.endsWith("?") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].replace(/^\d+[\.\)]\s*/, "").trim();
      // Next line is the answer if it doesn't look like another question
      if (nextLine && !nextLine.endsWith("?")) {
        questions.push({ question: line, answer: nextLine });
        i++; // skip answer line
        continue;
      }
    }
  }
  return questions;
}

function previewUpload() {
  const text = document.getElementById("upload-textarea").value;
  const questions = parseUploadText(text);
  const preview = document.getElementById("upload-preview");
  const list = document.getElementById("upload-preview-list");
  const count = document.getElementById("upload-count");

  if (questions.length === 0) {
    preview.classList.add("hidden");
    alert("No questions found. Check the format and try again.");
    return;
  }

  count.textContent = questions.length;
  list.innerHTML = "";
  questions.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "upload-preview-item";
    item.innerHTML = `<strong>${i + 1}.</strong> ${q.question}<br><span class="upload-preview-answer">${q.answer}</span>`;
    list.appendChild(item);
  });
  preview.classList.remove("hidden");
}

async function submitUpload() {
  const text = document.getElementById("upload-textarea").value;
  const category = document.getElementById("upload-bulk-category").value;
  const questions = parseUploadText(text);

  if (questions.length === 0) {
    alert("No questions found. Use Preview first to check the format.");
    return;
  }

  if (!category) {
    alert("Please select a category.");
    return;
  }

  const payload = questions.map((q) => ({
    question: q.question,
    answer: q.answer,
    category: category,
    is_irish: false,
  }));

  try {
    const res = await fetch("/api/upload-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: payload }),
    });
    const result = await res.json();

    if (res.ok && result.success) {
      document.getElementById("upload-textarea").value = "";
      document.getElementById("upload-preview").classList.add("hidden");
      showToast(`Uploaded ${result.imported} question(s)${result.skipped ? ` (${result.skipped} skipped as duplicates)` : ""}`);
      showScreen("mode-select");
    } else {
      alert(result.error || "Upload failed.");
    }
  } catch (e) {
    alert("Network error. Please try again.");
  }
}

// ==================
// GENERAL FEEDBACK
// ==================

async function submitGeneralFeedback() {
  const name = document.getElementById("gf-name").value.trim();
  const email = document.getElementById("gf-email").value.trim();
  const message = document.getElementById("gf-message").value.trim();

  if (!message) { alert("Please enter a message."); return; }

  try {
    const res = await fetch("/api/general-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    const result = await res.json();

    if (res.ok && result.success) {
      document.getElementById("gf-name").value = "";
      document.getElementById("gf-email").value = "";
      document.getElementById("gf-message").value = "";
      showToast("Feedback sent — go raibh maith agat!");
      showScreen("mode-select");
    } else {
      alert(result.error || "Failed to send feedback.");
    }
  } catch (e) {
    alert("Network error. Please try again.");
  }
}

// Load upload categories when navigating to upload screen
const _originalShowScreen = showScreen;
showScreen = function (id) {
  _originalShowScreen(id);
  if (id === "upload-questions" || id === "upload-bulk") {
    loadUploadCategories();
  }
};

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const practiceActive = document.getElementById("practice-mode").classList.contains("active");

  if (practiceActive) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flipCard();
    } else if (e.key === "ArrowRight" || e.key === "n") {
      nextQuestion();
    } else if (e.key === "ArrowLeft" || e.key === "p") {
      prevQuestion();
    }
  }
});
