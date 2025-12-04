// SPA, filters, data loader, progress & scheduler (localStorage)
// version 1.0.5
window.addEventListener("DOMContentLoaded", () => {
  const DATA_URL = "data.json?v=" + Date.now();
  const pageRoot = document.getElementById("page-root");
  const navItems = document.querySelectorAll(".nav-item");
  const moduleListEl = document.getElementById("module-list");
  const searchInput = document.getElementById("global-search");
  const filterTypeEls = document.querySelectorAll(".filter-type");
  let DATA = [];
  let MODULES = {}; // moduleId -> {moduleName, color}
  let state = {
    page: "epsilon",
    filters: { types: new Set(["lesson","quiz","video","meeting"]), modules: new Set(), q:"" }
  };

  // localStorage keys
  const LS_PROGRESS = "eps_progress_v1";
  const LS_SCHEDULE = "eps_schedule_v1";

  // util
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function fetchData(){
    return fetch(DATA_URL).then(r=>{
      if(!r.ok) throw new Error("data.json not found");
      return r.json();
    }).catch(err=>{
      console.warn("Failed to load data.json:", err);
      return [];
    });
  }

  // build module list from data
  function buildModules(data){
    MODULES = {};
    data.forEach(it=>{
      const m = it.module || "00";
      if(!MODULES[m]) MODULES[m] = { moduleName: it.moduleName || ("Module " + m), color: it.moduleColor || "#777" };
    });
    // sort by module id
    const keys = Object.keys(MODULES).sort();
    moduleListEl.innerHTML = keys.map(k=>{
      const m = MODULES[k];
      return `<li data-module="${k}" class="module-item"><span class="module-dot" style="background:${m.color}"></span>${k} ${m.moduleName}</li>`;
    }).join("");
    // attach click handlers
    $$(".module-item").forEach(li=>{
      li.addEventListener("click", ()=>{
        const id = li.dataset.module;
        // toggle in filters
        if(state.filters.modules.has(id)) state.filters.modules.delete(id);
        else state.filters.modules.add(id);
        // visual toggle
        li.classList.toggle("selected");
        renderCurrent();
      });
    });
  }

  // filtering
  function getActiveTypes(){
    const set = new Set();
    filterTypeEls.forEach(cb => { if(cb.checked) set.add(cb.value); });
    return set;
  }

  filterTypeEls.forEach(cb=>{
    cb.addEventListener("change", ()=> {
      state.filters.types = getActiveTypes();
      renderCurrent();
    });
  });

  searchInput.addEventListener("input", (e)=>{
    state.filters.q = (e.target.value||"").trim().toLowerCase();
    renderCurrent();
  });

  // localStorage helpers
  function loadProgress(){ try{ return JSON.parse(localStorage.getItem(LS_PROGRESS))||{} }catch{ return {}; } }
  function saveProgress(obj){ localStorage.setItem(LS_PROGRESS, JSON.stringify(obj)); }
  function loadSchedule(){ try{ return JSON.parse(localStorage.getItem(LS_SCHEDULE))||[] }catch{ return []; } }
  function saveSchedule(arr){ localStorage.setItem(LS_SCHEDULE, JSON.stringify(arr)); }
  function clearProgress(){ localStorage.removeItem(LS_PROGRESS); location.reload(); }
  function clearSchedule(){ localStorage.removeItem(LS_SCHEDULE); location.reload(); }

  $("#clear-progress").addEventListener("click", ()=> { if(confirm("Clear all progress?")) clearProgress(); });
  $("#clear-schedule").addEventListener("click", ()=> { if(confirm("Clear all schedule entries?")) clearSchedule(); });

  // helpers for rendering cards
  const ICON_MAP = { quiz: "fa-list-check", lesson: "fa-book-open", video: "fa-play", meeting: "fa-users" };
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
          <div class="desc">${escapeHtml(item.description || "")}</div>
          <div class="chips">${(item.tags||[]).map(t=>`<div class="chip">${escapeHtml(t)}</div>`).join("")}</div>
        </div>
      </article>
    `;
  }
  function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  // primary renderers
  function homeTemplate(){
    // carousel duplicates items to allow continuous scroll
    const sample = DATA.slice(0,8);
    const cards = sample.map(makeCard).join("");
    return `
      <div class="page-hero page-transition">
        <div class="hero-left card">
          <h1>Why Us</h1>
          <p class="muted">Epsilon helps FBLA students learn business fundamentals quickly with bite-sized lessons, quizzes and live study sessions.</p>
          <div style="margin-top:12px; display:flex; gap:8px;">
            <button class="btn-small" id="cta-dashboard">Open Dashboard</button>
            <button class="btn-light" id="cta-resources">Browse Resources</button>
          </div>
        </div>
        <div class="hero-right card">
          <h4>Featured</h4>
          <div id="hero-feature" style="height:180px; display:flex;align-items:center;justify-content:center;color:var(--muted)">Featured meetings & highlights</div>
        </div>
      </div>

      <div class="card"><h3>Featured Courses & Quizzes</h3>
        <div class="carousel" aria-hidden="false">
          <div class="carousel-track">
            ${cards}
            ${cards} <!-- duplicate for smooth scroll -->
          </div>
        </div>
      </div>
    `;
  }

  function dashboardTemplate(){
    const progress = loadProgress();
    const completedCount = Object.keys(progress).filter(k=>progress[k]===true).length;
    const schedule = loadSchedule();
    const streak = computeStreak();
    const badges = computeBadges(progress);
    return `
      <div class="page-transition dashboard-grid">
        <div>
          <div class="card">
            <h2>Dashboard</h2>
            <div style="display:flex;gap:12px;margin-top:12px" class="metrics">
              <div class="metric"><div style="font-size:20px;font-weight:700">${completedCount}</div><div class="muted">Completed</div></div>
              <div class="metric"><div style="font-size:20px;font-weight:700">${streak}</div><div class="muted">Streak (days)</div></div>
            </div>
          </div>

          <div class="card" style="margin-top:12px">
            <h3>Scheduled Lessons</h3>
            <div class="schedule-list">
              ${schedule.length ? schedule.map(s=>`<div class="card"><strong>${escapeHtml(s.title)}</strong><div class="muted">${s.date} ${s.time} EST • ${escapeHtml(s.teacher||'TBA')}</div></div>`).join("") : "<div class='muted'>No scheduled events</div>"}
            </div>
          </div>
        </div>

        <aside>
          <div class="card">
            <h3>Badges</h3>
            <div class="badges">
              ${badges.map(b=>`<div class="badge">${escapeHtml(b)}</div>`).join("")}
            </div>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Quick Actions</h3>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
              <button id="view-progress" class="btn-small">Export progress</button>
              <button id="reset-streak" class="btn-small btn-light">Reset streak</button>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  function resourcesTemplate(){
    return `<div class="page-transition">
      <div class="card"><h2>Resources</h2><p class="muted">Filter by type and module on the left. Click a card to open.</p></div>
      <div id="resources-grid" class="grid"></div>
    </div>`;
  }

  function schedulerTemplate(){
    return `<div class="page-transition">
      <div class="card"><h2>Scheduler</h2><p class="muted">Create a live lesson entry that users can schedule.</p></div>
      <div class="card">
        <label>Title<input id="sched-title" class="sidebar-search" /></label>
        <label>Date<input id="sched-date" type="date" class="sidebar-search" /></label>
        <label>Time<input id="sched-time" type="time" class="sidebar-search" /></label>
        <label>Teacher<input id="sched-teacher" class="sidebar-search" /></label>
        <div style="margin-top:8px"><button id="sched-create" class="btn-small">Create & Schedule</button></div>
      </div>
    </div>`;
  }

  function forYouTemplate(){
    // pick 3 random lessons and 3 random quizzes
    const lessons = DATA.filter(d=>d.mediaType==="lesson");
    const quizzes = DATA.filter(d=>d.mediaType==="quiz");
    const pick = (arr,n)=>{ const c=arr.slice(); const out=[]; while(out.length<n && c.length){ out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); } return out; };
    const l = pick(lessons,3), q = pick(quizzes,3);
    return `<div class="page-transition">
      <div class="card"><h2>For You</h2><p class="muted">Recommendations</p></div>
      <h3>Lessons</h3><div class="grid">${l.map(makeCard).join("")}</div>
      <h3 style="margin-top:12px">Quizzes</h3><div class="grid">${q.map(makeCard).join("")}</div>
    </div>`;
  }

  function renderPage(name){
    state.page = name;
    // update nav active
    navItems.forEach(n=> n.classList.toggle("active", n.dataset.page===name));
    if(name==="epsilon") pageRoot.innerHTML = homeTemplate();
    else if(name==="dashboard") pageRoot.innerHTML = dashboardTemplate();
    else if(name==="resources") pageRoot.innerHTML = resourcesTemplate();
    else if(name==="scheduler") pageRoot.innerHTML = schedulerTemplate();
    else if(name==="forYou") pageRoot.innerHTML = forYouTemplate();
    else pageRoot.innerHTML = `<div class="card">Page not found</div>`;

    // after injection hook
    afterRender(name);
  }

  function afterRender(name){
    // wire CTA buttons
    const ctaDash = document.getElementById("cta-dashboard");
    if(ctaDash) ctaDash.addEventListener("click", ()=> navigate("dashboard"));
    const ctaRes = document.getElementById("cta-resources");
    if(ctaRes) ctaRes.addEventListener("click", ()=> navigate("resources"));

    if(name==="resources") populateResources();
    if(name==="scheduler") {
      const createBtn = $("#sched-create");
      if(createBtn){
        createBtn.addEventListener("click", ()=>{
          const title = $("#sched-title").value.trim();
          const date = $("#sched-date").value;
          const time = $("#sched-time").value;
          const teacher = $("#sched-teacher").value.trim();
          if(!title||!date||!time) return alert("Please fill title, date and time");
          const arr = loadSchedule();
          arr.push({ id: "s" + Date.now(), title, date, time, teacher});
          saveSchedule(arr);
          alert("Scheduled!");
          renderPage("dashboard");
        });
      }
    }

    // attach card click handler generically
    setTimeout(()=> {
      $$(".module-card").forEach(c => {
        c.addEventListener("click", ()=> {
          const id = c.dataset.id;
          const item = DATA.find(d=>d.id===id);
          if(!item) return;
          if(item.mediaType==="lesson") openLesson(item);
          else if(item.mediaType==="quiz") openQuiz(item);
          else openGeneric(item);
        });
      });
    }, 40);
  }

  // render filtered resources into resources grid
  function populateResources(){
    const grid = $("#resources-grid");
    const types = state.filters.types || new Set(["lesson","quiz","video","meeting"]);
    const modulesFilter = state.filters.modules;
    const q = state.filters.q || "";
    const items = DATA.filter(it=>{
      if(!types.has(it.mediaType)) return false;
      if(modulesFilter.size && !modulesFilter.has(it.module)) return false;
      if(q){
        const inTitle = (it.title||"").toLowerCase().includes(q);
        const inTags = (it.tags||[]).some(t=>t.toLowerCase().includes(q));
        if(!inTitle && !inTags) return false;
      }
      return true;
    });
    grid.innerHTML = items.length ? items.map(makeCard).join("") : `<div class="card">No items found</div>`;
  }

  // open generic viewer for video/meeting
  function openGeneric(item){
    pageRoot.innerHTML = `
      <div class="page-transition card">
        <button class="btn-back" id="back">Back</button>
        <div style="margin-top:10px">
          <div style="font-size:13px;color:var(--muted)">${item.unit} • ${item.moduleName}</div>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="muted">${escapeHtml(item.description || "")}</p>
        </div>
      </div>
    `;
    $("#back").addEventListener("click", ()=> renderPage("resources"));
  }

  // open lesson
  function openLesson(item){
    pageRoot.innerHTML = `
      <div class="page-transition">
        <div class="card">
          <button class="btn-back" id="back">Back</button>
          <div style="margin-top:8px"><div style="font-size:13px;color:var(--muted)">${item.unit} • ${item.moduleName}</div><h2>${escapeHtml(item.title)}</h2></div>
        </div>
        <div class="card">${item.contentHtml || "<p>No content yet.</p>"}</div>
        <div class="card"><button id="mark-done" class="btn-small">Mark Done</button></div>
      </div>
    `;
    $("#back").addEventListener("click", ()=> renderPage("resources"));
    $("#mark-done").addEventListener("click", ()=>{
      const prog = loadProgress(); prog[item.id] = true; saveProgress(prog); alert("Marked done"); renderPage("dashboard");
    });
  }

  // open quiz
  function openQuiz(item){
    const qs = item.questions||[];
    let stateQ = { answers: Array(qs.length).fill(null) };
    pageRoot.innerHTML = `
      <div class="page-transition quiz-view">
        <div class="card"><button class="btn-back" id="back">Back</button>
          <div style="margin-top:8px"><div style="font-size:13px;color:var(--muted)">${item.unit} • ${item.moduleName}</div><h2>${escapeHtml(item.title)}</h2></div>
        </div>
        <div id="questions-area">
          ${qs.map((q,qi)=>`
            <div class="question" data-q="${qi}">
              <div style="font-weight:700">Q${qi+1}. ${escapeHtml(q.q)}</div>
              <div class="options">
                ${q.options.map((opt,oi)=>`<div class="opt" data-qi="${qi}" data-oi="${oi}">${escapeHtml(opt)}</div>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;gap:10px"><button id="submit-quiz" class="btn-small">Submit</button><button id="cancel-quiz" class="btn-small btn-light">Cancel</button></div>
      </div>
    `;
    $("#back").addEventListener("click", ()=> renderPage("resources"));
    // option clicks
    $$(".opt").forEach(el=>{
      el.addEventListener("click", ()=>{
        const qi = +el.dataset.qi, oi = +el.dataset.oi;
        stateQ.answers[qi] = oi;
        $(`.question[data-q="${qi}"]`).querySelectorAll(".opt").forEach(o=>o.classList.remove("selected"));
        el.classList.add("selected");
      });
    });
    $("#cancel-quiz").addEventListener("click", ()=> renderPage("resources"));
    $("#submit-quiz").addEventListener("click", ()=>{
      let correct = 0;
      qs.forEach((q, i)=> { if(stateQ.answers[i] === q.answer) correct++; });
      const percent = Math.round((correct/qs.length)*100);
      // mark progress if >0
      if(percent>=0){ const prog = loadProgress(); prog[item.id] = true; saveProgress(prog); }
      pageRoot.innerHTML = `<div class="page-transition"><div class="card result"><h2>Result</h2><div style="font-size:28px;font-weight:700">${percent}%</div><div>${correct} / ${qs.length} correct</div><div style="margin-top:10px"><button id="back-main" class="btn-small">Back</button></div></div></div>`;
      $("#back-main").addEventListener("click", ()=> renderPage("resources"));
    });
  }

  // compute streak: simple days-in-row using localStorage 'eps_last_visit' and visits set
  function computeStreak(){
    try{
      const raw = localStorage.getItem("eps_visits_v1");
      const visits = raw ? JSON.parse(raw) : [];
      // visits are ISO date strings yyyy-mm-dd
      if(!visits.length) return 0;
      visits.sort();
      const today = (new Date()).toISOString().slice(0,10);
      if(!visits.includes(today)) visits.push(today);
      // compute consecutive days ending today
      let streak = 0;
      let d = new Date(); // now
      for(;;){
        const iso = d.toISOString().slice(0,10);
        if(visits.includes(iso)) { streak++; d.setDate(d.getDate()-1); } else break;
      }
      // store visits (ensure unique)
      const uniq = Array.from(new Set(visits));
      localStorage.setItem("eps_visits_v1", JSON.stringify(uniq));
      return streak;
    }catch(e){ return 0; }
  }

  function computeBadges(progress){
    const doneCount = Object.keys(progress).filter(k=>progress[k]).length;
    const badges = [];
    if(doneCount>=1) badges.push("First Step");
    if(doneCount>=3) badges.push("Learner");
    if(doneCount>=6) badges.push("Dedicated");
    return badges;
  }

  // generic load & init
  function init(){
    fetchData().then(json=>{
      DATA = Array.isArray(json) ? json : [];
      buildModules(DATA);
      // make modules default unchecked (select via clicking)
      // initial nav wiring
      navItems.forEach(n=> n.addEventListener("click", ()=> navigate(n.dataset.page)));
      // start on home (epsilon)
      navigate("epsilon");
    });
  }

  function navigate(page){
    renderPage(page);
    // update active nav
    navItems.forEach(n=> n.classList.toggle("active", n.dataset.page===page));
  }

  // ensure filters state consistent
  function renderCurrent(){
    if(state.page === "resources") populateResources();
    else if(state.page === "forYou") renderPage("forYou");
  }

  // init
  init();

});
