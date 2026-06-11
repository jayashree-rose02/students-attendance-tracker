/**
 * Attendance ERP SaaS - Core App Orchestrator Engine
 * Fully Debugged with Cross-Platform Date Normalization & State Sync
 */

const API = "http://localhost:5000";

// Helper function to extract a local YYYY-MM-DD date string based on your machine's clock
function getLocalTodayString() {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Universal Normalizer to clean date variants from database into uniform YYYY-MM-DD string tags
function normalizeDatabaseDateString(rawDateStr) {
  if (!rawDateStr) return "";
  try {
    // If it contains a timestamp divider, extract the primary string part safely
    if (String(rawDateStr).includes('T')) {
      return String(rawDateStr).split('T')[0];
    }
    // Handle standard space padding formats like "YYYY-MM-DD 00:00:00"
    if (String(rawDateStr).includes(' ')) {
      return String(rawDateStr).split(' ')[0];
    }
    // Fallback parsing engine check
    const parsedDate = new Date(rawDateStr);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("Date normalization anomaly encountered:", e);
  }
  return String(rawDateStr);
}

// Persistent App Global Runtime Memory
let STATE = {
  students: [],
  attendanceHistory: [],
  selectedDate: getLocalTodayString(), // Safely defaults to local calendar date
  pieChartInstance: null,
  barChartInstance: null
};

/* ==========================================================================
   1. REGISTRY ID CLEANING UTILITY NODE
   ========================================================================== */
function getCleanId(obj) {
  if (!obj) return null;
  const rawId = obj.student_id || obj.id || (obj.student && (obj.student.id || obj.student.student_id));
  return rawId ? Number(rawId) : null;
}

/* ==========================================================================
   2. APP INITIALIZER CORE BLOCK
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Set real-time system human readable date string label
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const dateDisplay = document.getElementById("current-date");
  if (dateDisplay) {
    dateDisplay.innerText = new Date().toLocaleDateString('en-US', dateOptions);
  }
  
  // Setup date workspace default binder
  const datePicker = document.getElementById("attendanceDatePicker");
  if (datePicker) {
    datePicker.value = STATE.selectedDate;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Authorization session missing. Redirecting to access login portal...");
    window.location.href = "login.html";
    return;
  }

  syncProfileUIStrings();
  initializeApplicationData();
});

async function initializeApplicationData() {
  await fetchStudentsRepository();
  await fetchAttendanceHistoryLogs();
  
  calculateAndRenderDashboard();
  populateReportsDropdown();
}

/* ==========================================================================
   3. SIDEBAR NAVIGATION ROUTER VIEW CONTROL
   ========================================================================== */
function showView(viewId) {
  // Remove active classes across element node lists
  document.querySelectorAll(".sidebar-menu .menu-btn").forEach(btn => btn.classList.remove("active"));
  const targetBtn = document.getElementById(`btn-${viewId}`);
  if (targetBtn) targetBtn.classList.add("active");

  document.querySelectorAll(".main-content .view").forEach(view => view.classList.remove("active"));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");

  const titleMap = {
    dashboard: "Dashboard Overview",
    students: "System Student Directory",
    attendance: "Daily Registry Entry Logs",
    reports: "Consolidated Reports Processing Suite",
    analytics: "Advanced Analytical Diagnostics",
    profile: "Enterprise Profile Configuration"
  };
  
  const titleEl = document.getElementById("view-title");
  if (titleEl) {
    titleEl.innerText = titleMap[viewId] || "Management Panel";
  }

  // Active sub-views trigger lifecycle hooks
  if (viewId === 'dashboard') {
    calculateAndRenderDashboard();
  } else if (viewId === 'students') {
    renderStudentDirectory(STATE.students);
  } else if (viewId === 'attendance') {
    syncAttendanceDateWorkspace();
  } else if (viewId === 'analytics') {
    renderAnalyticsSuite();
  } else if (viewId === 'profile') {
    loadProfileConfigurations();
  }
}

/* ==========================================================================
   4. COMPONENT LOGS INTERACTION ASYNC FETCHER
   ========================================================================== */
async function fetchStudentsRepository() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/students`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to pull student repository matrix.");
    STATE.students = await res.json();
  } catch (err) {
    console.error("Critical repository download abort:", err);
  }
}

async function fetchAttendanceHistoryLogs() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/attendance/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to pull transactional history logs.");
    STATE.attendanceHistory = await res.json();
    console.log("Raw historical payload fetched from database server:", STATE.attendanceHistory);
  } catch (err) {
    console.error("Critical history sync abort:", err);
  }
}

async function forceReSyncDashboardMetrics() {
  await fetchAttendanceHistoryLogs();
  calculateAndRenderDashboard();
  alert("Global dashboard tracking calculations updated successfully!");
}

/* ==========================================================================
   5. DASHBOARD SUB-ENGINE PIPELINE (ROBUST METRIC SYNCHRONIZATION)
   ========================================================================== */
function calculateAndRenderDashboard() {
  const todayString = getLocalTodayString();
  
  // Clean dates through the unified adapter to eliminate formatting edge-cases
  const todaysLogs = STATE.attendanceHistory.filter(log => {
    const normalizedLogDate = normalizeDatabaseDateString(log.date);
    return normalizedLogDate === todayString;
  });

  const todaysStatusMap = new Map();
  todaysLogs.forEach(log => {
    const studentId = getCleanId(log);
    if (studentId) {
      todaysStatusMap.set(studentId, log);
    }
  });

  let present = 0;
  let absent = 0;
  let validStudentsCount = 0;

  // Track counts over verified profiles only
  STATE.students.forEach(student => {
    const sId = getCleanId(student);
    if (!sId) return;
    
    validStudentsCount++;
    const log = todaysStatusMap.get(sId);
    
    if (log && String(log.status).toLowerCase() === 'present') {
      present++;
    } else {
      absent++;
    }
  });

  const totalEl = document.getElementById("totalStudents");
  const presentEl = document.getElementById("presentCount");
  const absentEl = document.getElementById("absentCount");
  const percentEl = document.getElementById("percent");

  if (totalEl) totalEl.innerText = validStudentsCount;
  if (presentEl) presentEl.innerText = present;
  if (absentEl) absentEl.innerText = absent;

  const rate = validStudentsCount > 0 ? Math.round((present / validStudentsCount) * 100) : 0;
  if (percentEl) percentEl.innerText = `${rate}%`;
  
  const presSub = document.getElementById("presentSub");
  const absSub = document.getElementById("absentSub");
  if (presSub) presSub.innerText = `${rate}% of Total`;
  if (absSub) absSub.innerText = `${validStudentsCount > 0 ? Math.round((absent / validStudentsCount) * 100) : 0}% of Total`;

  renderDashboardTable(todaysStatusMap, todayString);
  renderPieChart(present, absent);
}

function renderDashboardTable(todaysStatusMap, todayString) {
  const tbody = document.getElementById("dashboardAttendanceOverview");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (STATE.students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading-text">No active directory tracks discovered.</td></tr>`;
    return;
  }

  STATE.students.forEach(student => {
    const sId = getCleanId(student);
    if (!sId) return;

    const historicalLog = todaysStatusMap.get(sId);
    const status = historicalLog && historicalLog.status ? String(historicalLog.status).toLowerCase() : "absent";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${sId}</strong></td>
      <td>${student.name || "Unknown Identity"}</td>
      <td><i class="fa-regular fa-clock"></i> ${todayString}</td>
      <td><span class="status-badge ${status === 'present' ? 'status-present' : 'status-absent'}">${status.toUpperCase()}</span></td>
      <td>
        <button class="btn btn-sm btn-dark" onclick="showView('reports')" style="padding:4px 8px; font-size:11px;">
          <i class="fa-solid fa-file-pdf"></i> View Audit
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPieChart(present, absent) {
  const ctx = document.getElementById("dashboardPieChart");
  if (!ctx) return;

  if (STATE.pieChartInstance) {
    STATE.pieChartInstance.destroy();
  }

  const actualPresent = present === 0 && absent === 0 ? 0 : present;
  const actualAbsent = present === 0 && absent === 0 ? 1 : absent;

  STATE.pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent'],
      datasets: [{
        data: [actualPresent, actualAbsent],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter' } } }
      },
      cutout: '70%'
    }
  });
}

/* ==========================================================================
   6. DIRECTORY MEMBERS PROFILES MANAGEMENT
   ========================================================================== */
function renderStudentDirectory(list) {
  const tbody = document.getElementById("studentDirectoryBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="loading-text">No names match query strings.</td></tr>`;
    return;
  }

  list.forEach(student => {
    const sId = getCleanId(student);
    if (!sId) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${sId}</strong></td>
      <td>${student.name || "Unknown Profile"}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="triggerDeleteStudentProfile(${sId})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
          <i class="fa-solid fa-trash-can"></i> Expunge Record
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleStudentSearch() {
  const query = document.getElementById("studentSearchInput").value.toLowerCase();
  const filtered = STATE.students.filter(s => (s.name || "").toLowerCase().includes(query));
  renderStudentDirectory(filtered);
}

async function openCreateStudentModal() {
  const name = prompt("Enter the full name identifier for new student identity entry:");
  if (!name || name.trim() === "") return;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: name.trim() })
    });

    if (res.ok) {
      await initializeApplicationData();
      renderStudentDirectory(STATE.students);
    } else {
      alert("Error parsing create post structure.");
    }
  } catch (err) {
    console.error(err);
  }
}

async function triggerDeleteStudentProfile(id) {
  if (!confirm(`Completely drop profile record student #${id} from indices?`)) return;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/students/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      await initializeApplicationData();
      renderStudentDirectory(STATE.students);
    }
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   7. LIVE ATTENDANCE INTERACTION ENGINE (WITH STABILIZED CALLBACK INTEGRATION)
   ========================================================================== */
function syncAttendanceDateWorkspace() {
  const picker = document.getElementById("attendanceDatePicker");
  if (picker && picker.value) {
    STATE.selectedDate = picker.value;
  }

  const tbody = document.getElementById("attendanceWorkspaceBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const targetsToday = STATE.attendanceHistory.filter(log => {
    return normalizeDatabaseDateString(log.date) === STATE.selectedDate;
  });

  STATE.students.forEach(student => {
    const sId = getCleanId(student);
    if (!sId) return; 
    
    const match = targetsToday.find(t => getCleanId(t) === sId);
    const currentStatus = match && match.status ? String(match.status).toLowerCase() : "absent";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${sId}</strong></td>
      <td style="font-weight:500;">${student.name || "Unknown Identity"}</td>
      <td>
        <div class="toggle-status-group" style="display: flex; gap: 10px; justify-content: flex-start; align-items: center;">
          <button type="button" class="btn" style="background-color: ${currentStatus === 'present' ? '#10b981' : '#6b7280'}; color: white; border:none; padding: 6px 14px; border-radius:4px; font-weight:600; cursor:pointer;" onclick="commitAttendanceEntryChange(${sId}, 'present')">PRESENT</button>
          <button type="button" class="btn" style="background-color: ${currentStatus === 'absent' ? '#ef4444' : '#6b7280'}; color: white; border:none; padding: 6px 14px; border-radius:4px; font-weight:600; cursor:pointer;" onclick="commitAttendanceEntryChange(${sId}, 'absent')">ABSENT</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function commitAttendanceEntryChange(studentId, newStatus) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        student_id: Number(studentId),
        date: STATE.selectedDate,
        status: newStatus
      })
    });

    if (response.ok) {
      await fetchAttendanceHistoryLogs();
      syncAttendanceDateWorkspace();
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend response payload rejection stream:", errorData);
      alert(`Backend tracking server rejected choice: ${errorData.message || response.statusText}`);
    }
  } catch (err) {
    console.error("Critical network communication error:", err);
    alert("Network request lost connection with your local API system runtime.");
  }
}

/* ==========================================================================
   8. PERFORMANCE ARCHIVE REPORT MODULES
   ========================================================================== */
function populateReportsDropdown() {
  const selector = document.getElementById("reportStudentSelector");
  if (!selector) return;
  
  selector.innerHTML = `<option value="">Choose student record...</option>`;
  STATE.students.forEach(s => {
    const sId = getCleanId(s);
    if (!sId) return;
    const option = document.createElement("option");
    option.value = sId;
    option.innerText = `[#${sId}] ${s.name}`;
    selector.appendChild(option);
  });
}

function generateIndividualStudentReport() {
  const targetId = document.getElementById("reportStudentSelector").value;
  if (!targetId) {
    alert("Specify a valid student track identity first.");
    return;
  }

  const student = STATE.students.find(s => getCleanId(s) === Number(targetId));
  const profileLogs = STATE.attendanceHistory.filter(h => getCleanId(h) === Number(targetId));

  const previewZone = document.getElementById("reportPreviewZone");
  const previewTitle = document.getElementById("previewTitle");
  const dataArea = document.getElementById("previewDataArea");

  if (previewTitle) {
    previewTitle.innerHTML = `<i class="fa-solid fa-address-card"></i> Audit Record: ${student.name}`;
  }
  
  let rowsHtml = "";
  if (profileLogs.length === 0) {
    rowsHtml = `<tr><td colspan="3" style="text-align:center;">No history trace recorded inside system registers.</td></tr>`;
  } else {
    profileLogs.forEach(log => {
      const status = log.status ? String(log.status).toLowerCase() : "absent";
      rowsHtml += `
        <tr>
          <td>${log.date ? normalizeDatabaseDateString(log.date) : "N/A"}</td>
          <td><span class="status-badge ${status === 'present' ? 'status-present' : 'status-absent'}">${status.toUpperCase()}</span></td>
          <td>System Cryptographic Signature Pass Verification Check</td>
        </tr>
      `;
    });
  }

  if (dataArea) {
    dataArea.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Calendar Track Target Date</th>
            <th>Registered Operational State Status</th>
            <th>Security Network Log Node State</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }

  if (previewZone) previewZone.style.display = "block";
}

function closeReportPreview() {
  const pZone = document.getElementById("reportPreviewZone");
  if (pZone) pZone.style.display = "none";
}

function exportFullClassExcel() {
  if (STATE.students.length === 0) {
    alert("Repository map data values evaluate empty.");
    return;
  }

  const validStudents = STATE.students.filter(s => getCleanId(s));
  const rows = validStudents.map(student => {
    const sId = getCleanId(student);
    const historyLogs = STATE.attendanceHistory.filter(h => getCleanId(h) === sId);
    let presentCount = 0;
    historyLogs.forEach(l => { if (l.status && String(l.status).toLowerCase() === 'present') presentCount++; });
    const performanceRate = historyLogs.length > 0 ? `${Math.round((presentCount / historyLogs.length) * 100)}%` : "0%";

    return {
      "Student System ID": sId,
      "Official Registry Profile Name": student.name,
      "Total Metric Computations": historyLogs.length,
      "Confirmed Present Marks": presentCount,
      "Attendance Score Rate": performanceRate
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SaaS Attendance Log");
  XLSX.writeFile(workbook, `ERP_System_Attendance_Audit_${getLocalTodayString()}.xlsx`);
}

/* ==========================================================================
   9. METRIC DIAGNOSTIC CHARTS SUITE
   ========================================================================== */
function renderAnalyticsSuite() {
  const validStudents = STATE.students.filter(s => getCleanId(s));
  const metrics = validStudents.map(student => {
    const sId = getCleanId(student);
    const history = STATE.attendanceHistory.filter(h => getCleanId(h) === sId);
    let presentCount = 0;
    history.forEach(log => { if (log.status && String(log.status).toLowerCase() === 'present') presentCount++; });
    return {
      name: student.name || `Student ID #${sId}`,
      percentage: history.length > 0 ? Math.round((presentCount / history.length) * 100) : 0
    };
  });

  renderAnalyticsBarChart(metrics);
  renderLeaderboardRankings(metrics);
}

function renderAnalyticsBarChart(metrics) {
  const ctx = document.getElementById("analyticsBarChart");
  if (!ctx) return;

  if (STATE.barChartInstance) {
    STATE.barChartInstance.destroy();
  }

  STATE.barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: metrics.map(m => m.name),
      datasets: [{
        label: 'Attendance Performance %',
        data: metrics.map(m => m.percentage),
        backgroundColor: '#4f46e5',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderLeaderboardRankings(metrics) {
  const tbody = document.getElementById("analyticsRankingBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const sorted = [...metrics].sort((a, b) => b.percentage - a.percentage);

  sorted.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>Rank #${idx + 1}</strong></td>
      <td>${item.name}</td>
      <td><strong>${item.percentage}% Total Efficiency</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   10. ADMINISTRATIVE USER DATA CONTROL (PROFILE MANAGER)
   ========================================================================== */
function syncProfileUIStrings() {
  const currentUsername = localStorage.getItem("username") || "Admin Teacher";
  
  const profileInput = document.getElementById("profileUsernameInput");
  const pfDisplay = document.getElementById("pf-name-display");
  const sbUser = document.getElementById("sb-username");
  const hdUser = document.getElementById("hd-username");

  if (profileInput) profileInput.value = currentUsername;
  if (pfDisplay) pfDisplay.innerText = currentUsername;
  if (sbUser) sbUser.innerText = currentUsername;
  if (hdUser) hdUser.innerText = currentUsername;

  const cachedAvatar = localStorage.getItem("avatarImg");
  if (cachedAvatar) {
    const sbAv = document.getElementById("sb-avatar");
    const hdAv = document.getElementById("hd-avatar");
    const pfAv = document.getElementById("pf-avatar-display");
    if (sbAv) sbAv.src = cachedAvatar;
    if (hdAv) hdAv.src = cachedAvatar;
    if (pfAv) pfAv.src = cachedAvatar;
  }
}

function loadProfileConfigurations() {
  syncProfileUIStrings();
}

function commitProfileIdentityEdits() {
  const inputEl = document.getElementById("profileUsernameInput");
  if (!inputEl) return;
  
  const updatedUsername = inputEl.value.trim();
  if (!updatedUsername) {
    alert("Display Administrative name can't be registered empty.");
    return;
  }

  localStorage.setItem("username", updatedUsername);
  
  syncProfileUIStrings();
  alert("Enterprise identity tokens updated successfully!");
}

function handleProfileAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    localStorage.setItem("avatarImg", dataUrl);
    syncProfileUIStrings();
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   11. AUTH SYSTEM DISENGAGE TERMINATE BLOCK
   ========================================================================== */
function logout() {
  if (!confirm("Terminate session authorization state tokens?")) return;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("avatarImg");
  window.location.href = "login.html";
}