/* ---------- NAV INDICATOR ---------- */

const indicator = document.querySelector(".nav-indicator");
const items = document.querySelectorAll(".nav-item");

function moveIndicator(el) {
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + "px";
    indicator.style.transform = `translateX(${rect.left - parent.left}px)`;
}

window.addEventListener("load", () => {
    const active = document.querySelector(".nav-item.active");
    indicator.classList.add("no-animate");
    moveIndicator(active);
    requestAnimationFrame(() => indicator.classList.remove("no-animate"));
});

items.forEach(item => {
    item.addEventListener("click", () => {
        document.querySelector(".nav-item.active")?.classList.remove("active");
        item.classList.add("active");
        moveIndicator(item);
        loadPage(item.dataset.page);
    });
});

window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-item.active");
    moveIndicator(active);
});


/* ---------- SPA ROUTER (Loads full page templates) ---------- */

const pageRoot = document.getElementById("page-root");

const PAGES = {
    home: `
        <div class="card"><h1>Welcome to Epsilon</h1><p>Your biology learning platform.</p></div>
    `,
    library: `
        <div class="card"><h2>Lessons</h2><p>Your 20-lesson biology course begins here.</p></div>
    `,
    quizzes: `
        <div class="card"><h2>Available Quizzes</h2><p>Test yourself on each module.</p></div>
    `,
    videos: `
        <h3>Module | 02.01</h3>
        <div class="video-box"></div>
        <br>
        <div class="card">
            <h3>Description</h3>
            <p>Short clip explaining key biology concepts.</p>
        </div>
    `,
    meetings: `
        <div class="card"><h2>Upcoming Study Sessions</h2><p>Group sessions & tutoring events.</p></div>
    `
};

function loadPage(name) {
    pageRoot.innerHTML = "";
    pageRoot.classList.remove("page-transition");

    requestAnimationFrame(() => {
        pageRoot.innerHTML = PAGES[name];
        pageRoot.classList.add("page-transition");
    });
}

// load initial page
loadPage("home");

