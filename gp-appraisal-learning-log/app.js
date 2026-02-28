(function () {
  "use strict";

  const STORAGE_KEY = "gp-learning-log-records";

  // DOM elements
  const form = document.getElementById("learning-log-form");
  const formView = document.getElementById("form-view");
  const recordsView = document.getElementById("records-view");
  const btnNew = document.getElementById("btn-new");
  const btnRecords = document.getElementById("btn-records");
  const btnClear = document.getElementById("btn-clear");
  const btnExport = document.getElementById("btn-export");
  const searchInput = document.getElementById("search-input");
  const recordsList = document.getElementById("records-list");
  const noRecords = document.getElementById("no-records");
  const recordCount = document.getElementById("record-count");
  const btnSave = document.getElementById("btn-save");

  let editingId = null;

  // --- Storage helpers ---
  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    updateRecordCount();
  }

  function updateRecordCount() {
    const count = loadRecords().length;
    recordCount.textContent = count;
  }

  // --- Navigation ---
  function showForm() {
    formView.classList.remove("hidden");
    recordsView.classList.add("hidden");
    btnNew.classList.add("active");
    btnRecords.classList.remove("active");
  }

  function showRecords() {
    formView.classList.add("hidden");
    recordsView.classList.remove("hidden");
    btnNew.classList.remove("active");
    btnRecords.classList.add("active");
    renderRecords();
  }

  btnNew.addEventListener("click", showForm);
  btnRecords.addEventListener("click", showRecords);

  // --- Toast ---
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }

  // --- Validation ---
  function clearErrors() {
    form.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
    form.querySelectorAll(".error-msg").forEach(function (el) {
      el.remove();
    });
  }

  function showError(element, message) {
    element.classList.add("invalid");
    var msg = document.createElement("div");
    msg.className = "error-msg";
    msg.textContent = message;
    element.parentNode.appendChild(msg);
  }

  function validateForm() {
    clearErrors();
    var valid = true;

    var date = document.getElementById("activity-date");
    if (!date.value) {
      showError(date, "Please select a date.");
      valid = false;
    }

    var length = document.getElementById("session-length");
    if (!length.value || parseFloat(length.value) <= 0) {
      showError(length, "Please enter session length.");
      valid = false;
    }

    var title = document.getElementById("session-title");
    if (!title.value.trim()) {
      showError(title, "Please enter a session title.");
      valid = false;
    }

    var sessionType = form.querySelector('input[name="sessionType"]:checked');
    if (!sessionType) {
      var fieldset = form.querySelector('input[name="sessionType"]').closest("fieldset");
      showError(fieldset, "Please select a session type.");
      valid = false;
    }

    var description = document.getElementById("learning-description");
    if (!description.value.trim()) {
      showError(description, "Please describe your learning.");
      valid = false;
    }

    return valid;
  }

  // --- Collect form data ---
  function collectFormData() {
    var checkedDomains = [];
    form.querySelectorAll('input[name="domains"]:checked').forEach(function (cb) {
      checkedDomains.push(cb.value);
    });

    var checkedSubDomains = [];
    form.querySelectorAll('input[name="subDomains"]:checked').forEach(function (cb) {
      checkedSubDomains.push(cb.value);
    });

    var sessionTypeEl = form.querySelector('input[name="sessionType"]:checked');

    return {
      id: editingId || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      activityDate: document.getElementById("activity-date").value,
      sessionLength: parseFloat(document.getElementById("session-length").value),
      sessionTitle: document.getElementById("session-title").value.trim(),
      sessionType: sessionTypeEl ? sessionTypeEl.value : "",
      domains: checkedDomains,
      subDomains: checkedSubDomains,
      learningDescription: document.getElementById("learning-description").value.trim(),
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- Populate form for editing ---
  function populateForm(record) {
    document.getElementById("activity-date").value = record.activityDate;
    document.getElementById("session-length").value = record.sessionLength;
    document.getElementById("session-title").value = record.sessionTitle;

    // Session type
    var radio = form.querySelector('input[name="sessionType"][value="' + CSS.escape(record.sessionType) + '"]');
    if (radio) radio.checked = true;

    // Domains
    form.querySelectorAll('input[name="domains"]').forEach(function (cb) {
      cb.checked = record.domains.indexOf(cb.value) !== -1;
    });

    // Sub-domains
    form.querySelectorAll('input[name="subDomains"]').forEach(function (cb) {
      cb.checked = record.subDomains.indexOf(cb.value) !== -1;
    });

    document.getElementById("learning-description").value = record.learningDescription;
  }

  // --- Form submit ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    var data = collectFormData();
    var records = loadRecords();

    if (editingId) {
      var idx = records.findIndex(function (r) { return r.id === editingId; });
      if (idx !== -1) {
        data.createdAt = records[idx].createdAt;
        records[idx] = data;
      }
      editingId = null;
      btnSave.textContent = "Save Entry";
      showToast("Entry updated successfully");
    } else {
      records.unshift(data);
      showToast("Entry saved successfully");
    }

    saveRecords(records);
    form.reset();
    clearErrors();
    showRecords();
  });

  // --- Clear form ---
  btnClear.addEventListener("click", function () {
    form.reset();
    clearErrors();
    editingId = null;
    btnSave.textContent = "Save Entry";
  });

  // --- Render records ---
  function formatDate(dateStr) {
    if (!dateStr) return "";
    var parts = dateStr.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function renderRecords(filter) {
    var records = loadRecords();
    var query = (filter || searchInput.value).toLowerCase().trim();

    if (query) {
      records = records.filter(function (r) {
        return (
          r.sessionTitle.toLowerCase().indexOf(query) !== -1 ||
          r.sessionType.toLowerCase().indexOf(query) !== -1 ||
          r.learningDescription.toLowerCase().indexOf(query) !== -1 ||
          r.domains.join(" ").toLowerCase().indexOf(query) !== -1 ||
          r.subDomains.join(" ").toLowerCase().indexOf(query) !== -1
        );
      });
    }

    recordsList.innerHTML = "";

    if (records.length === 0) {
      noRecords.classList.remove("hidden");
      return;
    }

    noRecords.classList.add("hidden");

    records.forEach(function (record) {
      var card = document.createElement("div");
      card.className = "record-card";

      var domainTags = record.domains
        .map(function (d) { return '<span class="tag domain">' + escapeHtml(d) + "</span>"; })
        .join("");

      var subDomainTags = record.subDomains
        .map(function (d) { return '<span class="tag">' + escapeHtml(d) + "</span>"; })
        .join("");

      var descriptionPreview = record.learningDescription.length > 200
        ? record.learningDescription.substring(0, 200) + "..."
        : record.learningDescription;

      card.innerHTML =
        '<div class="record-header">' +
        '  <div class="record-title">' + escapeHtml(record.sessionTitle) + "</div>" +
        "</div>" +
        '<div class="record-meta">' +
        "  <span>Date: " + formatDate(record.activityDate) + "</span>" +
        "  <span>Duration: " + record.sessionLength + " hrs</span>" +
        "  <span>Type: " + escapeHtml(record.sessionType) + "</span>" +
        "</div>" +
        '<div class="record-tags">' + domainTags + subDomainTags + "</div>" +
        '<div class="record-description">' + escapeHtml(descriptionPreview) + "</div>" +
        '<div class="record-actions">' +
        '  <button class="btn-edit" data-id="' + record.id + '">Edit</button>' +
        '  <button class="btn-danger" data-id="' + record.id + '">Delete</button>' +
        "</div>";

      recordsList.appendChild(card);
    });

    // Event delegation for edit/delete
    recordsList.querySelectorAll(".btn-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        editRecord(btn.dataset.id);
      });
    });

    recordsList.querySelectorAll(".btn-danger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteRecord(btn.dataset.id);
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Edit ---
  function editRecord(id) {
    var records = loadRecords();
    var record = records.find(function (r) { return r.id === id; });
    if (!record) return;

    editingId = id;
    populateForm(record);
    btnSave.textContent = "Update Entry";
    showForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- Delete ---
  function deleteRecord(id) {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    var records = loadRecords().filter(function (r) { return r.id !== id; });
    saveRecords(records);
    renderRecords();
    showToast("Entry deleted");
  }

  // --- Search ---
  searchInput.addEventListener("input", function () {
    renderRecords();
  });

  // --- Export CSV ---
  btnExport.addEventListener("click", function () {
    var records = loadRecords();
    if (records.length === 0) {
      showToast("No records to export");
      return;
    }

    var headers = [
      "Date of Activity",
      "Length (hrs)",
      "Title",
      "Session Type",
      "Domains",
      "Sub-Domains",
      "Learning Description"
    ];

    var rows = records.map(function (r) {
      return [
        formatDate(r.activityDate),
        r.sessionLength,
        csvEscape(r.sessionTitle),
        csvEscape(r.sessionType),
        csvEscape(r.domains.join("; ")),
        csvEscape(r.subDomains.join("; ")),
        csvEscape(r.learningDescription)
      ].join(",");
    });

    var csv = headers.join(",") + "\n" + rows.join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "gp-learning-log-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  });

  function csvEscape(str) {
    if (!str) return '""';
    if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // --- Init ---
  updateRecordCount();
})();
