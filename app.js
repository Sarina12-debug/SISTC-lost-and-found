const STORAGE_KEY = "lf_items_v1";

function seedIfEmpty() {
  const existing = loadItems();
  if (existing.length) return;

  const seed = [
    {
      id: crypto.randomUUID(),
      type: "lost",
      itemName: "Black AirPods Case",
      category: "Electronics",
      date: "2026-01-10",
      location: "Library",
      description: "Small black AirPods case. No keychain.",
      contactName: "Student Support",
      contactEmail: "support@example.com",
      createdAt: Date.now()
    },
    {
      id: crypto.randomUUID(),
      type: "found",
      itemName: "Blue Water Bottle",
      category: "Personal",
      date: "2026-01-12",
      location: "Cafeteria",
      description: "Blue bottle with sticker on side.",
      contactName: "Reception",
      contactEmail: "reception@example.com",
      createdAt: Date.now()
    },
    {
      id: crypto.randomUUID(),
      type: "lost",
      itemName: "Student ID Card",
      category: "Documents",
      date: "2026-01-14",
      location: "Bus Stop",
      description: "ID card in clear sleeve.",
      contactName: "Sarina",
      contactEmail: "sarina@example.com",
      createdAt: Date.now()
    }
  ];
  saveItems(seed);
}

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function addItem(item) {
  const items = loadItems();
  items.unshift(item);
  saveItems(items);
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.classList.add("show");
  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => el.classList.remove("show"), 2800);
}

function setActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });
}

function prettyType(type){
  return type === "lost" ? "Lost" : "Found";
}

function renderItems(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="notice"><div><strong>No results</strong><br><small>Try adjusting your search or filters.</small></div></div>`;
    return;
  }

  container.innerHTML = items.map(i => {
    const badgeClass = i.type === "lost" ? "lost" : "found";
    return `
      <article class="item">
        <span class="badge ${badgeClass}">
          <span class="badge-dot"></span>${prettyType(i.type)}
        </span>
        <h3>${escapeHtml(i.itemName)}</h3>
        <div class="meta">
          <span>${escapeHtml(i.category || "General")}</span>
          <span>•</span>
          <span>${escapeHtml(i.location || "Unknown")}</span>
          <span>•</span>
          <span>${escapeHtml(i.date || "")}</span>
        </div>
        <p style="margin:10px 0 0; color: var(--muted); font-size: 14px;">
          ${escapeHtml(i.description || "")}
        </p>
      </article>
    `;
  }).join("");
}

function escapeHtml(str){
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initHome() {
  seedIfEmpty();
  const items = loadItems().slice(0, 6);
  renderItems("recentItems", items);
}

function initForm(type) {
  seedIfEmpty();
  const form = document.getElementById("itemForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    const required = ["itemName","category","date","location","description","contactName","contactEmail"];
    const missing = required.filter(k => !String(data[k] || "").trim());
    if (missing.length) {
      toast("Please fill in all required fields.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.contactEmail).trim());
    if (!emailOk) {
      toast("Please enter a valid email address.");
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      type,
      itemName: data.itemName.trim(),
      category: data.category.trim(),
      date: data.date,
      location: data.location.trim(),
      description: data.description.trim(),
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail.trim(),
      createdAt: Date.now()
    });

    form.reset();
    toast("Submitted successfully. Added to search.");
  });
}

function initSearch() {
  seedIfEmpty();
  const q = document.getElementById("q");
  const type = document.getElementById("type");
  const category = document.getElementById("category");

  const doSearch = () => {
    const query = (q?.value || "").trim().toLowerCase();
    const t = (type?.value || "all");
    const c = (category?.value || "all");

    let items = loadItems();

    if (t !== "all") items = items.filter(i => i.type === t);
    if (c !== "all") items = items.filter(i => (i.category || "").toLowerCase() === c.toLowerCase());

    if (query) {
      items = items.filter(i => {
        const hay = `${i.itemName} ${i.location} ${i.description} ${i.category}`.toLowerCase();
        return hay.includes(query);
      });
    }

    renderItems("results", items);
  };

  [q, type, category].forEach(el => el && el.addEventListener("input", doSearch));
  doSearch();
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();

  const page = (document.body.dataset.page || "").toLowerCase();
  if (page === "home") initHome();
  if (page === "report-lost") initForm("lost");
  if (page === "report-found") initForm("found");
  if (page === "search") initSearch();
});
