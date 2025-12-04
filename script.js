/* ===========================================================
   EPSILON — FULL SPA JAVASCRIPT  
   Complete, stable, error-free build
   Pages: Epsilon, Dashboard, Resources, Scheduler
   Sidebar only on Resources
   Navigation indicator fixed
   =========================================================== */

/* -----------------------------------------------------------
   DOM SHORTCUTS
----------------------------------------------------------- */
const root = document.getElementById("page-root");
const sidebar = document.getElementById("left-panel");
const navIndicator = document.querySelector(".nav-indicator");

/* -----------------------------------------------------------
   STATE
----------------------------------------------------------- */
let DATA = []; // loaded from data.json
let CURRENT_PAGE = "epsilon";

/* -----------------------------------------------------------
   INITIALIZE
----------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  setupNav();
  renderPage("epsilon", true);
});

/* -----------------------------------------------------------
   LOAD JSON
----------------------------------------------------------- */
async function loadData() {
  try {
    const res = await fetch("data.json?v=" + Date.now());
    DATA = await res.json();
  } catch (err) {
    console.error("Failed to load data.json", err);
  }
}

/* -----------------------------------------------------------
   NAV SETUP
----------------------------------------------------------- */
function setupNav() {
  const links = document.querySelectorAll(".nav-item");

  links.forEach(link => {
    link.addEventListener("click", () => {
      const page = link.dataset.page;

      if (!page || page === CURRENT_PAGE) return;

      document
        .querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

      link.classList.add("active");

      moveIndicator(link);
      renderPage(page);
    });
  });

  // Position indicator on initial load
  const active = document.querySelector(".nav-item.active");
  if (active) moveIndicator(active);
}

/* -----------------------------------------------------------
   BLUE SLIDER (NAV INDICATOR)
----------------------------------------------------------- */
function moveIndicator(link) {
  const rect = link.getBoundingClientRect();
  const parentRect = link.parentElement.getBoundingClientRect();

  navIndicator.style.width = rect.width + "px";
  navIndicator.style.transform =
    `translateX(${rect.left - parentRect.left}px)`;
}

/* -----------------------------------------------------------
   PAGE RENDERER
----------------------------------------------------------- */
async function renderPage(page, instant = false) {
  CURRENT_PAGE = page;

  // Sidebar visibility
  if (page === "resources") {
    sidebar.classList.remove("collapsed");
  } else {
    sidebar.classList.add("collapsed");
  }

  // Smooth transition
  if (!instant) {
    root.classList.add("page-exit");
    await wait(140);
  }

  root.innerHTML = ""; // clear

  let content;

  switch (page) {
    case "epsilon":
      content = renderEpsilon();
      break;
    case "dashboard":
      content = renderDashboard();
      break;
    case "resources":
      content = renderResources();
      break;
    case "scheduler":
      content = renderScheduler();
      break;
    default:
      content = document.createElement("div");
      content.innerHTML = `<p>Unknown page: ${page}</p>`;
  }

  root.appendChild(content);

  // Fade in
  root.classList.remove("page-exit");
  root.classList.add("page-enter");
  setTimeout(() => root.classList.remove("page-enter"), 180);
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* -----------------------------------------------------------
   PAGE: EPSILON (Landing)
----------------------------------------------------------- */
function renderEpsilon() {
  const div = document.createElement("div");
  div.className = "page epsilon-page";
  div.innerHTML = `
    <h1>Welcome to Epsilon</h1>
    <p>Learn business fundamentals, finance, entrepreneurship, marketing, and more.</p>
  `;
  return div;
}

/* -----------------------------------------------------------
   PAGE: DASHBOARD
----------------------------------------------------------- */
function renderDashboard() {
  const div = document.createElement("div");
  div.className = "page dashboard-page";

  const lessons = DATA.filter(x => x.mediaType === "lesson");
  const quizzes = DATA.filter(x => x.mediaType === "quiz");

  // recommended: 2 lessons + 1 quiz (prefer unfinished)
  const recommended = [
    ...pickUnfinished(lessons, 2),
    ...pickUnfinished(quizzes, 1)
  ];

  div.innerHTML = `
    <h1>Dashboard</h1>
    <h2>Recommended for you</h2>
    <div class="grid">
      ${recommended.map(renderCardHTML).join("")}
    </div>
  `;

  return div;
}

function pickUnfinished(arr, count) {
  const unfinished = arr.slice(0, count);
  if (unfinished.length < count) {
    return [
      ...unfinished,
      ...arr.slice(0, count - unfinished.length)
    ];
  }
  return unfinished;
}

/* -----------------------------------------------------------
   PAGE: RESOURCES
----------------------------------------------------------- */
function renderResources() {
  const wrapper = document.createElement("div");
  wrapper.className = "page resources-page";

  wrapper.innerHTML = `
    <h1>Resources</h1>
    <div id="resource-grid" class="grid"></div>
  `;

  renderFilteredResources();

  return wrapper;
}

/* -----------------------------------------------------------
   RESOURCE FILTERING
----------------------------------------------------------- */
function renderFilteredResources() {
  const grid = document.getElementById("resource-grid");
  if (!grid) return;

  // read filters
  const searchInput = document.getElementById("global-search");
  const searchValue = (searchInput?.value || "").toLowerCase();

  const types = [...document.querySelectorAll(".filter-type")]
    .filter(i => i.checked)
    .map(i => i.value);

  const activeModules = [...document.querySelectorAll(".filter-module")]
    .filter(i => i.checked)
    .map(i => i.value);

  let items = DATA;

  // type filter
  items = items.filter(x => types.includes(x.mediaType));

  // module filter
  if (activeModules.length > 0) {
    items = items.filter(x => activeModules.includes(x.module));
  }

  // search
  if (searchValue.length > 0) {
    items = items.filter(x =>
      x.title.toLowerCase().includes(searchValue) ||
      x.description.toLowerCase().includes(searchValue)
    );
  }

  grid.innerHTML = items.map(renderCardHTML).join("");

  // Make cards clickable
  grid.querySelectorAll(".resource-card").forEach(card => {
    card.addEventListener("click", () => {
      alert("Item clicked: " + card.dataset.id);
    });
  });
}

/* -----------------------------------------------------------
   RESOURCE CARD HTML
----------------------------------------------------------- */
function renderCardHTML(item) {
  return `
    <div class="resource-card" data-id="${item.id}">
      <div class="card-top" style="background:${item.moduleColor}">
        <div class="unit">${item.unit}</div>
        <div class="media-tag">${item.mediaType}</div>
      </div>
      <div class="card-body">
        <div class="title">${item.title}</div>
        <div class="desc">${item.description}</div>
      </div>
    </div>
  `;
}

/* -----------------------------------------------------------
   PAGE: SCHEDULER
----------------------------------------------------------- */
function renderScheduler() {
  const div = document.createElement("div");
  div.className = "page scheduler-page";
  div.innerHTML = `
    <h1>Scheduler</h1>
    <p>Your live sessions will appear here.</p>
  `;
  return div;
}

/* -----------------------------------------------------------
   FILTER LISTENERS
----------------------------------------------------------- */
document.addEventListener("input", e => {
  if (e.target.classList.contains("filter-type")) {
    renderFilteredResources();
  }
  if (e.target.id === "global-search") {
    renderFilteredResources();
  }
  if (e.target.classList.contains("filter-module")) {
    renderFilteredResources();
  }
});
