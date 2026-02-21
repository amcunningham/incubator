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

  showScreen("loading");

  const body = {
    categories: selectedCategories,
    mode: currentMode,
  };

  if (currentMode === "practice") {
    body.count = parseInt(document.getElementById("question-count").value, 10);
  }

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to generate questions");
      showScreen("category-select");
      return;
    }

    const result = await res.json();

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
