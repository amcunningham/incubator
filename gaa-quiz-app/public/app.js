// State
let currentMode = null;
let selectedCategories = [];
let questions = [];
let rounds = [];
let currentIndex = 0;
let currentRound = 0;
let timerInterval = null;
let timerSeconds = 0;

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

  // Reset flip
  document.getElementById("flashcard-inner").classList.remove("flipped");

  // Irish badge
  const badge = document.getElementById("practice-irish-badge");
  if (q.is_irish) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  // Button states
  document.getElementById("prev-btn").disabled = currentIndex === 0;
  document.getElementById("next-btn").textContent =
    currentIndex === questions.length - 1 ? "Finish" : "Next";
}

function flipCard() {
  document.getElementById("flashcard-inner").classList.toggle("flipped");
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

    row.innerHTML = `
      <span class="q-number">${q.number}</span>
      <div class="q-content">
        <div class="q-text">${q.question}</div>
        <div class="q-answer" id="answer-${currentRound}-${q.number}">${q.answer}</div>
      </div>
      <button class="btn-flag-small" title="Flag this question" onclick="flagQuizQuestion(${currentRound}, ${q.number})">Flag</button>
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
let feedbackTarget = null; // { question, answer, category }

function openFeedbackModal(question, answer, category) {
  // If called with no args, use the current practice question
  if (!question && currentMode === "practice" && questions[currentIndex]) {
    const q = questions[currentIndex];
    question = q.question;
    answer = q.answer;
    category = q.category;
  }

  feedbackTarget = { question, answer, category };
  currentFeedbackType = null;

  document.getElementById("modal-question-preview").textContent = question || "";
  document.getElementById("modal-answer-preview").textContent = answer ? "Current answer: " + answer : "";
  document.getElementById("suggested-answer").value = "";
  document.getElementById("feedback-comment").value = "";

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

// Feedback review screen
async function showFeedbackReview() {
  showScreen("feedback-review");

  const list = document.getElementById("feedback-list");
  list.innerHTML = '<p style="color: var(--gray-500);">Loading...</p>';

  try {
    const res = await fetch("/api/feedback");
    const items = await res.json();

    document.getElementById("feedback-count").textContent =
      items.length === 0 ? "No feedback submitted yet." : items.length + " item(s)";

    if (items.length === 0) {
      list.innerHTML = '<p style="color: var(--gray-500);">No feedback yet. Flag questions during practice or quiz mode.</p>';
      return;
    }

    list.innerHTML = "";
    items.slice().reverse().forEach((item) => {
      const card = document.createElement("div");
      card.className = "feedback-card" + (item.resolved ? " resolved" : "");

      const typeLabels = {
        wrong_answer: "Wrong Answer",
        unclear: "Unclear",
        outdated: "Outdated",
        other: "Other",
      };

      card.innerHTML = `
        <div class="feedback-card-header">
          <span class="feedback-type-label feedback-type-${item.feedbackType}">${typeLabels[item.feedbackType] || item.feedbackType}</span>
          <span class="feedback-category">${item.category || ""}</span>
          ${item.resolved ? '<span class="feedback-resolved-badge">Resolved</span>' : ""}
        </div>
        <div class="feedback-question">${item.question}</div>
        <div class="feedback-current-answer">Current answer: ${item.answer}</div>
        ${item.suggestedAnswer ? '<div class="feedback-suggested">Suggested: <strong>' + item.suggestedAnswer + "</strong></div>" : ""}
        ${item.comment ? '<div class="feedback-comment-text">' + item.comment + "</div>" : ""}
        <div class="feedback-actions">
          <button class="btn btn-secondary btn-sm" onclick="toggleResolved('${item.id}')">${item.resolved ? "Unresolve" : "Mark Resolved"}</button>
          <button class="btn btn-secondary btn-sm btn-danger-text" onclick="deleteFeedback('${item.id}')">Delete</button>
        </div>
      `;

      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '<p style="color: #842029;">Failed to load feedback.</p>';
  }
}

async function toggleResolved(id) {
  await fetch("/api/feedback/" + id, { method: "PATCH" });
  showFeedbackReview();
}

async function deleteFeedback(id) {
  if (!confirm("Delete this feedback?")) return;
  await fetch("/api/feedback/" + id, { method: "DELETE" });
  showFeedbackReview();
}

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
