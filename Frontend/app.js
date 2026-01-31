console.log("🔥 THIS IS FRONTEND/app.js");
alert("FRONTEND JS LOADED");

/* =========================
   GLOBALS
========================= */
let allIssues = [];

window.alert = () => {};
window.confirm = () => true;

/* =========================
   LOGIN FUNCTION
========================= */
async function login() { /* unchanged */ }

/* =========================
   STUDENT: SUBMIT ISSUE
========================= */
async function submitIssue() { /* unchanged */ }

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

    detailsRow.innerHTML = `
      <td colspan="8" style="background:#f9fafb; padding:12px;">
        <strong>Description:</strong> ${issue.description}<br><br>

        <strong>Resolution Note:</strong><br>
        <textarea
          id="note-${issue._id}"
          style="width:100%; min-height:60px;"
          placeholder="Enter resolution proof..."
        ></textarea>

        <br><br>
        <button
  type="button"
  class="action-btn resolve"
  onclick="resolveIssue('${issue._id}')"
>
  Confirm Resolve
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
document.addEventListener("click", e => {
  if (e.target.classList.contains("view")) {
    const id = e.target.dataset.id;
    const row = document.getElementById(`details-${id}`);
    if (row) {
      row.style.display =
        row.style.display === "none" ? "table-row" : "none";
    }
  }
});

/* =========================
   RESOLVE ISSUE (FIXED)
========================= */
/* =========================
   RESOLVE ISSUE
========================= */
console.log("🧪 Looking for textarea:", `note-${issueId}`);

async function resolveIssue(issueId) {
  console.log("🟢 resolveIssue fired:", issueId);

  const token = localStorage.getItem("token");
  const noteEl = document.getElementById(`note-${issueId}`);

  if (!noteEl || !noteEl.value.trim()) {
    alert("Please enter a resolution note");
    return;
  }
console.log("📤 Sending resolve request");
console.log("Issue ID:", issueId);
console.log("Token:", localStorage.getItem("token"));
console.log("Resolution note:", noteEl.value);

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
          resolutionNote: noteEl.value
        })
      }
    );

    if (!res.ok) {
      alert("Failed to resolve issue");
      return;
    }

    alert("Issue resolved ✅");
    loadAdminDashboard();

  } catch (err) {
    console.error("❌ Resolve failed", err);
    alert("Server error");
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
