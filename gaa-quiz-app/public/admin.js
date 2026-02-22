// State
let adminToken = localStorage.getItem("adminToken") || null;
let allQuestions = [];
let allAIQuestions = [];
let categories = [];
const QUESTIONS_PER_PAGE = 25;
let questionPage = 0;
let aiPage = 0;

// ==================
// AUTH
// ==================

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.add("hidden");

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed";
      errorEl.classList.remove("hidden");
      return;
    }

    adminToken = data.token;
    localStorage.setItem("adminToken", adminToken);
    showDashboard();
  } catch (err) {
    errorEl.textContent = "Network error. Please try again.";
    errorEl.classList.remove("hidden");
  }
}

async function handleLogout() {
  try {
    await apiFetch("/api/admin/logout", { method: "POST" });
  } catch (e) {
    // Ignore
  }
  adminToken = null;
  localStorage.removeItem("adminToken");
  showScreen("login-screen");
}

async function checkAuth() {
  if (!adminToken) return false;
  try {
    const res = await apiFetch("/api/admin/check");
    return res.ok;
  } catch (e) {
    return false;
  }
}

// ==================
// HELPERS
// ==================

function apiFetch(url, opts = {}) {
  opts.headers = {
    ...opts.headers,
    "x-admin-token": adminToken,
  };
  if (opts.body && !opts.headers["Content-Type"]) {
    opts.headers["Content-Type"] = "application/json";
  }
  return fetch(url, opts);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
  document.querySelector(`.admin-tab[data-tab="${tab}"]`).classList.add("active");
  document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "stats") loadStats();
  if (tab === "feedback") loadFeedback();
  if (tab === "questions") loadQuestions();
  if (tab === "ai-questions") loadAIQuestions();
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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==================
// DASHBOARD / STATS
// ==================

async function loadStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res = await apiFetch("/api/admin/stats");
    const data = await res.json();

    const totalQuestions = data.categories.reduce((sum, c) => sum + parseInt(c.total), 0);
    const totalIrish = data.categories.reduce((sum, c) => sum + parseInt(c.irish), 0);

    let html = `
      <div class="stat-card">
        <h3>Total Questions</h3>
        <div class="stat-value">${totalQuestions}</div>
        <div class="stat-detail">${totalIrish} as Gaeilge</div>
      </div>
      <div class="stat-card">
        <h3>Categories</h3>
        <div class="stat-value">${data.categories.length}</div>
        <div class="stat-breakdown">
          ${data.categories.map((c) => `<div class="stat-breakdown-row"><span>${escapeHtml(c.category)}</span><span>${c.total} (${c.irish} Irish)</span></div>`).join("")}
        </div>
      </div>
      <div class="stat-card">
        <h3>Feedback</h3>
        <div class="stat-value">${data.feedback.total || 0}</div>
        <div class="stat-detail">${data.feedback.resolved || 0} resolved</div>
      </div>
      <div class="stat-card">
        <h3>AI Questions</h3>
        <div class="stat-value">${data.aiQuestions.total || 0}</div>
        <div class="stat-detail">${data.aiQuestions.added || 0} added to bank</div>
      </div>
    `;

    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Failed to load stats.</p>';
  }
}

// ==================
// FEEDBACK
// ==================

async function loadFeedback() {
  const list = document.getElementById("admin-feedback-list");
  list.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res = await apiFetch("/api/feedback");
    const items = await res.json();
    const filter = document.getElementById("feedback-filter").value;

    let filtered = items;
    if (filter === "unresolved") filtered = items.filter((i) => !i.resolved);
    if (filter === "resolved") filtered = items.filter((i) => i.resolved);

    if (filtered.length === 0) {
      list.innerHTML = '<p class="empty-state">No feedback items found.</p>';
      return;
    }

    const typeLabels = {
      wrong_answer: "Wrong Answer",
      unclear: "Unclear",
      too_easy: "Too Easy",
      outdated: "Outdated",
      other: "Other",
    };

    list.innerHTML = "";

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "feedback-card" + (item.resolved ? " resolved" : "");

      card.innerHTML = `
        <div class="feedback-card-header">
          <span class="feedback-type-label feedback-type-${item.feedbackType}">${typeLabels[item.feedbackType] || item.feedbackType}</span>
          <span class="feedback-category">${escapeHtml(item.category || "")}</span>
          ${item.isAI ? '<span class="feedback-ai-badge">AI Generated</span>' : ""}
          ${item.resolved ? '<span class="feedback-resolved-badge">Resolved</span>' : ""}
        </div>
        <div class="feedback-question">${escapeHtml(item.question)}</div>
        <div class="feedback-current-answer">Current answer: ${escapeHtml(item.answer)}</div>
        ${item.suggestedAnswer ? '<div class="feedback-suggested">Suggested: <strong>' + escapeHtml(item.suggestedAnswer) + "</strong></div>" : ""}
        ${item.comment ? '<div class="feedback-comment-text">' + escapeHtml(item.comment) + "</div>" : ""}
        <div class="inline-edit hidden" id="edit-fb-${item.id}">
          <label>Question:<textarea class="edit-q-input" rows="2">${escapeHtml(item.question)}</textarea></label>
          <label>Answer:<input type="text" class="edit-a-input" value="${escapeHtml(item.suggestedAnswer || item.answer)}"></label>
          <div class="button-row">
            <button class="btn btn-secondary btn-sm cancel-edit">Cancel</button>
            <button class="btn btn-primary btn-sm save-edit">Save Changes</button>
          </div>
        </div>
        <div class="feedback-actions">
          <button class="btn btn-primary btn-sm edit-btn">Edit Question</button>
          <button class="btn btn-secondary btn-sm resolve-btn">${item.resolved ? "Unresolve" : "Mark Resolved"}</button>
          ${!item.isAI ? '<button class="btn btn-danger btn-sm remove-btn">Remove from Bank</button>' : '<button class="btn btn-primary btn-sm add-to-bank-btn">Add to Bank</button>'}
          <button class="btn btn-secondary btn-sm btn-danger-text delete-btn">Delete Feedback</button>
        </div>
      `;

      // Wire events
      const resolveBtn = card.querySelector(".resolve-btn");
      resolveBtn.addEventListener("click", () => toggleResolveFeedback(item.id));

      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => deleteFeedback(item.id));

      const removeBtn = card.querySelector(".remove-btn");
      if (removeBtn) removeBtn.addEventListener("click", () => removeFeedbackQuestion(item));

      const editBtn = card.querySelector(".edit-btn");
      const editForm = card.querySelector(`#edit-fb-${item.id}`);
      if (editBtn && editForm) {
        editBtn.addEventListener("click", () => editForm.classList.toggle("hidden"));
        editForm.querySelector(".cancel-edit").addEventListener("click", () => editForm.classList.add("hidden"));
        editForm.querySelector(".save-edit").addEventListener("click", async () => {
          const newQ = editForm.querySelector(".edit-q-input").value.trim();
          const newA = editForm.querySelector(".edit-a-input").value.trim();
          if (!newQ || !newA) { alert("Question and answer cannot be empty."); return; }
          try {
            let r;
            if (item.isAI) {
              r = await apiFetch("/api/admin/ai-feedback/edit", {
                method: "POST",
                body: JSON.stringify({
                  originalQuestion: item.question,
                  category: item.category,
                  newQuestion: newQ,
                  newAnswer: newA,
                }),
              });
            } else {
              r = await apiFetch("/api/questions/edit", {
                method: "POST",
                body: JSON.stringify({
                  originalQuestion: item.question,
                  category: item.category,
                  newQuestion: newQ,
                  newAnswer: newA,
                }),
              });
            }
            if (r.ok) {
              showToast("Question updated");
              await apiFetch("/api/feedback/" + item.id, { method: "PATCH" });
              loadFeedback();
            } else {
              const d = await r.json();
              alert(d.error || "Failed to update.");
            }
          } catch (e) { alert("Network error."); }
        });
      }

      const addToBankBtn = card.querySelector(".add-to-bank-btn");
      if (addToBankBtn) {
        addToBankBtn.addEventListener("click", async () => {
          try {
            const r = await apiFetch("/api/admin/ai-feedback/add-to-bank", {
              method: "POST",
              body: JSON.stringify({
                question: item.question,
                answer: item.answer,
                category: item.category,
                is_irish: false,
              }),
            });
            if (r.ok) {
              showToast("Added to question bank");
              await apiFetch("/api/feedback/" + item.id, { method: "PATCH" });
              loadFeedback();
            } else {
              const d = await r.json();
              alert(d.error || "Failed to add to bank.");
            }
          } catch (e) { alert("Network error."); }
        });
      }

      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = '<p class="empty-state">Failed to load feedback.</p>';
  }
}

async function toggleResolveFeedback(id) {
  await apiFetch("/api/feedback/" + id, { method: "PATCH" });
  loadFeedback();
}

async function deleteFeedback(id) {
  if (!confirm("Delete this feedback?")) return;
  await apiFetch("/api/feedback/" + id, { method: "DELETE" });
  loadFeedback();
}

async function removeFeedbackQuestion(item) {
  if (!confirm('Remove this question from the bank?\n\n"' + item.question + '"')) return;
  try {
    const res = await apiFetch("/api/questions/remove", {
      method: "POST",
      body: JSON.stringify({ question: item.question, category: item.category }),
    });
    if (res.ok) {
      showToast("Question removed from bank");
      await apiFetch("/api/feedback/" + item.id, { method: "PATCH" });
      loadFeedback();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to remove.");
    }
  } catch (e) { alert("Network error."); }
}

// ==================
// QUESTION BANK
// ==================

async function loadQuestions() {
  const container = document.getElementById("admin-questions-list");
  container.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res = await apiFetch("/api/admin/questions");
    allQuestions = await res.json();

    // Populate category filter
    const catFilter = document.getElementById("question-category-filter");
    const existingCats = new Set();
    catFilter.querySelectorAll("option").forEach((o) => { if (o.value !== "all") existingCats.add(o.value); });

    const uniqueCats = [...new Set(allQuestions.map((q) => q.category))];
    if (uniqueCats.some((c) => !existingCats.has(c))) {
      catFilter.innerHTML = '<option value="all">All Categories</option>';
      uniqueCats.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        catFilter.appendChild(opt);
      });
    }

    // Also populate the add-question category dropdown
    const addCatSelect = document.getElementById("add-q-category");
    addCatSelect.innerHTML = "";
    uniqueCats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      addCatSelect.appendChild(opt);
    });

    categories = uniqueCats;
    renderQuestions();
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load questions.</p>';
  }
}

function renderQuestions() {
  const container = document.getElementById("admin-questions-list");
  const catFilter = document.getElementById("question-category-filter").value;
  const search = document.getElementById("question-search").value.toLowerCase().trim();

  let filtered = allQuestions;
  if (catFilter !== "all") filtered = filtered.filter((q) => q.category === catFilter);
  if (search) filtered = filtered.filter((q) => q.question.toLowerCase().includes(search) || q.answer.toLowerCase().includes(search));

  const totalPages = Math.ceil(filtered.length / QUESTIONS_PER_PAGE);
  if (questionPage >= totalPages) questionPage = Math.max(0, totalPages - 1);
  const start = questionPage * QUESTIONS_PER_PAGE;
  const pageItems = filtered.slice(start, start + QUESTIONS_PER_PAGE);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No questions found.</p>';
    return;
  }

  let html = "";
  pageItems.forEach((q) => {
    html += `
      <div class="admin-question-card${q.is_irish ? " irish-q" : ""}" data-id="${q.id}">
        <div class="admin-q-content">
          <div class="admin-q-text">${escapeHtml(q.question)}</div>
          <div class="admin-q-answer">${escapeHtml(q.answer)}</div>
          <div class="admin-q-meta">${escapeHtml(q.category)}${q.is_irish ? " &middot; As Gaeilge" : ""}</div>
        </div>
        <div class="admin-q-actions">
          <button class="edit-btn" onclick="editQuestion(${q.id})">Edit</button>
          <button class="remove-btn" onclick="removeQuestion(${q.id})">Remove</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="pagination">
      <button onclick="questionPage = 0; renderQuestions()" ${questionPage === 0 ? "disabled" : ""}>First</button>
      <button onclick="questionPage--; renderQuestions()" ${questionPage === 0 ? "disabled" : ""}>Prev</button>
      <span class="page-info">${questionPage + 1} / ${totalPages} (${filtered.length} questions)</span>
      <button onclick="questionPage++; renderQuestions()" ${questionPage >= totalPages - 1 ? "disabled" : ""}>Next</button>
      <button onclick="questionPage = ${totalPages - 1}; renderQuestions()" ${questionPage >= totalPages - 1 ? "disabled" : ""}>Last</button>
    </div>
  `;

  container.innerHTML = html;
}

async function editQuestion(id) {
  const q = allQuestions.find((x) => x.id === id);
  if (!q) return;

  const card = document.querySelector(`.admin-question-card[data-id="${id}"]`);
  if (!card) return;

  // Check if edit form already exists
  if (card.querySelector(".inline-edit")) {
    card.querySelector(".inline-edit").remove();
    return;
  }

  const editDiv = document.createElement("div");
  editDiv.className = "inline-edit";
  editDiv.innerHTML = `
    <label>Question:<textarea rows="2" class="edit-q">${escapeHtml(q.question)}</textarea></label>
    <label>Answer:<input type="text" class="edit-a" value="${escapeHtml(q.answer)}"></label>
    <div class="button-row">
      <button class="btn btn-secondary btn-sm" onclick="this.closest('.inline-edit').remove()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="saveQuestionEdit(${q.id}, '${escapeHtml(q.question).replace(/'/g, "\\'")}', '${escapeHtml(q.category).replace(/'/g, "\\'")}')">Save</button>
    </div>
  `;

  card.querySelector(".admin-q-content").appendChild(editDiv);
}

async function saveQuestionEdit(id, originalQuestion, category) {
  const card = document.querySelector(`.admin-question-card[data-id="${id}"]`);
  const editDiv = card.querySelector(".inline-edit");
  const newQ = editDiv.querySelector(".edit-q").value.trim();
  const newA = editDiv.querySelector(".edit-a").value.trim();

  if (!newQ || !newA) { alert("Question and answer cannot be empty."); return; }

  try {
    const res = await apiFetch("/api/questions/edit", {
      method: "POST",
      body: JSON.stringify({
        originalQuestion,
        category,
        newQuestion: newQ,
        newAnswer: newA,
      }),
    });

    if (res.ok) {
      showToast("Question updated");
      loadQuestions();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to update.");
    }
  } catch (e) { alert("Network error."); }
}

async function removeQuestion(id) {
  const q = allQuestions.find((x) => x.id === id);
  if (!q) return;
  if (!confirm('Remove this question from the bank?\n\n"' + q.question + '"')) return;

  try {
    const res = await apiFetch("/api/questions/remove", {
      method: "POST",
      body: JSON.stringify({ question: q.question, category: q.category }),
    });
    if (res.ok) {
      showToast("Question removed");
      loadQuestions();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to remove.");
    }
  } catch (e) { alert("Network error."); }
}

function showAddQuestionForm() {
  document.getElementById("add-question-form").classList.remove("hidden");
}

function hideAddQuestionForm() {
  document.getElementById("add-question-form").classList.add("hidden");
  document.getElementById("add-q-question").value = "";
  document.getElementById("add-q-answer").value = "";
  document.getElementById("add-q-irish").checked = false;
}

async function addQuestion() {
  const category = document.getElementById("add-q-category").value;
  const question = document.getElementById("add-q-question").value.trim();
  const answer = document.getElementById("add-q-answer").value.trim();
  const isIrish = document.getElementById("add-q-irish").checked;

  if (!question || !answer) { alert("Question and answer are required."); return; }

  try {
    const res = await apiFetch("/api/questions/add", {
      method: "POST",
      body: JSON.stringify({ question, answer, category, isIrish }),
    });

    if (res.ok) {
      showToast("Question added to bank");
      hideAddQuestionForm();
      loadQuestions();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add.");
    }
  } catch (e) { alert("Network error."); }
}

// ==================
// BULK IMPORT
// ==================

function toggleBulkImport() {
  const form = document.getElementById("bulk-import-form");
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) {
    // Populate category dropdown
    const sel = document.getElementById("import-category");
    sel.innerHTML = "";
    const cats = [...new Set(allAIQuestions.map((q) => q.category).filter(Boolean))];
    // Also fetch from main categories
    apiFetch("/api/categories").then((r) => r.json()).then((categories) => {
      const allCats = [...new Set([...categories, ...cats])].sort();
      sel.innerHTML = allCats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    });
  }
}

function parseImportText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l);
  const questions = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Remove leading numbers like "1." or "1)"
    line = line.replace(/^\d+[\.\)]\s*/, "");
    // Try pipe separator
    if (line.includes("|")) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        questions.push({ question: parts[0], answer: parts[1] });
        continue;
      }
    }
    // Try tab separator
    if (line.includes("\t")) {
      const parts = line.split("\t").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        questions.push({ question: parts[0], answer: parts[1] });
        continue;
      }
    }
    // Two-line format: question on one line, answer on next
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].replace(/^\d+[\.\)]\s*/, "").trim();
      // If current line looks like a question and next doesn't have separators
      if (line.endsWith("?") && !nextLine.includes("|") && !nextLine.includes("\t")) {
        questions.push({ question: line, answer: nextLine });
        i++; // skip next line
        continue;
      }
    }
  }
  return questions;
}

function previewImport() {
  const text = document.getElementById("import-textarea").value;
  const questions = parseImportText(text);
  const preview = document.getElementById("import-preview");
  const list = document.getElementById("import-preview-list");
  document.getElementById("import-count").textContent = questions.length;

  if (questions.length === 0) {
    list.innerHTML = '<p class="empty-state">No questions detected. Check the format.</p>';
  } else {
    list.innerHTML = questions.slice(0, 20).map((q, i) =>
      `<div class="import-preview-item"><strong>Q${i + 1}:</strong> ${escapeHtml(q.question)}<br><strong>A:</strong> ${escapeHtml(q.answer)}</div>`
    ).join("") + (questions.length > 20 ? `<p class="empty-state">...and ${questions.length - 20} more</p>` : "");
  }
  preview.classList.remove("hidden");
}

async function submitBulkImport() {
  const text = document.getElementById("import-textarea").value;
  const category = document.getElementById("import-category").value;
  const questions = parseImportText(text);

  if (questions.length === 0) { alert("No questions detected. Check the format."); return; }
  if (!category) { alert("Please select a category."); return; }

  try {
    const res = await apiFetch("/api/admin/ai-questions/bulk-import", {
      method: "POST",
      body: JSON.stringify({
        questions: questions.map((q) => ({ ...q, category })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Imported ${data.imported} questions (${data.skipped} skipped)`);
      document.getElementById("import-textarea").value = "";
      document.getElementById("import-preview").classList.add("hidden");
      document.getElementById("bulk-import-form").classList.add("hidden");
      loadAIQuestions();
    } else {
      alert(data.error || "Import failed.");
    }
  } catch (e) { alert("Network error."); }
}

// ==================
// AI QUESTIONS
// ==================

async function loadAIQuestions() {
  const container = document.getElementById("admin-ai-list");
  container.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res = await apiFetch("/api/admin/ai-questions");
    allAIQuestions = await res.json();

    // Populate category filter
    const catFilter = document.getElementById("ai-category-filter");
    const uniqueCats = [...new Set(allAIQuestions.map((q) => q.category).filter(Boolean))];
    catFilter.innerHTML = '<option value="all">All Categories</option>';
    uniqueCats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catFilter.appendChild(opt);
    });

    renderAIQuestions();
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load AI questions.</p>';
  }
}

function renderAIQuestions() {
  const container = document.getElementById("admin-ai-list");
  const filter = document.getElementById("ai-filter").value;
  const catFilter = document.getElementById("ai-category-filter").value;

  let filtered = allAIQuestions;
  if (filter === "user-submitted") filtered = filtered.filter((q) => q.source === "user");
  if (filter === "ai-generated") filtered = filtered.filter((q) => q.source !== "user");
  if (filter === "has-feedback") filtered = filtered.filter((q) => q.feedback && q.feedback.some((f) => !f.resolved));
  if (filter === "not-added") filtered = filtered.filter((q) => !q.added_to_bank);
  if (filter === "added") filtered = filtered.filter((q) => q.added_to_bank);
  if (catFilter !== "all") filtered = filtered.filter((q) => q.category === catFilter);

  const totalPages = Math.ceil(filtered.length / QUESTIONS_PER_PAGE);
  if (aiPage >= totalPages) aiPage = Math.max(0, totalPages - 1);
  const start = aiPage * QUESTIONS_PER_PAGE;
  const pageItems = filtered.slice(start, start + QUESTIONS_PER_PAGE);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No AI questions found. Generate some via the quiz app with the AI toggle enabled.</p>';
    return;
  }

  let html = "";

  pageItems.forEach((q) => {
    const feedbackHtml = (q.feedback && q.feedback.length > 0)
      ? `<div class="ai-q-feedback">${q.feedback.map((f) => {
          const typeLabels = { wrong_answer: "Wrong Answer", unclear: "Unclear", too_easy: "Too Easy", outdated: "Outdated", duplicate: "Duplicate", other: "Other" };
          return `<div class="ai-q-feedback-item${f.resolved ? " resolved" : ""}">
            <span class="feedback-type-label feedback-type-${f.feedbackType}">${typeLabels[f.feedbackType] || f.feedbackType}</span>
            ${f.suggestedAnswer ? `<span class="feedback-suggested-inline">Suggested: <strong>${escapeHtml(f.suggestedAnswer)}</strong></span>` : ""}
            ${f.comment ? `<span class="feedback-comment-inline">${escapeHtml(f.comment)}</span>` : ""}
            ${f.resolved ? '<span class="feedback-resolved-badge">Resolved</span>' : ""}
          </div>`;
        }).join("")}</div>`
      : "";

    html += `
      <div class="ai-question-card${q.added_to_bank ? " added-to-bank" : ""}${q.feedback && q.feedback.length > 0 ? " has-feedback" : ""}">
        <div class="ai-q-header">
          <span class="feedback-category">${escapeHtml(q.category)}</span>
          ${q.source === "user" ? '<span class="source-badge source-user">User Submitted</span>' : '<span class="source-badge source-ai">AI Generated</span>'}
          ${q.is_irish ? '<span style="background: var(--irish-badge); color: white; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px;">As Gaeilge</span>' : ""}
          ${q.added_to_bank ? '<span class="added-badge">In Bank</span>' : ""}
          ${q.feedback && q.feedback.some((f) => !f.resolved) ? '<span class="feedback-badge">Has Feedback</span>' : ""}
        </div>
        <div class="ai-q-question">${escapeHtml(q.question)}</div>
        <div class="ai-q-answer">${escapeHtml(q.answer)}</div>
        ${feedbackHtml}
        <div class="inline-edit hidden" id="edit-ai-${q.id}">
          <label>Question:<textarea class="edit-q-input" rows="2">${escapeHtml(q.question)}</textarea></label>
          <label>Answer:<input type="text" class="edit-a-input" value="${escapeHtml(q.answer)}"></label>
          <div class="button-row">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('edit-ai-${q.id}').classList.add('hidden')">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="saveAIEdit(${q.id})">Save Changes</button>
          </div>
        </div>
        <div class="ai-q-actions">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('edit-ai-${q.id}').classList.toggle('hidden')">Edit</button>
          ${!q.added_to_bank ? `<button class="btn btn-primary btn-sm" onclick="addAIToBank(${q.id})">Add to Bank</button>` : ""}
          <button class="btn btn-secondary btn-sm btn-danger-text" onclick="deleteAIQuestion(${q.id})">Delete</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="pagination">
      <button onclick="aiPage = 0; renderAIQuestions()" ${aiPage === 0 ? "disabled" : ""}>First</button>
      <button onclick="aiPage--; renderAIQuestions()" ${aiPage === 0 ? "disabled" : ""}>Prev</button>
      <span class="page-info">${aiPage + 1} / ${totalPages} (${filtered.length} questions)</span>
      <button onclick="aiPage++; renderAIQuestions()" ${aiPage >= totalPages - 1 ? "disabled" : ""}>Next</button>
      <button onclick="aiPage = ${totalPages - 1}; renderAIQuestions()" ${aiPage >= totalPages - 1 ? "disabled" : ""}>Last</button>
    </div>
  `;

  container.innerHTML = html;
}

async function addAIToBank(id) {
  try {
    const res = await apiFetch(`/api/admin/ai-questions/${id}/add-to-bank`, {
      method: "POST",
    });
    if (res.ok) {
      showToast("Added to question bank!");
      // Remove from AI questions list after adding to bank
      try {
        await apiFetch(`/api/admin/ai-questions/${id}`, { method: "DELETE" });
      } catch (e) { /* best effort cleanup */ }
      allAIQuestions = allAIQuestions.filter((x) => x.id !== id);
      renderAIQuestions();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add.");
    }
  } catch (e) {
    alert("Network error.");
  }
}

async function saveAIEdit(id) {
  const form = document.getElementById(`edit-ai-${id}`);
  const newQ = form.querySelector(".edit-q-input").value.trim();
  const newA = form.querySelector(".edit-a-input").value.trim();
  if (!newQ || !newA) { alert("Question and answer cannot be empty."); return; }
  try {
    const res = await apiFetch(`/api/admin/ai-questions/${id}/edit`, {
      method: "POST",
      body: JSON.stringify({ question: newQ, answer: newA }),
    });
    if (res.ok) {
      const q = allAIQuestions.find((x) => x.id === id);
      if (q) { q.question = newQ; q.answer = newA; }
      // Resolve any associated feedback
      const feedbacks = q?.feedback || [];
      for (const f of feedbacks) {
        if (!f.resolved) {
          await apiFetch(`/api/feedback/${f.id}`, { method: "PATCH" });
        }
      }
      showToast("Question updated");
      renderAIQuestions();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to update.");
    }
  } catch (e) { alert("Network error."); }
}

async function deleteAIQuestion(id) {
  if (!confirm("Delete this AI question?")) return;
  try {
    await apiFetch(`/api/admin/ai-questions/${id}`, { method: "DELETE" });
    allAIQuestions = allAIQuestions.filter((q) => q.id !== id);
    renderAIQuestions();
    showToast("Deleted");
  } catch (e) {
    alert("Failed to delete.");
  }
}

// ==================
// INIT
// ==================

async function showDashboard() {
  showScreen("admin-dashboard");
  loadStats();
}

async function init() {
  if (await checkAuth()) {
    showDashboard();
  } else {
    adminToken = null;
    localStorage.removeItem("adminToken");
    showScreen("login-screen");
  }
}

init();
