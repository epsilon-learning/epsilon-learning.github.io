// SPA + renderer + quiz engine
// safe, defensive, and wrapped so it never crashes if data fails

window.addEventListener("DOMContentLoaded", () => {
  const version = "1.0.0";
  console.log("Epsilon SPA v" + version);

  const indicator = document.querySelector(".nav-indicator");
  const navItems = document.querySelectorAll(".nav-item");
  const pageRoot = document.getElementById("page-root");

  const ICON_MAP = {
    quiz: "fa-list-check",
    lesson: "fa-book-open",
    video: "fa-play",
    meeting: "fa-users"
  };

  let DATA = []; // loaded JSON

  function safeFetchData() {
    return fetch("data.json?v=" + Date.now())
      .then(r => r.json())
      .catch(err => {
        console.error("Failed to load data.json", err);
        return [];
      });
  }

  function moveIndicator(el) {
    if (!el || !indicator) return;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement.getBoundingClientRect();
    indicator.style.width = Math.round(rect.width) + "px";
    indicator.style.transform = `translateX(${Math.round(rect.left - parent.left)}px)`;
  }

  function ensureActive() {
    let active = document.querySelector(".nav-item.active");
    if (!active) {
      active = navItems[0];
      active.classList.add("active");
    }
    return active;
  }

  // render helpers
  function makeCard(item) {
    const topColor = item.moduleColor || "#333";
    const iconClass = ICON_MAP[item.mediaType] || "fa-file";
    const unitLabel = `${item.unit} • ${item.moduleName}`;
    return `
      <article class="module-card" role="article" data-id="${item.id}" data-media="${item.mediaType}">
        <div class="top" style="background:${topColor}">
          <div class="unit">${unitLabel}</div>
          <div class="media-icon" title="${item.mediaType}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
        </div>
        <div class="body">
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="desc">${escapeHtml(item.description || "")}</div>
          <div class="chips">${(item.tags||[]).map(t=>`<div class="chip">${escapeHtml(t)}</div>`).join("")}</div>
        </div>
      </article>
    `;
  }

  function escapeHtml(s){
    if(!s) return "";
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function renderGrid(items) {
    if (!items || items.length === 0) return `<div class="card">No items found.</div>`;
    return `<div class="grid">${items.map(it => makeCard(it)).join("")}</div>`;
  }

  // page templates
  function homeTemplate() {
    return `<div class="page-transition">
      <div class="card"><h1>Welcome to Epsilon</h1><p class="muted">Business learning — curated modules, quizzes and lessons.</p></div>
      <div class="card"><h3>Quick access</h3><p class="muted">Use the tabs above to browse For You, Lessons, Quizzes, Videos and Meetings.</p></div>
    </div>`;
  }

  function forYouTemplate(data) {
    const lessons = data.filter(i=> i.mediaType === "lesson");
    const quizzes = data.filter(i=> i.mediaType === "quiz");
    const pick = (arr, n)=> {
      const copy = arr.slice();
      const out=[];
      while(out.length < n && copy.length){
        const i = Math.floor(Math.random()*copy.length);
        out.push(copy.splice(i,1)[0]);
      }
      return out;
    };
    const selLessons = pick(lessons,3);
    const selQuizzes = pick(quizzes,3);
    return `<div class="page-transition">
      <div class="card"><h2>For You</h2><p class="muted">Random recommendations — 3 lessons and 3 quizzes.</p></div>
      <h3 style="margin-top:12px">Lessons</h3>
      ${renderGrid(selLessons)}
      <h3 style="margin-top:16px">Quizzes</h3>
      ${renderGrid(selQuizzes)}
    </div>`;
  }

  function listTemplate(data, type, heading) {
    const items = data.filter(i=> i.mediaType === type);
    return `<div class="page-transition">
      <div class="card"><h2>${heading}</h2><p class="muted">Tap a card to open.</p></div>
      ${renderGrid(items)}
    </div>`;
  }

  function videosTemplate(data) {
    const items = data.filter(i=> i.mediaType === "video");
    return `<div class="page-transition">
      <div class="card"><h2>Videos</h2></div>
      ${renderGrid(items)}
    </div>`;
  }

  function meetingsTemplate(data) {
    const items = data.filter(i=> i.mediaType === "meeting");
    return `<div class="page-transition">
      <div class="card"><h2>Meetings</h2></div>
      ${renderGrid(items)}
    </div>`;
  }

  // dynamic views: lesson viewer and quiz viewer
  function openLesson(item) {
    const html = `
      <div class="page-transition">
        <div class="card"><div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:var(--muted)">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div>
            <h2 style="margin:6px 0">${escapeHtml(item.title)}</h2>
          </div>
          <div style="width:56px"></div>
        </div></div>

        <div class="card">${item.contentHtml || "<p>No lesson content yet.</p>"}</div>
        <div class="card"><button class="btn-back">Back</button></div>
      </div>
    `;
    pageRoot.innerHTML = html;
    pageRoot.querySelector(".btn-back").addEventListener("click", () => loadPage("lessons"));
  }

  function openQuiz(item) {
    const questions = item.questions || [];
    let state = { answers: Array(questions.length).fill(null) };

    function renderQuiz() {
      return `
        <div class="page-transition quiz-view">
          <div class="card"><div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:13px;color:var(--muted)">${escapeHtml(item.unit)} • ${escapeHtml(item.moduleName)}</div>
              <h2 style="margin:6px 0">${escapeHtml(item.title)}</h2>
            </div>
            <div style="width:56px"></div>
          </div></div>

          <div id="questions">
            ${questions.map((q,qi)=>`
              <div class="question" data-q="${qi}">
                <div style="font-weight:700">Q${qi+1}. ${escapeHtml(q.q)}</div>
                <div class="options">
                  ${q.options.map((o,oi)=>`<div class="opt" data-qi="${qi}" data-oi="${oi}">${escapeHtml(o)}</div>`).join("")}
                </div>
              </div>
            `).join("")}
          </div>

          <div style="display:flex;gap:12px;align-items:center;margin-top:12px">
            <button id="submit-quiz">Submit</button>
            <button id="cancel-quiz" class="btn-light">Cancel</button>
          </div>
        </div>
      `;
    }

    pageRoot.innerHTML = renderQuiz();

    // option click
    pageRoot.querySelectorAll(".opt").forEach(el=>{
      el.addEventListener("click", (e)=>{
        const qi = Number(el.dataset.qi);
        const oi = Number(el.dataset.oi);
        state.answers[qi] = oi;
        // mark selected for that question
        pageRoot.querySelectorAll(`.question[data-q="${qi}"] .opt`).forEach(o=>{
          o.classList.remove("selected");
        });
        el.classList.add("selected");
      });
    });

    pageRoot.querySelector("#cancel-quiz").addEventListener("click", ()=> loadPage("quizzes"));

    pageRoot.querySelector("#submit-quiz").addEventListener("click", ()=>{
      const total = questions.length;
      let correct = 0;
      for(let i=0;i<total;i++){
        const q = questions[i];
        if(state.answers[i] === undefined || state.answers[i] === null) continue;
        if(state.answers[i] === q.answer) correct++;
      }
      const score = Math.round((correct/total)*100);
      pageRoot.innerHTML = `
        <div class="page-transition">
          <div class="result">
            <h2>Result</h2>
            <div style="font-size:28px;font-weight:700">${score}%</div>
            <div style="margin-top:8px">${correct} / ${total} correct</div>
            <div style="margin-top:12px"><button id="review-btn">Review answers</button> <button id="back-list" class="btn-light">Back</button></div>
          </div>
        </div>
      `;
      document.getElementById("back-list").addEventListener("click", ()=> loadPage("quizzes"));
      document.getElementById("review-btn").addEventListener("click", ()=> showReview(questions, state));
    });

    function showReview(questions, state){
      pageRoot.innerHTML = `
        <div class="page-transition">
          <div class="card"><h3>Review</h3></div>
          ${questions.map((q,qi)=>`
            <div class="question">
              <div style="font-weight:700">Q${qi+1}. ${escapeHtml(q.q)}</div>
              <div style="margin-top:8px"><strong>Your answer:</strong> ${ state.answers[qi] == null ? '<em>Not answered</em>' : escapeHtml(q.options[state.answers[qi]]) }</div>
              <div style="margin-top:4px"><strong>Correct:</strong> ${escapeHtml(q.options[q.answer])}</div>
            </div>
          `).join("")}
          <div style="margin-top:12px"><button id="back-to-quiz">Back</button></div>
        </div>
      `;
      document.getElementById("back-to-quiz").addEventListener("click", ()=> openQuiz(item));
    }
  }

  // top-level renderer
  function loadPage(name) {
    if (!DATA) { pageRoot.innerHTML = `<div class="card">Loading…</div>`; return; }
    const safe = (name||"home").toLowerCase();
    if (safe === "home") pageRoot.innerHTML = homeTemplate();
    else if (safe === "foryou") pageRoot.innerHTML = forYouTemplate(DATA);
    else if (safe === "lessons") pageRoot.innerHTML = listTemplate(DATA, "lesson", "Lessons");
    else if (safe === "quizzes") pageRoot.innerHTML = listTemplate(DATA, "quiz", "Quizzes");
    else if (safe === "videos") pageRoot.innerHTML = videosTemplate(DATA);
    else if (safe === "meetings") pageRoot.innerHTML = meetingsTemplate(DATA);
    else pageRoot.innerHTML = `<div class="card">Page not found</div>`;

    pageRoot.classList.add("page-transition");

    // attach card click handlers
    setTimeout(()=> { // allow DOM injection
      pageRoot.querySelectorAll(".module-card").forEach(card=>{
        card.addEventListener("click", ()=>{
          const id = card.dataset.id;
          const item = DATA.find(x=> x.id === id);
          if (!item) return;
          if (item.mediaType === "lesson") openLesson(item);
          else if (item.mediaType === "quiz") openQuiz(item);
          else {
            // default viewer
            pageRoot.innerHTML = `<div class="page-transition"><div class="card"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div><div class="card"><button class="btn-back">Back</button></div></div>`;
            pageRoot.querySelector(".btn-back").addEventListener("click", ()=> loadPage(item.mediaType === "video" ? "videos" : "meetings"));
          }
        });
      });
    }, 40);
  }

  // initial setup
  function initNav() {
    navItems.forEach(it=>{
      it.addEventListener("click", (e)=>{
        const target = e.currentTarget;
        document.querySelector(".nav-item.active")?.classList.remove("active");
        target.classList.add("active");
        moveIndicator(target);
        loadPage(target.dataset.page);
      });
    });

    // ensure indicator placed properly after fonts/layout
    requestAnimationFrame(()=>{
      const active = ensureActive();
      indicator.classList.add("no-animate");
      moveIndicator(active);
      requestAnimationFrame(()=> indicator.classList.remove("no-animate"));
    });
  }

  // bootstrap
  Promise.resolve()
    .then(()=> safeFetchData())
    .then(json=>{
      DATA = Array.isArray(json) ? json : [];
      initNav();
      const active = ensureActive();
      loadPage(active.dataset.page || "home");
    });

});

