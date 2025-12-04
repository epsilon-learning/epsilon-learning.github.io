// script.js — regenerated v1.1.0
// Clean SPA implementing: Epsilon, Dashboard, Resources(with sidebar), Scheduler
// - Sidebar only on Resources (no residual gap elsewhere)
// - Nav indicator robust
// - Carousel auto left-loop
// - Dashboard recommended picks (2 unfinished lessons + 1 unfinished quiz fallback)
(() => {
  const DATA_URL = "data.json?v=" + Date.now();
  const pageRoot = document.getElementById("page-root");
  const leftPanel = document.getElementById("left-panel");
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const navIndicator = document.querySelector(".nav-indicator");
  const moduleListEl = document.getElementById("module-list");
  const globalSearch = document.getElementById("global-search");
  const containerEl = document.querySelector(".container");

  let DATA = [];
  let MODULES = {};
  const state = { page: "epsilon", filters: { types: new Set(["lesson","quiz","video","meeting"]), modules: new Set(), q: "" } };

  const LS_PROGRESS = "eps_progress_v1";
  const LS_SCHEDULE = "eps_schedule_v1";

  /* --- DOM helpers --- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHtml = s => (s===undefined||s===null) ? "" : String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* --- load data.json safely --- */
  async function loadData(){
    try{
      const res = await fetch(DATA_URL);
      if(!res.ok) throw new Error("data.json fetch failed");
      const json = await res.json();
      DATA = Array.isArray(json) ? json : [];
    }catch(e){
      console.warn("loadData:", e);
      DATA = [];
    }
  }

  /* --- nav indicator --- */
  function updateNavIndicator(){
    if(!navIndicator) return;
    const active = document.querySelector(".nav-item.active");
    if(!active || !active.parentElement){ navIndicator.style.width = "0px"; navIndicator.style.transform = "translateX(0px)"; return; }
    const pRect = active.parentElement.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    navIndicator.style.width = Math.round(r.width) + "px";
    navIndicator.style.transform = `translateX(${Math.round(r.left - pRect.left)}px)`;
  }
  window.addEventListener("resize", updateNavIndicator);

  /* --- local storage helpers --- */
  function loadProgress(){ try{ return JSON.parse(localStorage.getItem(LS_PROGRESS))||{} }catch{return{}} }
  function saveProgress(obj){ try{ localStorage.setItem(LS_PROGRESS, JSON.stringify(obj)) }catch{} }
  function loadSchedule(){ try{ return JSON.parse(localStorage.getItem(LS_SCHEDULE))||[] }catch{return[]} }
  function saveSchedule(arr){ try{ localStorage.setItem(LS_SCHEDULE, JSON.stringify(arr)) }catch{} }

  /* --- build modules list in sidebar --- */
  function buildModules(){
    MODULES = {};
    DATA.forEach(d => {
      const mid = d.module || "00";
      if(!MODULES[mid]) MODULES[mid] = { moduleName: d.moduleName || ("Module " + mid), color: d.moduleColor || "#777" };
    });
    if(!moduleListEl) return;
    const keys = Object.keys(MODULES).sort();
    moduleListEl.innerHTML = keys.map(k => {
      const m = MODULES[k];
      return `<li class="module-item" data-module="${k}"><span class="module-dot" style="background:${m.color}"></span><span class="module-label">${escapeHtml(k)} ${escapeHtml(m.moduleName)}</span></li>`;
    }).join("");
    // attach toggles
    $$(".module-item", moduleListEl).forEach(li=>{
      li.addEventListener("click", () => {
        const id = li.dataset.module;
        if(!id) return;
        if(state.filters.modules.has(id)){ state.filters.modules.delete(id); li.classList.remove("selected"); }
        else { state.filters.modules.add(id); li.classList.add("selected"); }
        renderCurrent();
      });
    });
  }

  /* --- type filter handlers --- */
  function getTypeCheckboxes(){ return $$(".filter-type"); }
  function attachTypeHandlers(){
    getTypeCheckboxes().forEach(cb => cb.addEventListener("change", ()=>{
      const boxes = getTypeCheckboxes();
      state.filters.types = new Set(boxes.filter(x=>x.checked).map(x=>x.value));
      renderCurrent();
    }));
  }

  /* --- search handler --- */
  function attachSearch(){
    if(!globalSearch) return;
    globalSearch.addEventListener("input", e=>{
      state.filters.q = (e.target.value||"").trim().toLowerCase();
      renderCurrent();
    });
  }

  /* --- cards & statuses --- */
  const ICON_MAP = { quiz:"fa-list-check", lesson:"fa-book-open", video:"fa-play", meeting:"fa-users" };
  function getStatusTagHtml(item){
    const prog = loadProgress();
    const done = !!prog[item.id];
    if(item.mediaType === "quiz"){
      const total = (item.questions||[]).length || 0;
      if(done){ const score = prog[item.id + "_score"] || `${total}/${total}`; return `<div class="status-tag status-complete"><span class="icon"><i class="fa-solid fa-circle-check"></i></span><span class="status-num">completed: ${escapeHtml(score)}</span></div>`; }
      return `<div class="status-tag status-incomplete"><span class="icon"><i class="fa-solid fa-circle-xmark"></i></span><span class="status-num">incomplete: -/${total}</span></div>`;
    } else {
      if(done) return `<div class="status-tag status-complete"><span class="icon"><i class="fa-solid fa-circle-check"></i></span><span class="status-num">completed</span></div>`;
      return `<div class="status-tag status-incomplete"><span class="icon"><i class="fa-regular fa-circle-xmark"></i></span><span class="status-num">incomplete</span></div>`;
    }
  }
  function makeCard(item){
    const topColor = item.moduleColor || "#777";
    return `
      <article class="module-card" data-id="${escapeHtml(item.id)}" data-media="${escapeHtml(item.mediaType)}">
        <div class="top" style="background:${topColor}">
          <div class="unit">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div>
          <div class="media-icon"><i class="fa-solid ${ICON_MAP[item.mediaType]||'fa-file'}"></i></div>
        </div>
        <div class="body">
          <div class="title">${escapeHtml(item.title)}</div>
          ${getStatusTagHtml(item)}
          <div class="desc">${escapeHtml(item.description||"")}</div>
          <div class="chips">${(item.tags||[]).map(t=>`<div class="chip">${escapeHtml(t)}</div>`).join("")}</div>
        </div>
      </article>
    `;
  }

  /* --- templates --- */
  function homeTemplate(){
    const preview = DATA.slice(0,6).map(makeCard).join("");
    // duplicate preview for seamless left-loop
    return `
      <div class="page-transition card"><h1>Why Us</h1><p class="muted">Epsilon helps FBLA students learn business fundamentals quickly.</p></div>
      <div class="card"><h3>Featured</h3><div class="carousel"><div id="featured-track" class="carousel-track">${preview}${preview}</div></div></div>
    `;
  }

  function dashboardTemplate(){
    const prog = loadProgress();
    const unfinishedLessons = DATA.filter(d=>d.mediaType==="lesson" && !prog[d.id]);
    const unfinishedQuizzes = DATA.filter(d=>d.mediaType==="quiz" && !prog[d.id]);
    const pickRandom = (arr,n) => {
      const a = arr.slice(); const out=[]; while(out.length<n && a.length) out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return out;
    };
    let picks = [];
    picks = picks.concat(pickRandom(unfinishedLessons,2));
    picks = picks.concat(pickRandom(unfinishedQuizzes,1));
    if(picks.length < 3){
      const fallback = DATA.filter(d=>d.mediaType==="lesson"||d.mediaType==="quiz");
      picks = picks.concat(pickRandom(fallback.filter(x=>!picks.includes(x)), 3 - picks.length));
    }
    const cardsHtml = picks.map(makeCard).join("");
    const completedCount = Object.keys(prog).filter(k=>!k.endsWith("_score") && prog[k]).length;
    const streak = computeStreak();
    return `
      <div class="page-transition">
        <div class="card"><h2>Dashboard</h2><div style="margin-top:12px"><div class="metric">Completed: <strong>${completedCount}</strong></div><div class="metric">Streak: <strong>${streak}</strong></div></div></div>
        <div class="card" style="margin-top:12px"><h3>Recommended Lessons & Quiz</h3><div class="grid">${cardsHtml}</div></div>
      </div>
    `;
  }

  function resourcesTemplate(){
    return `<div class="page-transition"><div class="card"><h2>Resources</h2><p class="muted">Filter by type & module on the left. Click a card to open.</p></div><div id="resources-grid" class="grid"></div></div>`;
  }

  function schedulerTemplate(){
    return `<div class="page-transition card"><h2>Scheduler</h2>
      <div style="display:flex;flex-direction:column;gap:8px"><input id="sched-title" class="sidebar-search" placeholder="Title"/><input id="sched-date" type="date" class="sidebar-search"/><input id="sched-time" type="time" class="sidebar-search"/><input id="sched-teacher" class="sidebar-search" placeholder="Teacher"/><div><button id="sched-create" class="btn-small">Create & Schedule</button></div></div></div>`;
  }

  /* --- navigation & rendering --- */
  function setActiveNav(page){
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
    setTimeout(updateNavIndicator, 10);
  }

  function showSidebarOnResources(shouldShow){
    if(!containerEl || !leftPanel) return;
    if(shouldShow){
      containerEl.classList.add("with-sidebar");
      containerEl.classList.remove("no-sidebar");
      leftPanel.classList.remove("collapsed");
    } else {
      containerEl.classList.remove("with-sidebar");
      containerEl.classList.add("no-sidebar");
      leftPanel.classList.add("collapsed");
    }
  }

  function navigateTo(page){
    const p = page || "epsilon";
    state.page = p;
    setActiveNav(p);
    // show sidebar only on resources
    showSidebarOnResources(p === "resources");
    renderPage(p);
  }

  function renderPage(name){
    if(!pageRoot) return;
    if(name === "epsilon") pageRoot.innerHTML = homeTemplate();
    else if(name === "dashboard") pageRoot.innerHTML = dashboardTemplate();
    else if(name === "resources") pageRoot.innerHTML = resourcesTemplate();
    else if(name === "scheduler") pageRoot.innerHTML = schedulerTemplate();
    else pageRoot.innerHTML = `<div class="card">Page not found</div>`;
    setTimeout(()=> afterRender(name), 60);
  }

  /* --- after-render handlers --- */
  function afterRender(name){
    // scheduler create
    if(name === "scheduler"){
      $("#sched-create")?.addEventListener("click", ()=>{
        const title = $("#sched-title")?.value.trim();
        const date = $("#sched-date")?.value;
        const time = $("#sched-time")?.value;
        const teacher = $("#sched-teacher")?.value.trim();
        if(!title||!date||!time) return alert("Fill title, date, time");
        const arr = loadSchedule(); arr.push({ id:"s"+Date.now(), title, date, time, teacher }); saveSchedule(arr);
        alert("Scheduled"); navigateTo("dashboard");
      });
    }

    // populate resources grid if resources page
    if(name === "resources") populateResources();

    // carousel setup on home (auto left loop)
    const track = $("#featured-track");
    if(track){
      // calculate animation duration using pixel width
      const totalW = track.scrollWidth;
      const speed = 120; // px per second
      let duration = Math.max(14, Math.round(totalW / speed));
      track.classList.add("animated");
      track.style.animationDuration = duration + "s";
    }

    // delegated click on cards
    pageRoot.removeEventListener("click", pageClickHandler);
    pageRoot.addEventListener("click", pageClickHandler);

    // reattach search (sidebar may appear)
    attachSearch();
  }

  function pageClickHandler(e){
    const card = e.target.closest(".module-card");
    if(!card) return;
    const id = card.dataset.id;
    if(!id) return;
    const item = DATA.find(d=>d.id === id);
    if(!item) return;
    if(item.mediaType === "lesson") openLesson(item);
    else if(item.mediaType === "quiz") openQuiz(item);
    else openGeneric(item);
  }

  /* --- resources population --- */
  function populateResources(){
    const grid = $("#resources-grid");
    if(!grid) return;
    const types = state.filters.types;
    const modulesFilter = state.filters.modules;
    const q = state.filters.q || "";
    const items = DATA.filter(it => {
      if(!types.has(it.mediaType)) return false;
      if(modulesFilter.size && !modulesFilter.has(it.module)) return false;
      if(q){
        const title = (it.title||"").toLowerCase();
        const tags = (it.tags||[]).map(x=>x.toLowerCase());
        if(!title.includes(q) && !tags.some(x=>x.includes(q))) return false;
      }
      return true;
    });
    grid.innerHTML = items.length ? items.map(makeCard).join("") : `<div class="card">No items found</div>`;
  }

  /* --- viewers (lesson, quiz, generic) --- */
  function openLesson(item){
    pageRoot.innerHTML = `<div class="page-transition"><div class="card"><button class="btn-back" id="back-lesson"><span class="arrow">◀</span>Back</button><div style="margin-top:8px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2></div></div><div class="card">${item.contentHtml||"<p>No content.</p>"}</div><div class="card"><button id="mark-done" class="btn-small">Mark Done</button></div></div>`;
    $("#back-lesson")?.addEventListener("click", ()=> navigateTo("resources"));
    $("#mark-done")?.addEventListener("click", ()=> {
      const p = loadProgress(); p[item.id] = true; saveProgress(p); alert("Marked done"); navigateTo("dashboard");
    });
  }

  function openQuiz(item){
    const qs = item.questions || [];
    let answers = Array(qs.length).fill(null);
    pageRoot.innerHTML = `<div class="page-transition quiz-view"><div class="card"><button class="btn-back" id="back-quiz"><span class="arrow">◀</span>Back</button><div style="margin-top:8px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2></div></div><div id="questions-area">${qs.map((q,i)=>`<div class="question" data-q="${i}"><div style="font-weight:700">Q${i+1}. ${escapeHtml(q.q)}</div><div class="options">${q.options.map((opt,oi)=>`<div class="opt" data-qi="${i}" data-oi="${oi}">${escapeHtml(opt)}</div>`).join("")}</div></div>`).join("")}</div><div style="display:flex;gap:10px"><button id="submit-quiz" class="btn-small">Submit</button><button id="cancel-quiz" class="btn-small btn-light">Cancel</button></div></div>`;
    $("#back-quiz")?.addEventListener("click", ()=> navigateTo("resources"));
    $("#cancel-quiz")?.addEventListener("click", ()=> navigateTo("resources"));

    $$(".opt").forEach(el=>{
      el.addEventListener("click", ()=>{
        const qi = +el.dataset.qi, oi = +el.dataset.oi;
        answers[qi] = oi;
        const qEl = $(`.question[data-q="${qi}"]`);
        if(qEl) qEl.querySelectorAll(".opt").forEach(o=>o.classList.remove("selected"));
        el.classList.add("selected");
      });
    });

    $("#submit-quiz")?.addEventListener("click", ()=>{
      let correct = 0;
      qs.forEach((q,i)=>{ if(answers[i] === q.answer) correct++; });
      const total = qs.length || 0;
      const percent = total ? Math.round((correct/total)*100) : 0;
      const p = loadProgress(); p[item.id] = true; p[item.id + "_score"] = `${correct}/${total}`; saveProgress(p);
      pageRoot.innerHTML = `<div class="page-transition"><div class="card result"><h2>Result</h2><div style="font-size:28px;font-weight:700">${percent}%</div><div style="margin-top:8px">${correct} / ${total} correct</div><div style="margin-top:12px"><button id="review-btn" class="btn-small">Review answers</button> <button id="back-list" class="btn-small btn-light">Back</button></div></div><div id="review-area" style="margin-top:12px"></div></div>`;
      $("#back-list")?.addEventListener("click", ()=> navigateTo("resources"));
      $("#review-btn")?.addEventListener("click", ()=> renderReview(qs, answers));
    });
  }

  function renderReview(questions, answers){
    const area = $("#review-area");
    if(!area) return;
    area.innerHTML = questions.map((q,i)=>{
      const user = answers[i]; const correct = q.answer; const isCorrect = user === correct;
      return `<div class="question" style="margin-bottom:10px"><div style="font-weight:700">Q${i+1}. ${escapeHtml(q.q)}</div><div style="margin-top:8px">${q.options.map((opt,oi)=>{ let mark="", cls=""; if(oi===correct){ mark="✅"; cls="review-correct"; } else if(oi===user && !isCorrect){ mark="❌"; cls="review-wrong"; } return `<div style="padding:8px;border-radius:8px;margin-top:6px;background:#fff;border:1px solid rgba(0,0,0,0.04)">${mark} <strong class="${cls}">${escapeHtml(opt)}</strong></div>`; }).join("")}</div></div>`;
    }).join("");
    $("#review-area")?.scrollIntoView({behavior:"smooth"});
  }

  function openGeneric(item){
    pageRoot.innerHTML = `<div class="page-transition card"><button class="btn-back" id="back-g"><span class="arrow">◀</span>Back</button><div style="margin-top:10px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2><p class="muted">${escapeHtml(item.description||"")}</p></div></div>`;
    $("#back-g")?.addEventListener("click", ()=> navigateTo("resources"));
  }

  /* --- streak & badges --- */
  function computeStreak(){
    try{
      const raw = localStorage.getItem("eps_visits_v1");
      const visits = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0,10);
      if(!visits.includes(today)) visits.push(today);
      const uniq = Array.from(new Set(visits));
      localStorage.setItem("eps_visits_v1", JSON.stringify(uniq));
      let streak = 0; let d = new Date();
      while(true){
        const iso = d.toISOString().slice(0,10);
        if(uniq.includes(iso)){ streak++; d.setDate(d.getDate()-1); } else break;
      }
      return streak;
    }catch{return 0;}
  }

  /* --- renderCurrent --- */
  function renderCurrent(){ if(state.page === "resources") populateResources(); }

  /* --- navigation wiring --- */
  function wireNav(){
    document.querySelectorAll(".nav-item").forEach(it=>{
      it.addEventListener("click", ()=> {
        const page = it.dataset.page || "epsilon";
        navigateTo(page);
      });
    });
  }

  /* --- init --- */
  async function init(){
    await loadData();
    buildModules();
    attachTypeHandlers();
    attachSearch();
    wireNav();
    // initial placement and start
    setTimeout(()=>{ updateNavIndicator(); navIndicator?.classList.remove("no-animate"); }, 80);
    // set container default to no-sidebar to avoid gap
    containerEl?.classList.add("no-sidebar");
    navigateTo("epsilon");
  }

function updateSidebarState(page) {
    const sidebar = document.getElementById("left-panel");
    const container = document.querySelector(".container");

    const needsSidebar = (page === "resources");

    if (needsSidebar) {
        sidebar.classList.remove("collapsed");
        container.classList.remove("sidebar-collapsed");
    } else {
        sidebar.classList.add("collapsed");
        container.classList.add("sidebar-collapsed");
    }
}
updateSidebarState(page);


  
  // expose small helpers (optional)
  window.$ = $; window.$$ = $$;


  
  init();

})();
