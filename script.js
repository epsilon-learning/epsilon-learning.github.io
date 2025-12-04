// Epsilon SPA v1.0.6
// Handles router, sidebar fade/expand (Option 3), filters, delegated clicks, quiz results + review, progress tags, animations
window.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data.json?v=" + Date.now();
  const pageRoot = document.getElementById("page-root");
  const leftPanel = document.getElementById("left-panel");
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const navIndicator = document.querySelector(".nav-indicator");
  const searchInput = document.getElementById("global-search");
  const moduleListEl = document.getElementById("module-list");
  const filterTypeEls = () => Array.from(document.querySelectorAll(".filter-type"));

  let DATA = [], MODULES = {}, state = { page: "epsilon", filters: { types: new Set(["lesson","quiz","video","meeting"]), modules: new Set(), q: "" } };

  const LS_PROGRESS = "eps_progress_v1";
  const LS_SCHEDULE = "eps_schedule_v1";

  // safe fetch
  async function loadData(){
    try{
      const r = await fetch(DATA_URL);
      if(!r.ok) throw new Error("data.json not found");
      const json = await r.json();
      DATA = Array.isArray(json) ? json : [];
    }catch(e){ console.warn("Could not load data.json:", e); DATA = []; }
  }

  // NAV indicator move
  function moveIndicatorTo(el){
    if(!el) return;
    const parent = el.parentElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    navIndicator.style.width = Math.round(r.width) + "px";
    navIndicator.style.transform = `translateX(${Math.round(r.left - parent.left)}px)`;
  }

  // Ensure one nav active
  function ensureActiveNav(){
    let active = document.querySelector(".nav-item.active");
    if(!active){ navItems[0].classList.add("active"); active = navItems[0]; }
    moveIndicatorTo(active);
  }

  window.addEventListener("load", () => {
    navIndicator.classList.add("no-animate");
    ensureActiveNav();
    requestAnimationFrame(()=> navIndicator.classList.remove("no-animate"));
  });

  // build modules
  function buildModules(){
    MODULES = {};
    DATA.forEach(it => {
      const mid = it.module || "00";
      if(!MODULES[mid]) MODULES[mid] = { moduleName: it.moduleName || ("Module " + mid), color: it.moduleColor || "#777" };
    });
    const keys = Object.keys(MODULES).sort();
    moduleListEl.innerHTML = keys.map(k => {
      const m = MODULES[k];
      return `<li data-module="${k}" class="module-item"><span class="module-dot" style="background:${m.color}"></span><span class="module-label">${k} ${m.moduleName}</span></li>`;
    }).join("");
    // attach click toggles
    Array.from(moduleListEl.querySelectorAll(".module-item")).forEach(li=>{
      li.addEventListener("click", ()=>{
        const id = li.dataset.module;
        if(state.filters.modules.has(id)) state.filters.modules.delete(id);
        else state.filters.modules.add(id);
        li.classList.toggle("selected");
        renderCurrent();
      });
    });
  }

  // filter helpers
  function getCheckedTypes(){ return new Set(filterTypeEls().filter(cb=>cb.checked).map(cb=>cb.value)); }
  function attachFilterTypeHandlers(){
    filterTypeEls().forEach(cb => cb.addEventListener("change", ()=>{
      state.filters.types = getCheckedTypes();
      renderCurrent();
    }));
  }
  if(filterTypeEls().length) attachFilterTypeHandlers();

  // search handler
  if(searchInput) searchInput.addEventListener("input", e => {
    state.filters.q = (e.target.value || "").trim().toLowerCase();
    renderCurrent();
  });

  // localStorage helpers
  function loadProgress(){ try{ return JSON.parse(localStorage.getItem(LS_PROGRESS))||{} }catch{ return {} } }
  function saveProgress(obj){ localStorage.setItem(LS_PROGRESS, JSON.stringify(obj)) }
  function loadSchedule(){ try{ return JSON.parse(localStorage.getItem(LS_SCHEDULE))||[] }catch{ return [] } }
  function saveSchedule(s){ localStorage.setItem(LS_SCHEDULE, JSON.stringify(s)) }

  document.getElementById("clear-progress")?.addEventListener("click", ()=> { if(confirm("Clear all progress?")){ localStorage.removeItem(LS_PROGRESS); location.reload(); } });
  document.getElementById("clear-schedule")?.addEventListener("click", ()=> { if(confirm("Clear schedule?")){ localStorage.removeItem(LS_SCHEDULE); location.reload(); } });

  // card markup and status tag
  const ICON_MAP = { quiz: "fa-list-check", lesson: "fa-book-open", video: "fa-play", meeting: "fa-users" };
  function statusTag(item){
    const prog = loadProgress();
    const done = !!prog[item.id];
    if(item.mediaType === "quiz"){
      if(done){
        const score = prog[item.id + "_score"];
        const total = (item.questions||[]).length || 0;
        return `<div class="status-tag status-complete"><span class="icon"><i class="fa-solid fa-circle-check"></i></span><span class="status-num">completed: ${score ?? total}/${total}</span></div>`;
      } else {
        const total = (item.questions||[]).length || 0;
        return `<div class="status-tag status-incomplete"><span class="icon"><i class="fa-solid fa-circle-xmark"></i></span><span class="status-num">incomplete: -/${total}</span></div>`;
      }
    } else {
      if(done) return `<div class="status-tag status-complete"><span class="icon"><i class="fa-solid fa-circle-check"></i></span><span class="status-num">completed</span></div>`;
      return `<div class="status-tag status-incomplete"><span class="icon"><i class="fa-regular fa-circle-xmark"></i></span><span class="status-num">incomplete</span></div>`;
    }
  }

  function makeCard(item){
    const topColor = item.moduleColor || "#777";
    return `
      <article class="module-card" data-id="${item.id}" data-media="${item.mediaType}">
        <div class="top" style="background:${topColor}">
          <div class="unit">${item.unit} • ${item.moduleName}</div>
          <div class="media-icon"><i class="fa-solid ${ICON_MAP[item.mediaType]||'fa-file'}"></i></div>
        </div>
        <div class="body">
          <div class="title">${escapeHtml(item.title)}</div>
          ${statusTag(item)}
          <div class="desc">${escapeHtml(item.description||"")}</div>
          <div class="chips">${(item.tags||[]).map(t=>`<div class="chip">${escapeHtml(t)}</div>`).join("")}</div>
        </div>
      </article>
    `;
  }

  function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]) }

  // routing / page templates
  function homeTemplate(){
    const sample = DATA.slice(0,6).map(makeCard).join("");
    return `
      <div class="page-transition card">
        <h1>Why Us</h1>
        <p class="muted">Epsilon helps FBLA students learn business fundamentals quickly.</p>
      </div>
      <div class="card">
        <h3>Featured</h3>
        <div class="carousel" aria-hidden="false"><div class="carousel-track">${sample}${sample}</div></div>
      </div>
    `;
  }

  function dashboardTemplate(){
    const prog = loadProgress();
    const completedCount = Object.keys(prog).filter(k=>!k.endsWith("_score") && prog[k]).length;
    const streak = computeStreak();
    const badges = computeBadges(prog).map(b=>`<div class="badge">${escapeHtml(b)}</div>`).join("");
    const schedule = loadSchedule();
    return `
      <div class="page-transition">
        <div class="card"><h2>Dashboard</h2><div style="display:flex;gap:12px;margin-top:12px">
          <div class="metric">Completed: <strong>${completedCount}</strong></div>
          <div class="metric">Streak: <strong>${streak}</strong></div>
        </div></div>

        <div class="card" style="margin-top:12px">
          <h3>Scheduled</h3>
          ${schedule.length ? schedule.map(s=>`<div class="card">${escapeHtml(s.title)}<div class="muted">${s.date} ${s.time} EST • ${escapeHtml(s.teacher||"TBA")}</div></div>`).join("") : "<div class='muted'>No scheduled events</div>"}
        </div>
      </div>
      <div class="card"><h3>Badges</h3><div class="badges">${badges}</div></div>
    `;
  }

  function resourcesTemplate(){
    return `<div class="page-transition">
      <div class="card"><h2>Resources</h2><p class="muted">Filter on left. Click a card to open.</p></div>
      <div id="resources-grid" class="grid"></div>
    </div>`;
  }

  function schedulerTemplate(){
    return `<div class="page-transition card">
      <h2>Scheduler</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input id="sched-title" class="sidebar-search" placeholder="Title">
        <input id="sched-date" type="date" class="sidebar-search">
        <input id="sched-time" type="time" class="sidebar-search">
        <input id="sched-teacher" class="sidebar-search" placeholder="Teacher">
        <div><button id="sched-create" class="btn-small">Create & Schedule</button></div>
      </div>
    </div>`;
  }

  function forYouTemplate(){
    const lessons = DATA.filter(d=>d.mediaType==="lesson");
    const quizzes = DATA.filter(d=>d.mediaType==="quiz");
    const pick = (arr,n)=>{ const a = arr.slice(); const out=[]; while(out.length<n && a.length) out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return out; };
    const ls = pick(lessons,3), qs = pick(quizzes,3);
    return `<div class="page-transition card"><h2>For You</h2></div>
      <h3>Lessons</h3><div class="grid">${ls.map(makeCard).join("")}</div>
      <h3 style="margin-top:12px">Quizzes</h3><div class="grid">${qs.map(makeCard).join("")}</div>`;
  }

  // render and after-render wiring
  function renderPage(name){
    state.page = name;
    navItems.forEach(n => n.classList.toggle("active", n.dataset.page === name));
    // nav indicator
    const active = document.querySelector(".nav-item.active");
    moveIndicatorTo(active);

    // sidebar behavior: collapsed on epsilon (home)
    if(name === "epsilon"){
      leftPanel.classList.remove("expanded");
      leftPanel.classList.add("collapsed");
      leftPanel.setAttribute("aria-hidden","true");
    } else {
      leftPanel.classList.remove("collapsed");
      leftPanel.classList.add("expanded");
      leftPanel.setAttribute("aria-hidden","false");
    }

    // render pages
    if(name==="epsilon") pageRoot.innerHTML = homeTemplate();
    else if(name==="dashboard") pageRoot.innerHTML = dashboardTemplate();
    else if(name==="resources") pageRoot.innerHTML = resourcesTemplate();
    else if(name==="scheduler") pageRoot.innerHTML = schedulerTemplate();
    else if(name==="forYou") pageRoot.innerHTML = forYouTemplate();
    else pageRoot.innerHTML = `<div class="card">Page not found</div>`;

    // small delay then wire interactions & populate dynamic lists
    setTimeout(()=> afterRender(name), 50);
  }

  function afterRender(name){
    // global actions
    document.getElementById("cta-dashboard")?.addEventListener("click", ()=> navigate("dashboard"));
    // scheduler create
    if(name==="scheduler"){
      document.getElementById("sched-create")?.addEventListener("click", ()=>{
        const title = document.getElementById("sched-title").value.trim();
        const date = document.getElementById("sched-date").value;
        const time = document.getElementById("sched-time").value;
        const teacher = document.getElementById("sched-teacher").value.trim();
        if(!title||!date||!time){ alert("Fill title, date and time"); return; }
        const arr = loadSchedule(); arr.push({ id: "s"+Date.now(), title, date, time, teacher }); saveSchedule(arr); alert("Scheduled"); renderPage("dashboard");
      });
    }

    // populate resources grid when resources page
    if(name === "resources") populateResources();

    // attach delegated click for module cards (delegation ensures clickability)
    pageRoot.addEventListener("click", pageClickHandler);
  }

  function pageClickHandler(e){
    const card = e.target.closest(".module-card");
    if(!card) return;
    const id = card.dataset.id;
    const item = DATA.find(d=>d.id===id);
    if(!item) return;
    // animate exit
    pageRoot.classList.add("page-transition");
    // open appropriate viewer
    if(item.mediaType === "lesson") openLesson(item);
    else if(item.mediaType === "quiz") openQuiz(item);
    else openGeneric(item);
  }

  // resources population with filters
  function populateResources(){
    const container = document.getElementById("resources-grid");
    if(!container) return;
    const types = state.filters.types;
    const modulesFilter = state.filters.modules;
    const q = state.filters.q || "";
    const items = DATA.filter(it=>{
      if(!types.has(it.mediaType)) return false;
      if(modulesFilter.size && !modulesFilter.has(it.module)) return false;
      if(q){
        const t = (it.title||"").toLowerCase();
        const tags = (it.tags||[]).map(x=>x.toLowerCase());
        if(!t.includes(q) && !tags.some(x=>x.includes(q))) return false;
      }
      return true;
    });
    container.innerHTML = items.length ? items.map(makeCard).join("") : `<div class="card">No items found</div>`;
  }

  // Lesson viewer
  function openLesson(item){
    pageRoot.innerHTML = `
      <div class="page-transition">
        <div class="card">
          <button class="btn-back" id="back"><span class="arrow">◀</span>Back</button>
          <div style="margin-top:8px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2></div>
        </div>
        <div class="card">${item.contentHtml || "<p>No content.</p>"}</div>
        <div class="card"><button id="mark-done" class="btn-small">Mark Done</button></div>
      </div>
    `;
    document.getElementById("back").addEventListener("click", ()=> renderPage("resources"));
    document.getElementById("mark-done").addEventListener("click", ()=>{
      const p = loadProgress(); p[item.id] = true; saveProgress(p); alert("Lesson marked complete"); renderPage("dashboard");
    });
  }

  // Quiz viewer + auto-results flow + review
  function openQuiz(item){
    const qs = item.questions || [];
    let answers = Array(qs.length).fill(null);
    pageRoot.innerHTML = `
      <div class="page-transition quiz-view" id="quiz-root">
        <div class="card">
          <button class="btn-back" id="back"><span class="arrow">◀</span>Back</button>
          <div style="margin-top:8px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2></div>
        </div>
        <div id="questions-area">
          ${qs.map((q,i)=>`
            <div class="question" data-q="${i}">
              <div style="font-weight:700">Q${i+1}. ${escapeHtml(q.q)}</div>
              <div class="options">
                ${q.options.map((opt,oi)=>`<div class="opt" data-qi="${i}" data-oi="${oi}">${escapeHtml(opt)}</div>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;gap:10px"><button id="submit-quiz" class="btn-small">Submit</button><button id="cancel-quiz" class="btn-small btn-light">Cancel</button></div>
      </div>
    `;
    document.getElementById("back").addEventListener("click", ()=> renderPage("resources"));
    document.getElementById("cancel-quiz").addEventListener("click", ()=> renderPage("resources"));

    // option click handling
    Array.from(document.querySelectorAll(".opt")).forEach(el=>{
      el.addEventListener("click", ()=> {
        const qi = +el.dataset.qi, oi = +el.dataset.oi;
        answers[qi] = oi;
        document.querySelectorAll(`.question[data-q="${qi}"] .opt`).forEach(o=>o.classList.remove("selected"));
        el.classList.add("selected");
      });
    });

    // submit: auto-show results and review layout (with animated appearance)
    document.getElementById("submit-quiz").addEventListener("click", ()=>{
      let correct = 0;
      qs.forEach((q,i)=> { if(answers[i] === q.answer) correct++; });
      const total = qs.length;
      const percent = total ? Math.round((correct/total)*100) : 0;
      // store progress + score
      const p = loadProgress(); p[item.id] = true; p[item.id + "_score"] = `${correct}/${total}`; saveProgress(p);

      // render results + review
      pageRoot.innerHTML = `
        <div class="page-transition">
          <div class="card result">
            <h2>Result</h2>
            <div style="font-size:28px;font-weight:700">${percent}%</div>
            <div style="margin-top:8px">${correct} / ${total} correct</div>
            <div style="margin-top:12px"><button id="review-btn" class="btn-small">Review answers</button> <button id="back-list" class="btn-small btn-light">Back</button></div>
          </div>
          <div id="review-area" style="margin-top:12px"></div>
        </div>
      `;
      document.getElementById("back-list").addEventListener("click", ()=> renderPage("resources"));
      document.getElementById("review-btn").addEventListener("click", ()=> renderReview(qs, answers));
    });
  }

  // review shows correct/incorrect per question with icons and colors
  function renderReview(questions, answers){
    const area = document.getElementById("review-area");
    if(!area) return;
    area.innerHTML = questions.map((q,i)=>{
      const user = answers[i];
      const correct = q.answer;
      const isCorrect = user === correct;
      return `
        <div class="question" style="margin-bottom:10px">
          <div style="font-weight:700">Q${i+1}. ${escapeHtml(q.q)}</div>
          <div style="margin-top:8px">${q.options.map((opt,oi)=> {
            const cls = (oi === correct) ? 'review-correct' : (oi === user && !isCorrect) ? 'review-wrong' : '';
            const icon = (oi === correct) ? '✅' : (oi === user && !isCorrect) ? '❌' : '';
            return `<div style="padding:8px;border-radius:8px;margin-top:6px;background:#fff;border:1px solid rgba(0,0,0,0.04)">${icon} <strong class="${cls}">${escapeHtml(opt)}</strong></div>`;
          }).join("")}</div>
        </div>
      `;
    }).join("");
    area.scrollIntoView({behavior:"smooth"});
  }

  function openGeneric(item){
    pageRoot.innerHTML = `
      <div class="page-transition card">
        <button class="btn-back" id="back"><span class="arrow">◀</span>Back</button>
        <div style="margin-top:10px"><div class="muted">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div><h2>${escapeHtml(item.title)}</h2><p class="muted">${escapeHtml(item.description||"")}</p></div>
      </div>
    `;
    document.getElementById("back").addEventListener("click", ()=> renderPage("resources"));
  }

  // compute streak & badges (simple)
  function computeStreak(){
    try{
      const raw = localStorage.getItem("eps_visits_v1");
      const visits = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0,10);
      if(!visits.includes(today)) visits.push(today);
      const uniq = Array.from(new Set(visits));
      localStorage.setItem("eps_visits_v1", JSON.stringify(uniq));
      // compute backward consecutive days
      let streak = 0; let d = new Date();
      while(true){
        const iso = d.toISOString().slice(0,10);
        if(uniq.includes(iso)){ streak++; d.setDate(d.getDate()-1); } else break;
      }
      return streak;
    }catch(e){ return 0; }
  }
  function computeBadges(progress){
    const doneCount = Object.keys(progress).filter(k=> !k.endsWith("_score") && progress[k]).length;
    const out = [];
    if(doneCount>=1) out.push("First Step");
    if(doneCount>=3) out.push("Learner");
    if(doneCount>=6) out.push("Dedicated");
    return out;
  }

  // navigation wiring
  navItems.forEach(n => n.addEventListener("click", (e) => {
    const page = n.dataset.page;
    renderPage(page);
  }));

  // general render current based on state
  function renderCurrent(){
    if(state.page === "resources") populateResources();
    else if(state.page === "forYou") renderPage("forYou");
  }

  // populate initial resources grid with delegation
  function populateResources(){
    const grid = document.getElementById("resources-grid");
    if(!grid) return;
    const types = state.filters.types;
    const modulesFilter = state.filters.modules;
    const q = state.filters.q || "";
    const items = DATA.filter(it=>{
      if(!types.has(it.mediaType)) return false;
      if(modulesFilter.size && !modulesFilter.has(it.module)) return false;
      if(q){
        const t = (it.title||"").toLowerCase();
        const tags = (it.tags||[]).map(x=>x.toLowerCase());
        if(!t.includes(q) && !tags.some(x=>x.includes(q))) return false;
      }
      return true;
    });
    grid.innerHTML = items.length ? items.map(makeCard).join("") : `<div class="card">No items found</div>`;
  }

  // Init sequence
  (async function init(){
    await loadData();
    buildModules();
    attachFilterTypeHandlers();
    // ensure nav indicator initial placement
    setTimeout(()=>{ ensureActiveNav(); }, 120);
    // start on epsilon
    renderPage("epsilon");
    // wire search input (exists in sidebar, but might be hidden initially)
    document.getElementById("global-search")?.addEventListener("input", (e)=> { state.filters.q = (e.target.value||"").trim().toLowerCase(); renderCurrent(); });
  })();

});

