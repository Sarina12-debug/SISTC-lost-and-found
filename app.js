/* SISTC Lost & Found — Demo-only (LocalStorage) */
const STORE_KEY = "sistc_lf_reports_v1";

function loadReports(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}

function saveReports(items){
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function nowISO(){
  const d = new Date();
  return d.toISOString();
}

function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString(undefined, {year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit"});
  }catch{ return iso; }
}

function toast(msg){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 2600);
}

function setActiveNav(){
  const page = document.body.dataset.page;
  document.querySelectorAll(".navlinks a").forEach(a=>{
    a.classList.toggle("active", a.dataset.page === page);
  });
}

/* demo data */
function seedIfEmpty(){
  const items = loadReports();
  if(items.length) return;

  const demo = [
    {
      id: uid(),
      type: "lost",
      itemName: "Purse",
      category: "Accessories",
      location: "Library",
      date: "2026-01-12T02:10:00.000Z",
      details: "Black purse with small gold chain.",
      contactName: "Student",
      contactEmail: "student@sistc.edu.au",
      status: "open",
      createdAt: nowISO()
    },
    {
      id: uid(),
      type: "lost",
      itemName: "Black AirPods Case",
      category: "Electronics",
      location: "Cafeteria",
      date: "2026-01-13T05:20:00.000Z",
      details: "Small case, no AirPods inside.",
      contactName: "Student",
      contactEmail: "student@sistc.edu.au",
      status: "open",
      createdAt: nowISO()
    },
    {
      id: uid(),
      type: "found",
      itemName: "Blue Water Bottle",
      category: "Accessories",
      location: "Campus Walkway",
      date: "2026-01-14T01:45:00.000Z",
      details: "Blue bottle, slight scratches.",
      contactName: "Reception",
      contactEmail: "reception@sistc.edu.au",
      status: "held",
      createdAt: nowISO()
    }
  ];
  saveReports(demo);
}

function resetDemo(){
  localStorage.removeItem(STORE_KEY);
  seedIfEmpty();
  toast("Demo data reset.");
  renderSearch();
  renderRecent();
}

/* shared UI renderers */
function statusTag(report){
  if(report.type === "found") return `<span class="tag good">Found</span>`;
  return `<span class="tag warn">Lost</span>`;
}

function safe(s=""){ return String(s || "").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

function renderCard(report){
  return `
  <div class="item">
    <div>
      <h3>${safe(report.itemName)}</h3>
      <p>${safe(report.details || "")}</p>
      <div class="meta">
        ${statusTag(report)}
        <span class="tag">${safe(report.category || "General")}</span>
        <span class="tag">${safe(report.location || "Unknown")}</span>
        <span class="tag">${fmtDate(report.date || report.createdAt)}</span>
      </div>
    </div>
    <div class="actions">
      <a class="btn" href="search.html">View</a>
    </div>
  </div>`;
}

/* Home: recently added */
function renderRecent(){
  const el = document.getElementById("recentItems");
  if(!el) return;

  const items = loadReports()
    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  if(!items.length){
    el.innerHTML = `<p class="help">No reports yet. Submit a report to see it here.</p>`;
    return;
  }
  el.innerHTML = `<div class="list">${items.map(renderCard).join("")}</div>`;
}

/* Search page */
function renderSearch(){
  const listEl = document.getElementById("results");
  if(!listEl) return;

  const qEl = document.getElementById("q");
  const typeEl = document.getElementById("type");
  const catEl = document.getElementById("category");

  const q = (qEl?.value || "").trim().toLowerCase();
  const type = typeEl?.value || "all";
  const cat = catEl?.value || "all";

  let items = loadReports().slice();

  if(type !== "all"){
    items = items.filter(x => x.type === type);
  }
  if(cat !== "all"){
    items = items.filter(x => (x.category || "").toLowerCase() === cat.toLowerCase());
  }
  if(q){
    items = items.filter(x =>
      (x.itemName || "").toLowerCase().includes(q) ||
      (x.details || "").toLowerCase().includes(q) ||
      (x.location || "").toLowerCase().includes(q)
    );
  }

  items.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

  if(!items.length){
    listEl.innerHTML = `<p class="help">No matching results. Try a different keyword or category.</p>`;
    return;
  }
  listEl.innerHTML = `<div class="list">${items.map(renderCard).join("")}</div>`;
}

function bindSearch(){
  const qEl = document.getElementById("q");
  const typeEl = document.getElementById("type");
  const catEl = document.getElementById("category");
  [qEl, typeEl, catEl].forEach(el => el && el.addEventListener("input", renderSearch));
  [typeEl, catEl].forEach(el => el && el.addEventListener("change", renderSearch));

  const resetBtn = document.getElementById("resetDemo");
  resetBtn && resetBtn.addEventListener("click", resetDemo);
}

/* Forms */
function readForm(prefix){
  const get = id => document.getElementById(`${prefix}-${id}`)?.value?.trim() || "";
  return {
    itemName: get("itemName"),
    category: get("category"),
    location: get("location"),
    date: get("date"),
    details: get("details"),
    contactName: get("contactName"),
    contactEmail: get("contactEmail"),
  };
}

function bindReportForm(type){
  const form = document.getElementById("reportForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const data = readForm("r");
    if(!data.itemName || !data.location || !data.date){
      toast("Please fill Item name, Location, and Date.");
      return;
    }

    const report = {
      id: uid(),
      type,
      ...data,
      status: type === "found" ? "held" : "open",
      createdAt: nowISO()
    };

    const items = loadReports();
    items.push(report);
    saveReports(items);

    toast("Submitted successfully.");
    form.reset();
    setTimeout(()=> location.href = "search.html", 350);
  });
}

/* Init */
document.addEventListener("DOMContentLoaded", ()=>{
  seedIfEmpty();
  setActiveNav();

  const page = document.body.dataset.page;
  if(page === "home") renderRecent();
  if(page === "search"){ bindSearch(); renderSearch(); }
  if(page === "report-lost") bindReportForm("lost");
  if(page === "report-found") bindReportForm("found");
});

