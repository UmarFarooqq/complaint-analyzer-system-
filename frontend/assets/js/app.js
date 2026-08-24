const API_BASE_URL = "http://localhost:5000/api";

function isAdminArea(){return /\/(admin|department|faculty|reviewer)\//.test(window.location.pathname.toLowerCase());}
function getSessionStorage(){return isAdminArea()?sessionStorage:localStorage;}
function getToken(){const storage=getSessionStorage();return storage.getItem("cas_token");}
function setSession(token, role, userData, storage=localStorage){storage.setItem("cas_token",token);storage.setItem("cas_role",role);storage.setItem("cas_user",JSON.stringify(userData||{}));}
function setStudentSession(token, userData){setSession(token,"student",userData,localStorage);}
function setAdminSession(token, role, userData){setSession(token,role,userData,sessionStorage);}
function clearSession(){[localStorage,sessionStorage].forEach(storage=>{storage.removeItem("cas_token");storage.removeItem("cas_role");storage.removeItem("cas_user");});}
function logout(){const storage=getSessionStorage();storage.removeItem("cas_token");storage.removeItem("cas_role");storage.removeItem("cas_user");window.location.href="../index.html";}
function redirectAuthenticatedStudent(){
  const token=localStorage.getItem("cas_token");
  const role=localStorage.getItem("cas_role");
  if(!token||role!=="student")return;
  const path=window.location.pathname.toLowerCase();
  const onLanding=path.endsWith("/")||path.endsWith("/index.html");
  const onStudentEntry=path.endsWith("/user/login.html")||path.endsWith("/user/register.html");
  if(onLanding)window.location.href="user/dashboard.html";
  else if(onStudentEntry)window.location.href="dashboard.html";
}
function redirectFirstVisit(){
  const path=window.location.pathname.toLowerCase();
  const onLanding=path.endsWith("/")||path.endsWith("/index.html");
  if(onLanding&&!localStorage.getItem("cas_intro_seen_v2")&&!localStorage.getItem("cas_token"))window.location.href="welcome.html";
}
document.addEventListener("DOMContentLoaded",redirectAuthenticatedStudent);
document.addEventListener("DOMContentLoaded",redirectFirstVisit);
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]));}
function escapeResponseStrings(value){if(typeof value==="string")return escapeHtml(value);if(Array.isArray(value))return value.map(escapeResponseStrings);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,escapeResponseStrings(item)]));return value;}
async function apiRequest(endpoint, options={}){const token=getToken();const headers={"Content-Type":"application/json",...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;const r=await fetch(`${API_BASE_URL}${endpoint}`,{...options,headers});const d=await r.json();if(!r.ok)throw new Error(d.message||"Request failed");return escapeResponseStrings(d);}
function showMessage(id,msg,type="error"){const el=document.getElementById(id);if(!el){alert(msg);return;}el.textContent=msg;el.classList.add("show");if(type==="success"){el.classList.remove("validation-message");el.classList.add("success-message");}else{el.classList.remove("success-message");el.classList.add("validation-message");}}
function validateEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function validateGmail(v){return /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/i.test(String(v||"").trim());}
function normalizeRegistrationNumber(v){return String(v||"").trim().toUpperCase().replace(/\s+/g,"");}
function validateRegistrationNumber(v){return /^[A-Z0-9][A-Z0-9/-]{2,49}$/.test(normalizeRegistrationNumber(v));}
let studentEmailVerificationRequired=true;
async function loadStudentVerificationConfig(){const controls=document.getElementById("emailVerificationControls"),hint=document.getElementById("gmailSecurityHint");if(!controls)return;try{const data=await apiRequest("/auth/student/verification-config");studentEmailVerificationRequired=data.verificationRequired!==false;controls.style.display=studentEmailVerificationRequired?"":"none";if(hint&&!studentEmailVerificationRequired)hint.textContent="Enter a valid Gmail address. Email-code verification is currently unavailable.";}catch(err){controls.style.display="";}}
document.addEventListener("DOMContentLoaded",loadStudentVerificationConfig);
function validatePassword(v){return v&&v.length>=6;}
function togglePassword(id,btn){const i=document.getElementById(id);if(!i)return;i.type=i.type==="password"?"text":"password";btn.textContent=i.type==="password"?"👁":"🙈";}

async function handleStudentLogin(e){e.preventDefault();const identity=document.getElementById("studentIdentity"),password=document.getElementById("studentPassword");const rawIdentity=identity.value.trim();const loginIdentity=rawIdentity.includes("@")?rawIdentity.toLowerCase():normalizeRegistrationNumber(rawIdentity);if(!loginIdentity||!validatePassword(password.value.trim())){showMessage("loginMessage","Please enter valid login details. Password must be at least 6 characters.");return;}try{const data=await apiRequest("/auth/student/login",{method:"POST",body:JSON.stringify({identity:loginIdentity,password:password.value.trim()})});setStudentSession(data.token,data.user);window.location.href="dashboard.html";}catch(err){showMessage("loginMessage",err.message);}}
async function sendStudentVerificationCode(){const email=document.getElementById("studentEmail"),button=document.getElementById("sendVerificationCodeButton");if(!validateGmail(email?.value)){showMessage("registerMessage","Please enter a valid Gmail address before requesting a code.");return;}try{if(button)button.disabled=true;const data=await apiRequest("/auth/student/send-verification-code",{method:"POST",body:JSON.stringify({email:email.value.trim().toLowerCase()})});showMessage("registerMessage",data.message,"success");}catch(err){showMessage("registerMessage",err.message);}finally{if(button)button.disabled=false;}}
async function handleRegister(e){e.preventDefault();const name=document.getElementById("studentName"),email=document.getElementById("studentEmail"),code=document.getElementById("studentEmailCode"),reg=document.getElementById("studentRegNo"),password=document.getElementById("studentCreatePassword");const registrationNumber=normalizeRegistrationNumber(reg.value),validCode=!studentEmailVerificationRequired||/^\d{6}$/.test(code?.value.trim()||"");if(!name.value.trim()||!validateGmail(email.value.trim())||!validCode||!validateRegistrationNumber(registrationNumber)||!validatePassword(password.value)){showMessage("registerMessage",studentEmailVerificationRequired?"Complete all fields, use a valid Gmail address and university registration number, enter the 6-digit code, and use a password of at least 6 characters.":"Complete all fields, use a valid Gmail address and university registration number, and use a password of at least 6 characters.");return;}try{const data=await apiRequest("/auth/student/register",{method:"POST",body:JSON.stringify({full_name:name.value.trim(),email:email.value.trim().toLowerCase(),verification_code:code?.value.trim()||"",registration_no:registrationNumber,password:password.value})});setStudentSession(data.token,data.user);window.location.href="dashboard.html";}catch(err){showMessage("registerMessage",err.message);}}
async function handleAdminLogin(e){e.preventDefault();const email=document.getElementById("adminEmail"),password=document.getElementById("adminPassword");if(!validateEmail(email.value.trim())||!validatePassword(password.value.trim())){showMessage("adminLoginMessage","Please enter a valid admin email and password with at least 6 characters.");return;}try{const data=await apiRequest("/auth/admin/login",{method:"POST",body:JSON.stringify({email:email.value.trim(),password:password.value.trim()})});setAdminSession(data.token,"admin",data.admin);window.location.href="dashboard.html";}catch(err){showMessage("adminLoginMessage",err.message);}}

async function loadStatusPage(){if(!document.getElementById("statusComplaintId"))return;try{const data=await apiRequest("/complaints/my");const c=data.complaints[0];if(!c){setText("statusComplaintId","No complaint");setText("statusCategory","No data");setText("statusPriority","No data");setText("statusCurrent","No data");return;}setText("statusComplaintId",`#${c.complaint_id}`);setText("statusCategory",c.detected_category||"Other");setText("statusPriority",c.priority);setText("statusCurrent",c.status);}catch(err){console.error(err.message);}}

async function updateStatusBackend(select, id){
  const status=select.value;
  const note=prompt(`Add a follow-up note for complaint #${id}:`, `Status changed to ${status}.`);
  if(note===null){if(typeof loadAdminComplaints==='function')await loadAdminComplaints();return;}
  try{
    await apiRequest(`/admin/complaints/${id}/status`,{method:"PUT",body:JSON.stringify({status,note:note.trim()})});
    const cell=select.closest("tr").querySelector(".status-cell");
    cell.innerHTML=`<span class="badge ${statusClass(status)}">${status}</span>`;
    await loadAdminStats();await loadPublicOverview();
    alert("Status updated and student notification sent.");
  }catch(err){alert(err.message);if(typeof loadAdminComplaints==='function')await loadAdminComplaints();}
}
async function loadAdminStats(){if(!document.getElementById("totalComplaintsCard"))return;try{const data=await apiRequest("/admin/dashboard/stats");setText("totalComplaintsCard",data.stats.total_complaints);setText("todayComplaintsCard",data.stats.todays_complaints);setText("highPriorityCard",data.stats.high_priority_complaints);setText("resolvedComplaintsCard",data.stats.resolved_complaints);}catch(err){console.error(err.message);}}
async function loadAdminDashboardLive(){const body=document.getElementById("adminRecentHighPriorityBody");if(!body)return;try{const data=await apiRequest("/admin/complaints");const high=data.complaints.filter(c=>c.priority==="High").slice(0,5);body.innerHTML=high.length?high.map(c=>`<tr><td>#${c.complaint_id}</td><td>${c.title}</td><td>${c.detected_category||"Other"}</td><td><span class="badge ${sentimentClass(c.sentiment)}">${c.sentiment}</span></td><td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td><td><span class="badge ${statusClass(c.status)}">${c.status}</span></td></tr>`).join(""):`<tr><td colspan="6">No high priority complaints found.</td></tr>`;const bars=document.getElementById("adminAIOverviewBars");if(bars){const counts={};data.complaints.forEach(c=>{const k=c.detected_category||"Other";counts[k]=(counts[k]||0)+1;});const total=data.complaints.length||1;bars.innerHTML=Object.entries(counts).map(([label,count])=>{const percent=Math.round((count/total)*100);return `<div class="bar-item"><span><b>${label}</b><b>${percent}%</b></span><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div></div>`;}).join("")||"<p>No AI data found.</p>";}}catch(err){console.error(err.message);}}
async function loadAnalytics(){if(!document.getElementById("categoryChart"))return;try{const data=await apiRequest("/admin/analytics");fillChartBox("categoryChart",data.analytics.categoryDistribution);fillChartBox("sentimentChart",data.analytics.sentimentOverview);fillChartBox("priorityChart",data.analytics.priorityDistribution);fillChartBox("monthlyTrendChart",data.analytics.monthlyTrends.map(x=>({label:x.month,total:x.total})));}catch(err){console.error(err.message);}}

async function loadPublicOverview(){if(!document.getElementById("publicTotalComplaints"))return;try{const data=await apiRequest("/public/overview");const o=data.overview;setText("publicTotalComplaints",o.total_complaints);setText("publicHighPriority",o.high_priority);setText("publicResolved",o.resolved_complaints);setText("publicToday",o.today);const list=document.getElementById("publicRecentComplaints");if(list){list.innerHTML=o.recentComplaints.length?o.recentComplaints.map(c=>`<div class="preview-row"><div><b>${c.title}</b><small>${c.detected_category||"Other"} • ${c.sentiment} • ${c.status}</small></div><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></div>`).join(""):`<div class="preview-row"><div><b>No complaints yet</b><small>Register a student and submit first complaint</small></div><span class="badge badge-medium">Live</span></div>`;}}catch(err){console.error(err.message);}}

function fillChartBox(id,rows){const el=document.getElementById(id);if(!el||!rows)return;if(!rows.length){el.innerHTML="<p>No data available yet.</p>";return;}el.innerHTML=rows.map(r=>`<div style="display:flex;justify-content:space-between;width:100%;padding:8px 0;border-bottom:1px solid #e2e8f0;"><strong>${r.label||r.month}</strong><span>${r.total}</span></div>`).join("");}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
function priorityClass(p){if(p==="High")return"badge-high";if(p==="Medium")return"badge-medium";return"badge-low";}
function statusClass(s){if(s==="Pending")return"badge-pending";if(s==="In Progress")return"badge-progress";return"badge-resolved";}
function sentimentClass(s){if(s==="Negative")return"badge-negative";if(s==="Positive")return"badge-positive";return"badge-neutral";}
function formatDate(d){return d?new Date(d).toLocaleString():"";}
function filterTable(){const input=document.getElementById("searchInput"),table=document.getElementById("historyTable");if(!input||!table)return;const v=input.value.toLowerCase();table.querySelectorAll("tbody tr").forEach(r=>r.style.display=r.innerText.toLowerCase().includes(v)?"":"none");}
function filterAdminComplaints(){const input=document.getElementById("adminSearchInput"),table=document.getElementById("adminComplaintsTable");if(!input||!table)return;const v=input.value.toLowerCase();table.querySelectorAll("tbody tr").forEach(r=>r.style.display=r.innerText.toLowerCase().includes(v)?"":"none");}
async function loadStudentDashboard() {
  const total = document.getElementById("studentTotalComplaints");
  if (!total) return;

  try {
    const data = await apiRequest("/complaints/my/dashboard");
    const stats = data.stats || {};
    const complaints = data.recentComplaints || [];
    const user = getUserData();
    const name = user.full_name || user.email || "Student";

    setText("studentWelcomeName", name);
    setText("studentProfileName", name);
    setText("studentTotalComplaints", stats.total || 0);
    setText("studentPendingComplaints", stats.pending || 0);
    setText("studentResolvedComplaints", stats.resolved || 0);
    setText("studentHighPriorityComplaints", stats.high_priority || 0);

    const body = document.getElementById("studentRecentComplaintsBody");
    if (body) {
      body.innerHTML = complaints.length
        ? complaints.map(complaint => `
          <tr>
            <td>#${complaint.complaint_id}</td>
            <td>${complaint.detected_category || "Other"}</td>
            <td>${complaint.sentiment || "Neutral"}</td>
            <td><span class="badge ${priorityClass(complaint.priority)}">${complaint.priority || "Medium"}</span></td>
            <td><span class="badge ${statusClass(complaint.status)}">${complaint.status || "Pending"}</span></td>
          </tr>
        `).join("")
        : `<tr><td colspan="5">No complaints submitted yet.</td></tr>`;
    }

    const summary = document.getElementById("studentAISummaryBox");
    if (summary) {
      const latest = complaints[0];
      summary.innerHTML = latest
        ? `<div class="ai-result-grid">
            <div class="ai-result-item"><span>Category</span><strong>${latest.detected_category || "Other"}</strong></div>
            <div class="ai-result-item"><span>Sentiment</span><strong>${latest.sentiment || "Neutral"}</strong></div>
            <div class="ai-result-item"><span>Priority</span><strong>${latest.priority || "Medium"}</strong></div>
            <div class="ai-result-item"><span>Status</span><strong>${latest.status || "Pending"}</strong></div>
          </div>`
        : `<div class="ai-result-grid"><div class="ai-result-item"><span>Complaint Summary</span><strong>No complaints yet</strong></div></div>`;
    }
  } catch (error) {
    setText("studentTotalComplaints", "—");
    setText("studentPendingComplaints", "—");
    setText("studentResolvedComplaints", "—");
    setText("studentHighPriorityComplaints", "—");
    const body = document.getElementById("studentRecentComplaintsBody");
    if (body) body.innerHTML = `<tr><td colspan="5">Unable to load complaints.</td></tr>`;
    const summary = document.getElementById("studentAISummaryBox");
    if (summary) summary.innerHTML = `<div class="ai-result-item"><span>Complaint Summary</span><strong>Unable to load data</strong></div>`;
    console.error(error.message);
  }
}

document.addEventListener("DOMContentLoaded",()=>{loadStudentDashboard();loadStatusPage();loadAdminStats();});


async function handleResetPassword(event, userType) {
  event.preventDefault();

  const tokenInput = document.getElementById("resetToken");
  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");

  if (!tokenInput.value.trim()) {
    showMessage("resetMessage", "Reset token is required.");
    return;
  }

  if (!validatePassword(passwordInput.value.trim())) {
    showMessage("resetMessage", "New password must be at least 6 characters.");
    return;
  }

  if (passwordInput.value.trim() !== confirmInput.value.trim()) {
    showMessage("resetMessage", "New password and confirm password do not match.");
    return;
  }

  try {
    const data = await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: tokenInput.value.trim(),
        userType,
        newPassword: passwordInput.value.trim()
      })
    });

    showMessage("resetMessage", data.message, "success");

    setTimeout(() => {
      if (userType === "admin") {
        window.location.href = "admin-login.html";
      } else {
        window.location.href = "login.html";
      }
    }, 1500);
  } catch (error) {
    showMessage("resetMessage", error.message);
  }
}

function loadResetTokenFromUrl() {
  const tokenInput = document.getElementById("resetToken");
  if (!tokenInput) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    tokenInput.value = token;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadResetTokenFromUrl();
});

async function handleForgotPassword(event, userType) {
  event.preventDefault();

  const emailInput = document.getElementById("recoveryEmail");
  const resultBox = document.getElementById("resetLinkBox");

  if (!validateEmail(emailInput.value.trim())) {
    showMessage("forgotMessage", "Please enter a valid email address.");
    return;
  }

  try {
    const data = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: emailInput.value.trim(), userType })
    });

    showMessage("forgotMessage", data.message, "success");

    if (resultBox) {
      resultBox.innerHTML = `<div class="forgot-step"><strong>Check your email</strong><br>If the account exists, a password reset link will be sent shortly.</div>`;
    }
  } catch (error) {
    showMessage("forgotMessage", error.message);
  }
}

let casAdminComplaintsCache = [];
let casStudentComplaintsCache = [];

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function matchesFilters(complaint, filters) {
  const search = normalizeText(filters.search);
  const combined = normalizeText([
    complaint.complaint_id,
    complaint.registration_no,
    complaint.student_name,
    complaint.title,
    complaint.description,
    complaint.detected_category,
    complaint.sentiment,
    complaint.priority,
    complaint.status
  ].join(" "));

  if (search && !combined.includes(search)) return false;
  if (filters.category && filters.category !== "All Categories" && complaint.detected_category !== filters.category) return false;
  if (filters.priority && filters.priority !== "All Priorities" && complaint.priority !== filters.priority) return false;
  if (filters.status && filters.status !== "All Status" && complaint.status !== filters.status) return false;
  return true;
}

function getAdminFilters() {
  return {
    search: document.getElementById("adminSearchInput")?.value || "",
    category: document.getElementById("adminCategoryFilter")?.value || "All Categories",
    priority: document.getElementById("adminPriorityFilter")?.value || "All Priorities",
    status: document.getElementById("adminStatusFilter")?.value || "All Status"
  };
}

function getStudentFilters() {
  return {
    search: document.getElementById("searchInput")?.value || "",
    category: document.getElementById("historyCategoryFilter")?.value || "All Categories",
    priority: document.getElementById("historyPriorityFilter")?.value || "All Priorities",
    status: document.getElementById("historyStatusFilter")?.value || "All Status"
  };
}

function renderAdminComplaintsTable(complaints) {
  const table = document.getElementById("adminComplaintsTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  const filtered = complaints.filter(c => matchesFilters(c, getAdminFilters()));

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9">No matching complaints found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>#${c.complaint_id}</td>
      <td>${c.registration_no || "-"}</td>
      <td>${c.title}</td>
      <td>${c.detected_category || "Other"}</td>
      <td><span class="badge ${sentimentClass(c.sentiment)}">${c.sentiment}</span></td>
      <td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td>
      <td class="status-cell"><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
      <td>
        <select onchange="updateStatusBackend(this, ${c.complaint_id})">
          <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
      </td>
      <td><div class="action-row"><button class="btn btn-light" onclick="openComplaintDetails(${c.complaint_id})">View</button></div></td>
    </tr>
  `).join("");
}

function renderStudentHistoryTable(complaints) {
  const table = document.getElementById("historyTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  const filtered = complaints.filter(c => matchesFilters(c, getStudentFilters()));

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7">No matching complaints found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>#${c.complaint_id}</td>
      <td>${c.title}</td>
      <td>${c.detected_category || "Other"}</td>
      <td>${c.sentiment}</td>
      <td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td>
      <td><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
      <td>${formatDate(c.created_at)}</td>
    </tr>
  `).join("");
}

async function loadAdminComplaints() {
  const table = document.getElementById("adminComplaintsTable");
  if (!table) return;
  try {
    const data = await apiRequest("/admin/complaints");
    casAdminComplaintsCache = data.complaints || [];
    renderAdminComplaintsTable(casAdminComplaintsCache);
  } catch (error) {
    console.error(error.message);
  }
}

async function loadMyComplaints() {
  const table = document.getElementById("historyTable");
  if (!table) return;
  try {
    const data = await apiRequest("/complaints/my");
    casStudentComplaintsCache = data.complaints || [];
    renderStudentHistoryTable(casStudentComplaintsCache);
  } catch (error) {
    const tbody = table.querySelector("tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="7">Unable to load live complaints.</td></tr>`;
    console.error(error.message);
  }
}

function filterAdminComplaints() {
  renderAdminComplaintsTable(casAdminComplaintsCache);
}

function filterTable() {
  renderStudentHistoryTable(casStudentComplaintsCache);
}

function attachLiveFilterEvents() {
  ["adminSearchInput", "adminCategoryFilter", "adminPriorityFilter", "adminStatusFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = filterAdminComplaints;
      el.onchange = filterAdminComplaints;
    }
  });
  ["searchInput", "historyCategoryFilter", "historyPriorityFilter", "historyStatusFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = filterTable;
      el.onchange = filterTable;
    }
  });
}

function ensureComplaintModal() {
  if (document.getElementById("complaintDetailModal")) return;
  const modal = document.createElement("div");
  modal.id = "complaintDetailModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>Complaint Details</h3>
        <button class="modal-close" onclick="closeComplaintDetails()">×</button>
      </div>
      <div id="complaintDetailContent">Loading...</div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.id === "complaintDetailModal") closeComplaintDetails();
  });
}

async function openComplaintDetails(complaintId) {
  ensureComplaintModal();
  const modal = document.getElementById("complaintDetailModal");
  const content = document.getElementById("complaintDetailContent");
  modal.classList.add("show");
  content.innerHTML = "Loading complaint details...";

  try {
    const data = await apiRequest(`/admin/complaints/${complaintId}`);
    const c = data.complaint;
    content.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span>Complaint ID</span><strong>#${c.complaint_id}</strong></div>
        <div class="detail-item"><span>Student R-Number</span><strong>${c.registration_no || "-"}</strong></div>
        <div class="detail-item"><span>Student Email</span><strong>${c.student_email || "-"}</strong></div>
        <div class="detail-item"><span>Status</span><strong>${c.status}</strong></div>
        <div class="detail-item"><span>Category</span><strong>${c.detected_category || "Other"}</strong></div>
        <div class="detail-item"><span>Sentiment</span><strong>${c.sentiment}</strong></div>
        <div class="detail-item"><span>Priority</span><strong>${c.priority}</strong></div>
        <div class="detail-item"><span>AI Confidence</span><strong>${c.ai_confidence || 0}%</strong></div>
        <div class="detail-item"><span>AI Fake Probability</span><strong>${c.fake_probability || 0}%</strong></div>
        <div class="detail-item"><span>Device Type</span><strong>${c.device_type || "Not recorded"}</strong></div>
        <div class="detail-item"><span>Browser</span><strong>${c.browser_name || "Not recorded"}</strong></div>
        <div class="detail-item"><span>Operating System</span><strong>${c.operating_system || "Not recorded"}</strong></div>
        <div class="detail-item"><span>Submission IP</span><strong>${c.ip_address || "Not recorded"}</strong></div>
        <div class="detail-item detail-full"><span>Browser Identification</span><p>${c.user_agent || "Not recorded"}</p></div>
        <div class="detail-item"><span>False Report Review</span><strong>${Number(c.is_flagged_false)===1?"Flagged for review":"Not flagged"}</strong></div>
        <div class="detail-item detail-full"><span>Review Reason</span><p>${c.false_flag_reason || "No review reason"}</p></div>
        <div class="detail-item"><span>Created At</span><strong>${formatDate(c.created_at)}</strong></div>
        <div class="detail-item"><span>Updated At</span><strong>${formatDate(c.updated_at)}</strong></div>
        <div class="detail-item detail-full"><span>Title</span><strong>${c.title}</strong></div>
        <div class="detail-item detail-full"><span>Description</span><p>${c.description}</p></div>
      </div>
      <div class="action-row" style="margin-top:16px;">
        ${Number(c.is_flagged_false)===1
          ? `<button class="btn btn-light" onclick="updateFalseComplaintFlag(${c.complaint_id},false)">Remove False-Report Flag</button>`
          : `<button class="btn btn-danger" onclick="updateFalseComplaintFlag(${c.complaint_id},true)">Flag as Potentially False</button>`}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p style="color:#b91c1c;font-weight:700;">${error.message}</p>`;
  }
}

async function updateFalseComplaintFlag(complaintId, flagged){
  let reason="";
  if(flagged){reason=prompt("Enter the reason this complaint requires false-report review:")||"";if(!reason.trim())return;}
  try{const data=await apiRequest(`/admin/complaints/${complaintId}/false-flag`,{method:"PUT",body:JSON.stringify({flagged,reason:reason.trim()})});alert(data.message);await openComplaintDetails(complaintId);if(typeof loadAdminComplaints==="function")await loadAdminComplaints();}catch(error){alert(error.message);}
}

function closeComplaintDetails() {
  const modal = document.getElementById("complaintDetailModal");
  if (modal) modal.classList.remove("show");
}

async function loadPublicOverview() {
  if (!document.getElementById("publicTotalComplaints")) return;
  try {
    const data = await apiRequest("/public/overview");
    const o = data.overview || {};
    setText("publicTotalComplaints", o.total_complaints ?? 0);
    setText("publicHighPriority", o.high_priority ?? 0);
    setText("publicResolved", o.resolved_complaints ?? 0);
    setText("publicToday", o.today ?? 0);
    const list = document.getElementById("publicRecentComplaints");
    if (list) {
      const rows = o.recentComplaints || [];
      list.innerHTML = rows.length ? rows.map(c => `
        <div class="preview-row">
          <div><b>${c.title}</b><small>${c.detected_category || "Other"} • ${c.sentiment} • ${c.status}</small></div>
          <span class="badge ${priorityClass(c.priority)}">${c.priority}</span>
        </div>
      `).join("") : `
        <div class="preview-row">
          <div><b>No complaints yet</b><small>Register and submit your first complaint</small></div>
          <span class="badge badge-medium">Ready</span>
        </div>
      `;
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function loadAnalytics() {
  try {
    const data = await apiRequest("/admin/analytics");
    const analytics = data.analytics || {};
    const summary = analytics.summary || {};
    if (summary.topCategory) {
      setText("analyticsTopCategoryLabel", summary.topCategory.label || "Top Category");
      setText("analyticsTopCategoryValue", `${summary.topCategory.percent || 0}%`);
    }
    if (summary.topSentiment) {
      setText("analyticsTopSentimentLabel", `${summary.topSentiment.label || "Top"} Sentiment`);
      setText("analyticsTopSentimentValue", `${summary.topSentiment.percent || 0}%`);
    }
    if (summary.highPriority) setText("analyticsHighPriorityValue", summary.highPriority.count || 0);
    if (typeof summary.monthlyTrend !== "undefined") {
      const sign = summary.monthlyTrend > 0 ? "+" : "";
      setText("analyticsMonthlyTrendValue", `${sign}${summary.monthlyTrend}%`);
    }
    fillChartBox("categoryChart", analytics.categoryDistribution || []);
    fillChartBox("sentimentChart", analytics.sentimentOverview || []);
    fillChartBox("priorityChart", analytics.priorityDistribution || []);
    fillChartBox("monthlyTrendChart", (analytics.monthlyTrends || []).map(x => ({ label: x.month, total: x.total })));
    const finding = document.getElementById("analyticsKeyFinding");
    if (finding) {
      const category = summary.topCategory?.label || "No category";
      const sentiment = summary.topSentiment?.label || "No sentiment";
      finding.textContent = `The most common category is ${category}. The most common sentiment is ${sentiment}. Review high-priority complaints first.`;
    }
  } catch (error) {
    setText("analyticsTopCategoryValue", "Unavailable");
    setText("analyticsTopSentimentValue", "Unavailable");
    setText("analyticsHighPriorityValue", "Unavailable");
    setText("analyticsMonthlyTrendValue", "Unavailable");
    setText("analyticsKeyFinding", "Unable to load live analytics data.");
    console.error(error.message);
  }
}

async function loadAdminDashboardLive() {
  const body = document.getElementById("adminRecentHighPriorityBody");
  if (!body) return;
  try {
    const data = await apiRequest("/admin/complaints");
    const all = data.complaints || [];
    const highPriority = all.filter(c => c.priority === "High").slice(0, 5);
    body.innerHTML = highPriority.length ? highPriority.map(c => `
      <tr>
        <td>#${c.complaint_id}</td>
        <td>${c.title}</td>
        <td>${c.detected_category || "Other"}</td>
        <td><span class="badge ${sentimentClass(c.sentiment)}">${c.sentiment}</span></td>
        <td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td>
        <td><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
      </tr>
    `).join("") : `<tr><td colspan="6">No high priority complaints found.</td></tr>`;
    const counts = {};
    all.forEach(complaint => {
      const category = complaint.detected_category || "Other";
      counts[category] = (counts[category] || 0) + 1;
    });
    const bars = document.getElementById("adminAIOverviewBars");
    if (bars) {
      const total = all.length || 1;
      bars.innerHTML = Object.entries(counts).length
        ? Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([category, count]) => {
          const percent = Math.round((count / total) * 100);
          return `<div class="bar-item"><span><b>${category}</b><b>${percent}%</b></span><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div></div>`;
        }).join("")
        : "<p>No complaint data available.</p>";
    }
    const insight = document.getElementById("adminSystemInsight");
    if (insight) {
      const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No category";
      insight.textContent = all.length
        ? `Most complaints are ${topCategory.toLowerCase()}-related. Review them with the responsible department first.`
        : "Complaint insights will appear after students submit complaints.";
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function loadPredictions() {
  const box = document.getElementById("predictionBox");
  if (!box) return;
  try {
    const data = await apiRequest("/advanced/predictions");
    const prediction = data.prediction || {};
    box.innerHTML = `<div class="ai-result-grid">
      <div class="ai-result-item"><span>Complaint Spike</span><strong>${prediction.futureSpike || "No prediction"}</strong></div>
      <div class="ai-result-item"><span>High-Risk Category</span><strong>${prediction.nextHighRiskDepartment || "No data"}</strong></div>
      <div class="ai-result-item"><span>High-Priority Complaints</span><strong>${prediction.riskyComplaints ?? 0}</strong></div>
      <div class="ai-result-item"><span>Recommendation</span><strong>${prediction.recommendation || "No recommendation"}</strong></div>
    </div>`;
  } catch (error) {
    box.textContent = "Unable to load predictions.";
    console.error(error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  attachLiveFilterEvents();
  ensureComplaintModal();
  loadPublicOverview();
  loadAdminDashboardLive();
  loadAnalytics();
  loadPredictions();
  loadMyComplaints();
});

async function submitAdvancedComplaint(event) {
  event.preventDefault();
  const title = document.getElementById("complaintTitle");
  const description = document.getElementById("complaintDescription");
  const manualCategory = document.getElementById("manualCategory");
  const attachment = document.getElementById("complaintAttachment");
  const resultBox = document.getElementById("aiResultBox");

  const fd = new FormData();
  fd.append("title", title.value.trim());
  fd.append("description", description.value.trim());
  fd.append("manual_category", manualCategory.value);
  if (attachment && attachment.files[0]) fd.append("attachment", attachment.files[0]);

  try {
    resultBox.innerHTML = "<p>Submitting complaint...</p>";
    const response = await fetch(`${API_BASE_URL}/complaints/with-attachment`, {
      method: "POST",
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: fd
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const c = data.complaint;
    resultBox.innerHTML = `
      <div class="ai-result-grid">
        <div class="ai-result-item"><span>Sentiment</span><strong>${c.sentiment}</strong></div>
        <div class="ai-result-item"><span>Category</span><strong>${c.detected_category}</strong></div>
        <div class="ai-result-item"><span>Priority</span><strong>${c.priority}</strong></div>
        <div class="ai-result-item"><span>AI Source</span><strong>${c.ai_source}</strong></div>
        <div class="ai-result-item"><span>Expected Resolution</span><strong>${c.expected_resolution_time}</strong></div>
        <div class="ai-result-item"><span>AI Recommendation</span><strong>${c.ai_recommendation}</strong></div>
      </div>`;
    event.target.reset();
  } catch (error) {
    resultBox.innerHTML = `<p style="color:#b91c1c;font-weight:700;">${error.message}</p>`;
  }
}

async function loadAdvancedNotifications() {
  const box = document.getElementById("notificationsList");
  if (!box) return;
  try {
    const data = await apiRequest("/advanced/notifications");
    box.innerHTML = (data.notifications || []).map(n => `<div class="ai-result-item"><span>${n.type} • ${formatDate(n.created_at)}</span><strong>${n.title}</strong><p>${n.message}</p></div>`).join("") || "<p>No notifications.</p>";
  } catch(e){ box.innerHTML = `<p>${e.message}</p>`; }
}

async function loadAdvancedAnalytics() {
  const box = document.getElementById("advancedAnalyticsBox");
  if (!box) return;
  const data = await apiRequest("/advanced/analytics");
  const a = data.analytics;
  box.innerHTML = `
    <div class="chart-card"><h4>Department Load</h4>${(a.departmentLoad||[]).map(x=>`<p><b>${x.label}</b>: ${x.total}</p>`).join("")}</div>
    <div class="chart-card"><h4>Resolution Status</h4>${(a.resolution||[]).map(x=>`<p><b>${x.status}</b>: ${x.total}</p>`).join("")}</div>
    <div class="chart-card"><h4>Daily Trend</h4>${(a.dailyTrend||[]).map(x=>`<p><b>${formatDate(x.date)}</b>: ${x.total}</p>`).join("")}</div>
  `;
}

function downloadComplaintsReport() {
  window.open(`${API_BASE_URL}/advanced/reports/complaints.csv`, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("complaintForm");
  if (form && document.getElementById("complaintAttachment")) form.onsubmit = submitAdvancedComplaint;
  loadAdvancedNotifications();
  loadAdvancedAnalytics();
});

function getUserData() {
  try { return JSON.parse(getSessionStorage().getItem("cas_user") || "{}"); }
  catch(e) { return {}; }
}

async function handleAdminLogin(event) {
  event.preventDefault();

  const email = document.getElementById("adminEmail");
  const password = document.getElementById("adminPassword");

  if (!validateEmail(email.value.trim()) || !validatePassword(password.value.trim())) {
    showMessage("adminLoginMessage", "Please enter a valid admin email and password with at least 6 characters.");
    return;
  }

  try {
    const data = await apiRequest("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value.trim()
      })
    });

    setAdminSession(data.token, data.admin.role || "admin", data.admin);

    const role = data.admin.role || "admin";
    if (role === "department_admin") window.location.href = "../department/dashboard.html";
    else if (role === "faculty_staff") window.location.href = "../faculty/dashboard.html";
    else if (role === "reviewer") window.location.href = "../reviewer/dashboard.html";
    else window.location.href = "dashboard.html";
  } catch (error) {
    showMessage("adminLoginMessage", error.message);
  }
}

async function loadMyDepartmentHeader() {
  const el = document.getElementById("myDepartmentName");
  if (!el) return;
  try {
    const data = await apiRequest("/roles/my-department");
    el.textContent = data.department ? data.department.department_name : "All Departments";
  } catch (error) {
    el.textContent = "Department Portal";
  }
}

async function loadDepartmentComplaints() {
  const table = document.getElementById("departmentComplaintsTable");
  if (!table) return;

  const department = document.getElementById("departmentSelect")?.value || "";
  try {
    const data = await apiRequest(`/advanced/department-complaints?department=${encodeURIComponent(department)}`);
    const tbody = table.querySelector("tbody");
    const rows = data.complaints || [];
    tbody.innerHTML = rows.length ? rows.map(c => `
      <tr>
        <td>#${c.complaint_id}</td>
        <td>${c.registration_no || "-"}</td>
        <td>${c.title}</td>
        <td>${c.department_name || c.detected_category || "-"}</td>
        <td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td>
        <td class="status-cell"><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
        <td>
          <select onchange="updateDepartmentStatus(this, ${c.complaint_id})">
            <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="7">No department complaints found.</td></tr>`;
  } catch (error) {
    console.error(error.message);
  }
}

async function updateDepartmentStatus(select, complaintId) {
  try {
    await apiRequest(`/advanced/department-complaints/${complaintId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: select.value, note: "Updated from department portal" })
    });
    await loadDepartmentComplaints();
  } catch (error) {
    alert(error.message);
  }
}

async function sendChatbotMessage(event) {
  event.preventDefault();
  const input = document.getElementById("chatbotInput");
  const box = document.getElementById("chatbotMessages");
  if (!input || !box || !input.value.trim()) return;

  const msg = input.value.trim();
  const submit = event.submitter;
  if (submit) submit.disabled = true;
  box.innerHTML += `<div class="ai-result-item"><span>You</span><strong>${escapeHtml(msg)}</strong></div>`;
  input.value = "";

  try {
    const data = await apiRequest("/chatbot/message", {
      method: "POST",
      body: JSON.stringify({ message: msg })
    });
    box.innerHTML += `<div class="ai-result-item"><span>AI Assistant</span><strong>${escapeHtml(data.reply)}</strong></div>`;
  } catch (error) {
    box.innerHTML += `<div class="ai-result-item"><span>AI Assistant</span><strong>${escapeHtml(error.message)}</strong></div>`;
  } finally {
    if (submit) submit.disabled = false;
    input.focus();
  }
  box.scrollTop = box.scrollHeight;
}

async function loadChatbotHistory() {
  const box = document.getElementById("chatbotMessages");
  if (!box) return;
  try {
    const data = await apiRequest("/chatbot/history");
    box.innerHTML = (data.history || []).map(m => `
      <div class="ai-result-item">
        <span>${m.sender === "bot" ? "AI Assistant" : "You"}</span>
        <strong>${m.message}</strong>
      </div>
    `).join("");
  } catch (error) {
    box.innerHTML = `<div class="ai-result-item"><span>Error</span><strong>${error.message}</strong></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMyDepartmentHeader();
  loadDepartmentComplaints();
  loadChatbotHistory();
});


function isSuperAdminUser() {
  const role = getCurrentRoleSafe();
  const user = getUserData ? getUserData() : {};
  return role === "super_admin" || role === "admin" || user.role === "super_admin" || user.role === "admin";
}

function applyRolePermissionsUI() {
  const role = getCurrentRoleSafe();
  const user = getUserData ? getUserData() : {};
  const effectiveRole = role || user.role;

  document.querySelectorAll("[data-super-admin-only='true']").forEach(el => {
    if (!isSuperAdminUser()) {
      el.style.display = "none";
    }
  });

  const roleCreateForm = document.getElementById("roleCreateForm");
  if (roleCreateForm && !isSuperAdminUser()) {
    roleCreateForm.innerHTML = `
      <div class="alert-box">
        <strong>Access Restricted</strong>
        <p>Only Super Admin can create Department Admin, Faculty Staff, or Reviewer accounts.</p>
        <p>Your role: ${effectiveRole || "unknown"}</p>
      </div>
    `;
  }

  const adminsListBody = document.getElementById("adminsListBody");
  if (adminsListBody && !isSuperAdminUser()) {
    adminsListBody.innerHTML = `<tr><td colspan="5">Only Super Admin can view staff/admin account list.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => applyRolePermissionsUI());


async function loadRoleDashboard() {
  const box = document.getElementById("roleDashboardBox");
  if (!box) return;

  try {
    const data = await apiRequest("/members/my-work");
    const s = data.stats;

    box.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><span>Assigned</span><strong>${s.assigned}</strong><small>My assigned complaints</small></div>
        <div class="stat-card"><span>Pending</span><strong>${s.pending}</strong><small>Waiting for action</small></div>
        <div class="stat-card"><span>In Progress</span><strong>${s.in_progress}</strong><small>Currently working</small></div>
        <div class="stat-card"><span>Resolved</span><strong>${s.resolved}</strong><small>Completed work</small></div>
        <div class="stat-card"><span>High Priority</span><strong>${s.high_priority}</strong><small>Urgent cases</small></div>
      </div>
    `;

    const tbody = document.getElementById("roleComplaintsBody");
    if (tbody) {
      tbody.innerHTML = (data.complaints || []).map(c => `
        <tr>
          <td>#${c.complaint_id}</td>
          <td>${c.registration_no || "-"}</td>
          <td>${c.title}</td>
          <td>${c.department_name || c.detected_category || "-"}</td>
          <td><span class="badge ${priorityClass(c.priority)}">${c.priority}</span></td>
          <td><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
          <td>
            <select onchange="updateDepartmentStatus(this, ${c.complaint_id})">
              <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
              <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
            <button class="btn btn-light" onclick="openNoteBox(${c.complaint_id})">Note</button>
          </td>
        </tr>
      `).join("") || `<tr><td colspan="7">No assigned complaints found.</td></tr>`;
    }

    const act = document.getElementById("myActivityBody");
    if (act) {
      act.innerHTML = (data.activities || []).map(a => `
        <tr>
          <td>${a.action}</td>
          <td>#${a.complaint_id || "-"}</td>
          <td>${a.description || "-"}</td>
          <td>${formatDate(a.created_at)}</td>
        </tr>
      `).join("") || `<tr><td colspan="4">No activity yet.</td></tr>`;
    }
  } catch (error) {
    box.innerHTML = `<p style="color:#b91c1c;">${error.message}</p>`;
  }
}

function openNoteBox(complaintId) {
  const note = prompt("Enter work note for complaint #" + complaintId);
  if (note) addMemberNote(complaintId, note);
}

async function addMemberNote(complaintId, note) {
  try {
    await apiRequest(`/members/complaints/${complaintId}/notes`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
    alert("Note added successfully");
    await loadRoleDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function loadMainAdminMemberActivity() {
  const perfBody = document.getElementById("memberPerformanceBody");
  const actBody = document.getElementById("memberActivityBody");
  if (!perfBody && !actBody) return;

  try {
    const data = await apiRequest("/members/activity");

    if (perfBody) {
      perfBody.innerHTML = (data.performance || []).map(m => `
        <tr>
          <td>${m.full_name}</td>
          <td>${m.email}</td>
          <td>${m.role}</td>
          <td>${m.total_actions}</td>
          <td>${m.status_updates}</td>
          <td>${m.notes_added}</td>
          <td>${m.last_activity ? formatDate(m.last_activity) : "-"}</td>
        </tr>
      `).join("") || `<tr><td colspan="7">No member performance found.</td></tr>`;
    }

    if (actBody) {
      actBody.innerHTML = (data.activities || []).map(a => `
        <tr>
          <td>${a.full_name}</td>
          <td>${a.role}</td>
          <td>${a.action}</td>
          <td>#${a.complaint_id || "-"}</td>
          <td>${a.description || "-"}</td>
          <td>${formatDate(a.created_at)}</td>
        </tr>
      `).join("") || `<tr><td colspan="6">No member activity found.</td></tr>`;
    }
  } catch (error) {
    if (perfBody) perfBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadRoleDashboard();
  loadMainAdminMemberActivity();
});


function getCurrentRoleSafe() {
  const role = getSessionStorage().getItem("cas_role");
  const user = getUserData();
  return user.role || role || "";
}

function canCreateRoles() {
  const role = getCurrentRoleSafe();
  return role === "super_admin" || role === "admin";
}

async function loadRoleDepartmentsFixed() {
  const select = document.getElementById("roleDepartment");
  if (!select) return;

  try {
    const data = await apiRequest("/advanced/departments");
    const departments = data.departments || [];
    select.innerHTML = `<option value="">Select Department</option>` + departments.map(d =>
      `<option value="${d.department_id}">${d.department_name}</option>`
    ).join("");
  } catch (error) {
    select.innerHTML = `<option value="">Failed to load departments</option>`;
    console.error(error.message);
  }
}

async function loadAdminsListFixed() {
  const tbody = document.getElementById("adminsListBody");
  if (!tbody) return;

  try {
    const data = await apiRequest("/roles/admins");
    const admins = data.admins || [];

    tbody.innerHTML = admins.map(a => `
      <tr>
        <td>#${a.admin_id}</td>
        <td>${a.full_name}</td>
        <td>${a.email}</td>
        <td>${a.role}</td>
        <td>${a.department_name || "-"}</td><td><button class="btn btn-danger" onclick="deleteAdminAccount(${a.admin_id})">Delete</button></td></tr>
    `).join("") || `<tr><td colspan="6">No accounts found.</td></tr>`;
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

async function submitRoleCreateFixed(event) {
  event.preventDefault();

  const btn = document.getElementById("createRoleBtn");
  const msg = document.getElementById("roleMessage");

  if (!canCreateRoles()) {
    showMessage("roleMessage", "Only Main Admin / Super Admin can create role accounts.");
    return;
  }

  const full_name = document.getElementById("roleFullName").value.trim();
  const email = document.getElementById("roleEmail").value.trim();
  const password = document.getElementById("rolePassword").value.trim();
  const role = document.getElementById("roleType").value;
  const department_id = document.getElementById("roleDepartment").value;

  if (!full_name || !email || !password || !role || !department_id) {
    showMessage("roleMessage", "Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    showMessage("roleMessage", "Password must be at least 6 characters.");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Creating...";
    }

    const data = await apiRequest("/roles/department-admin", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password, role, department_id })
    });

    showMessage("roleMessage", data.message || "Role account created successfully.", "success");

    const form = document.getElementById("roleCreateForm");
    if (form) form.reset();

    await loadRoleDepartmentsFixed();
    await loadAdminsListFixed();
  } catch (error) {
    showMessage("roleMessage", error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Create Role Account";
    }
  }
}

function attachRoleFormFixed() {
  const form = document.getElementById("roleCreateForm");
  if (!form) return;

  form.onsubmit = submitRoleCreateFixed;

  if (!canCreateRoles()) {
    form.innerHTML = `
      <div class="alert-box">
        <strong>Access Restricted</strong>
        <p>Only Main Admin / Super Admin can create Department Admin, Faculty Staff, or Reviewer accounts.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadRoleDepartmentsFixed();
  loadAdminsListFixed();
  attachRoleFormFixed();
});

function toggleSidebarMenu(){document.body.classList.toggle("sidebar-open")}
function closeSidebarOnMobile(){if(window.innerWidth<=900)document.body.classList.remove("sidebar-open")}
function getGreetingText(){const h=new Date().getHours();if(h<12)return"Good Morning";if(h<17)return"Good Afternoon";return"Good Evening"}
function injectMenuButtonAndGreeting(){
  if(document.querySelector(".sidebar")&&!document.querySelector(".nav-menu-button")){
    const b=document.createElement("button");b.className="nav-menu-button";b.innerHTML="☰ Menu";b.onclick=toggleSidebarMenu;document.body.appendChild(b);
    document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",closeSidebarOnMobile));
  }
  const header=document.querySelector(".main-content .page-header");
  if(header&&!document.querySelector(".welcome-card")){
    const u=getUserData();
    const name=u.full_name||u.email||"User";
    const card=document.createElement("section");card.className="welcome-card";
    card.innerHTML=`<h2>${getGreetingText()}, ${name}</h2><p>Welcome back.</p>`;
    header.parentNode.insertBefore(card,header);
  }
}
async function deleteAdminAccount(adminId){if(!confirm("Delete this account?"))return;try{const d=await apiRequest(`/full-admin/accounts/${adminId}`,{method:"DELETE"});alert(d.message);if(typeof loadAdminsListFixed==="function")await loadAdminsListFixed();if(typeof loadMainAdminMemberActivity==="function")await loadMainAdminMemberActivity()}catch(e){alert(e.message)}}
async function deleteComplaintAdmin(complaintId){if(!confirm("Delete this complaint?"))return;try{const d=await apiRequest(`/full-admin/complaints/${complaintId}`,{method:"DELETE"});alert(d.message);if(typeof loadAdminComplaints==="function")await loadAdminComplaints();if(typeof loadAdminStats==="function")await loadAdminStats()}catch(e){alert(e.message)}}
document.addEventListener("DOMContentLoaded",()=>{injectMenuButtonAndGreeting()});

function removeDesktopMenuButton() {
  const btn = document.querySelector(".nav-menu-button");
  if (window.innerWidth > 900 && btn) {
    btn.remove();
    document.body.classList.remove("sidebar-open");
  }
}

function createMobileMenuButtonOnly() {
  if (window.innerWidth > 900) {
    removeDesktopMenuButton();
    return;
  }

  if (!document.querySelector(".sidebar")) return;
  if (document.querySelector(".nav-menu-button")) return;

  const btn = document.createElement("button");
  btn.className = "nav-menu-button";
  btn.type = "button";
  btn.innerHTML = "☰ Menu";
  btn.onclick = function (event) {
    event.stopPropagation();
    document.body.classList.toggle("sidebar-open");
  };
  document.body.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", function () {
  removeDesktopMenuButton();
  createMobileMenuButtonOnly();
});

window.addEventListener("resize", function () {
  removeDesktopMenuButton();
  createMobileMenuButtonOnly();
});

document.addEventListener("click", function (event) {
  if (!document.body.classList.contains("sidebar-open")) return;
  const sidebar = document.querySelector(".sidebar");
  const button = document.querySelector(".nav-menu-button");
  if (sidebar && button && !sidebar.contains(event.target) && !button.contains(event.target)) {
    document.body.classList.remove("sidebar-open");
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") document.body.classList.remove("sidebar-open");
});



let adminComplaintCacheFixed = [];

function adminFiltersFixed() {
  return {
    search: (document.getElementById("adminSearchInput")?.value || "").toLowerCase().trim(),
    category: document.getElementById("adminCategoryFilter")?.value || "All Categories",
    priority: document.getElementById("adminPriorityFilter")?.value || "All Priorities",
    status: document.getElementById("adminStatusFilter")?.value || "All Status"
  };
}

function complaintMatchesAdminFilterFixed(c, f) {
  const text = [
    c.complaint_id,
    c.registration_no,
    c.student_name,
    c.title,
    c.description,
    c.detected_category,
    c.sentiment,
    c.priority,
    c.status,
    c.department_name
  ].join(" ").toLowerCase();

  if (f.search && !text.includes(f.search)) return false;
  if (f.category !== "All Categories" && c.detected_category !== f.category) return false;
  if (f.priority !== "All Priorities" && c.priority !== f.priority) return false;
  if (f.status !== "All Status" && c.status !== f.status) return false;

  return true;
}

function renderAdminComplaintsTable(complaints) {
  const table = document.getElementById("adminComplaintsTable");
  if (!table) return;

  const tbody =
    document.getElementById("adminComplaintsBody") ||
    table.querySelector("tbody");

  const countText = document.getElementById("adminComplaintCount");
  const f = adminFiltersFixed();
  const filtered = (complaints || []).filter(c => complaintMatchesAdminFilterFixed(c, f));

  if (countText) {
    countText.textContent = `${filtered.length} of ${(complaints || []).length} complaints shown`;
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9">No complaints found. Submit a complaint or clear the filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>#${c.complaint_id}</td>
      <td>${c.registration_no || "-"}</td>
      <td>${c.title || "-"}${Number(c.is_flagged_false)===1?' <span class="badge badge-high">Under Review</span>':""}</td>
      <td>${c.detected_category || "Other"}</td>
      <td><span class="badge ${sentimentClass(c.sentiment || "Neutral")}">${c.sentiment || "Neutral"}</span></td>
      <td><span class="badge ${priorityClass(c.priority || "Medium")}">${c.priority || "Medium"}</span></td>
      <td class="status-cell"><span class="badge ${statusClass(c.status || "Pending")}">${c.status || "Pending"}</span></td>
      <td>
        <select onchange="updateStatusBackend(this, ${c.complaint_id})">
          <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
      </td>
      <td>
        <div class="action-row">
          <button class="btn btn-light" onclick="openComplaintDetails(${c.complaint_id})">View</button>
          <button class="btn btn-danger" onclick="deleteComplaintAdmin(${c.complaint_id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function loadAdminComplaints() {
  const table = document.getElementById("adminComplaintsTable");
  if (!table) return;

  const tbody =
    document.getElementById("adminComplaintsBody") ||
    table.querySelector("tbody");

  const errorBox = document.getElementById("adminComplaintError");
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.remove("show");
  }

  tbody.innerHTML = `<tr><td colspan="9">Loading complaints...</td></tr>`;

  try {
    const data = await apiRequest("/admin/complaints");

    if (!data.success) {
      throw new Error(data.message || "Failed to load complaints");
    }

    adminComplaintCacheFixed = data.complaints || [];
    renderAdminComplaintsTable(adminComplaintCacheFixed);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="9">Unable to load complaints.</td></tr>`;

    if (errorBox) {
      errorBox.textContent = `Unable to load complaints: ${error.message}`;
      errorBox.classList.add("show");
    } else {
      console.error(error.message);
    }
  }
}

function filterAdminComplaints() {
  renderAdminComplaintsTable(adminComplaintCacheFixed);
}

function attachAdminComplaintFiltersFixed() {
  ["adminSearchInput", "adminCategoryFilter", "adminPriorityFilter", "adminStatusFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = filterAdminComplaints;
      el.onchange = filterAdminComplaints;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachAdminComplaintFiltersFixed();
  loadAdminComplaints();
});
