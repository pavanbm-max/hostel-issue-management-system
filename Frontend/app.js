
/* =========================
   GLOBALS
========================= */
let allIssues = [];
// Client-side cache for resolution notes (helps preserve typed text across re-renders)
window.__notes = window.__notes || {};



/* =========================
   LOGIN FUNCTION
========================= */
async function login() {
  const msgEl = document.getElementById("msg");
  msgEl.innerText = "";

  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const submitBtn = document.querySelector('#loginForm button[type="submit"]');

  console.log("🟢 login fired", { email });

  if (!email || !password) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Please enter email and password";
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    console.log("🔁 login response status:", res.status);
    const data = await res.json();
    console.log("📡 login response data:", data);

    if (!res.ok) {
      msgEl.style.color = "#dc2626";
      const errMsg = data.message || (typeof data.error === 'string' ? data.error : (data.error && data.error.message)) || "Login failed";
      msgEl.innerText = errMsg;
      console.error("Login failed details:", data);
      document.getElementById("password").value = "";
      return;
    }

    // Save auth info
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("name", data.name);

    // Redirect based on role
    if (data.role === "management") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "student.html";
    }

  } catch (err) {
    console.error("Login error:", err);
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Server error. Please try again.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* =========================
   STUDENT: SUBMIT ISSUE
========================= */
async function submitIssue() {
  const msgEl = document.getElementById("msg");
  msgEl.innerText = "";

  const submitBtn = document.querySelector('#issueForm button[type="submit"]');
  const token = localStorage.getItem("token");

  if (!token) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Please login to report an issue";
    setTimeout(() => (window.location.href = "login.html"), 900);
    return;
  }

  const title = document.getElementById("title")?.value?.trim();
  const description = document.getElementById("description")?.value?.trim();
  const category = document.getElementById("category")?.value;
  const priority = document.getElementById("priority")?.value;
  const hostel = document.getElementById("hostel")?.value?.trim();
  const room = document.getElementById("room")?.value?.trim();
  const contact = document.getElementById("contact")?.value?.trim();

  if (!title || !description || !category || !priority || !hostel || !room) {
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Please fill in all required fields";
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;

    console.log("🟢 submitIssue fired", { title, hostel, room, category, priority });

    const res = await fetch("http://localhost:5000/api/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ title, description, category, priority, hostel, room, contact })
    });

    const data = await res.json();
    console.log("📡 submitIssue response:", res.status, data);

    if (!res.ok) {
      msgEl.style.color = "#dc2626";
      msgEl.innerText = data.message || (data.error && data.error.message) || "Failed to submit issue";
      return;
    }

    msgEl.style.color = "#16a34a";
    msgEl.innerText = "Issue submitted successfully ✅";
    document.getElementById("issueForm").reset();

  } catch (err) {
    console.error("❌ submitIssue error:", err);
    msgEl.style.color = "#dc2626";
    msgEl.innerText = "Server error. Please try again.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* =========================
   ADMIN: LOAD DASHBOARD
========================= */
async function loadAdminDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const statsRes = await fetch(
      "http://localhost:5000/api/issues/stats/summary",
      { headers: { Authorization: "Bearer " + token } }
    );

    const stats = await statsRes.json();

    document.getElementById("totalIssues").innerText = stats.totalIssues;
    document.getElementById("pendingIssues").innerText = stats.pendingIssues;
    document.getElementById("resolvedIssues").innerText = stats.resolvedIssues;
    document.getElementById("inProgressIssues").innerText = stats.highPriorityIssues;

    const issuesRes = await fetch(
      "http://localhost:5000/api/issues",
      { headers: { Authorization: "Bearer " + token } }
    );

    const issuesData = await issuesRes.json();
    allIssues = Array.isArray(issuesData) ? issuesData : [];
    renderIssues(allIssues);

  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
  }
}

/* =========================
   RENDER ISSUES
========================= */
function renderIssues(issues) {
  const tableBody = document.getElementById("issuesTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  issues.forEach(issue => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${issue._id.slice(-4)}</td>
      <td>${issue.title}</td>
      <td>${issue.hostel}-${issue.room}</td>
      <td>${issue.category}</td>
      <td>
        <span class="priority">
          <span class="priority-dot priority-${issue.priority}"></span>
          ${issue.priority}
        </span>
      </td>
      <td>
        <span class="badge badge-${issue.status}">${issue.status}</span>
      </td>
      <td>${new Date(issue.createdAt).toLocaleDateString()}</td>
      <td>
        <button type="button" class="action-btn view" data-id="${issue._id}">
          View
        </button>
      </td>
    `;

    const detailsRow = document.createElement("tr");
    detailsRow.id = `details-${issue._id}`;
    detailsRow.style.display = "none";

    const noteValue = (window.__notes && window.__notes[issue._id]) ? window.__notes[issue._id] : (issue.resolutionNote || '');

    detailsRow.innerHTML = `
      <td colspan="8" style="background:#f9fafb; padding:12px;">
        <strong>Description:</strong> ${issue.description}<br><br>

        <strong>Resolution Note:</strong><br>
        <textarea
          id="note-${issue._id}"
          style="width:100%; min-height:60px;"
          placeholder="Enter resolution proof..."
          oninput="(window.__notes = window.__notes || {}), window.__notes['${issue._id}'] = this.value"
        >${noteValue}</textarea>

        <br><br>
        <button
  type="button"
  class="action-btn resolve"
  data-id="${issue._id}"
>
  Resolve Now
</button>

      </td>
    `;

    tableBody.appendChild(row);
    tableBody.appendChild(detailsRow);
  });
}

/* =========================
   VIEW TOGGLE
========================= */
document.addEventListener("click", async e => {
  if (e.target.classList.contains("view")) {
    const id = e.target.dataset.id;
    const row = document.getElementById(`details-${id}`);
    if (row) {
      const show = row.style.display === "none" ? "table-row" : "none";
      row.style.display = show;
      // autofocus the textarea when details open
      if (show === 'table-row') {
        setTimeout(() => {
          const t = document.getElementById(`note-${id}`);
          if (t) t.focus();
        }, 0);
      }
    }
  }

  if (e.target.classList.contains("resolve")) {
    const btn = e.target;
    const id = btn.dataset.id || btn.getAttribute('data-id');
    if (!id) return;

    const textarea = document.getElementById(`note-${id}`);
    // Prefer the cached note (typed at any time), then textarea value, then empty
    const note = (window.__notes && window.__notes[id] ? window.__notes[id].trim() : (textarea ? textarea.value.trim() : '')) || '';

    // disable button and show progress
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerText = 'Resolving...';

    try {
      await resolveIssue(id, note);
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
});

/* =========================
   RESOLVE ISSUE (FIXED)
========================= */
/* =========================
   RESOLVE ISSUE
========================= */


async function resolveIssue(issueId, noteFromButton = null) {
  console.log("🟢 resolveIssue fired:", issueId);

  const token = localStorage.getItem("token");
  let noteEl = document.getElementById(`note-${issueId}`);
  const adminMsg = document.getElementById("adminMsg");
  if (adminMsg) adminMsg.innerText = "";

  // If caller passed the note directly (read at click time), prefer it
  let note = (typeof noteFromButton === 'string') ? (noteFromButton || '').trim() : null;

  // If we don't have a note yet, try to read from DOM
  if (note === null) {
    if (!noteEl) {
      const row = document.getElementById(`details-${issueId}`);
      if (row) {
        row.style.display = 'table-row';
        // re-query after DOM change
        noteEl = document.getElementById(`note-${issueId}`);
        if (noteEl) noteEl.focus();
      }
    }

    // If still missing, prompt the user for a note (fallback)
    note = noteEl ? noteEl.value.trim() : null;
    if (!noteEl && note === null) {
      note = prompt("Enter resolution note (leave empty to resolve without note):", "") || "";
    }
  }

  if (!note) {
    const proceed = confirm("No resolution note entered. Resolve this issue anyway?");
    if (!proceed) return;
  }

  console.log("📤 Sending resolve request");
  console.log("Issue ID:", issueId);
  console.log("Token:", localStorage.getItem("token"));
  console.log("Resolution note:", note);

  try {
    const res = await fetch(
      `http://localhost:5000/api/issues/${issueId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          resolutionNote: note
        })
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.message || (typeof data.error === 'string' ? data.error : (data.error && data.error.message)) || "Failed to resolve issue";
      if (adminMsg) {
        adminMsg.style.color = "#dc2626";
        adminMsg.innerText = errMsg;
      }
      console.error("Resolve failed:", res.status, data);
      return;
    }

    // Update local cache and UI so changes reflect immediately
    const updatedIssue = data;
    const idx = allIssues.findIndex(i => i._id === updatedIssue._id);
    if (idx !== -1) {
      allIssues[idx] = updatedIssue;
    } else {
      allIssues.unshift(updatedIssue);
    }

    // Clear cached note for this issue
    if (window.__notes) delete window.__notes[issueId];

    // Re-render and close details row
    renderIssues(allIssues);
    const row = document.getElementById(`details-${issueId}`);
    if (row) row.style.display = 'none';

    if (adminMsg) {
      adminMsg.style.color = "#16a34a";
      adminMsg.innerText = "Issue resolved ✅";
    }

  } catch (err) {
    console.error("❌ Resolve failed", err);
    if (adminMsg) {
      adminMsg.style.color = "#dc2626";
      adminMsg.innerText = "Server error. See console for details.";
    }
  }
}

/* =========================
   FILTERS
========================= */
document.addEventListener("change", () => {
  const status = document.getElementById("statusFilter")?.value || "all";
  const category = document.getElementById("categoryFilter")?.value || "all";

  let filtered = [...allIssues];

  if (status !== "all") filtered = filtered.filter(i => i.status === status);
  if (category !== "all") filtered = filtered.filter(i => i.category === category);

  renderIssues(filtered);
});
