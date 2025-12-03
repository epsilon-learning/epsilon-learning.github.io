// =========================================
// FINAL SMOOTH NAV INDICATOR CONTROLLER
// =========================================

// Wait until fonts + layout are fully ready
document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
        initNavIndicator();
    });
});

function initNavIndicator() {
    const items = document.querySelectorAll(".nav-item");
    const indicator = document.querySelector(".nav-indicator");

    if (!indicator || items.length === 0) return;

    // ---------------------------
    // Positioning function
    // ---------------------------
    function moveIndicator(el) {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const parent = el.parentElement.getBoundingClientRect();

        indicator.style.width = rect.width + "px";
        indicator.style.transform =
            `translateX(${rect.left - parent.left}px)`;
    }

    // ----------------------------------------------------
    // STEP 1 — Disable animation before first positioning
    // ----------------------------------------------------
    indicator.classList.add("no-animate");

    // Ensure DOM is ready
    window.addEventListener("DOMContentLoaded", () => {
        const active = document.querySelector(".nav-item.active");
        moveIndicator(active);

        // ------------------------------------------------
        // STEP 2 — Wait TWO frames, THEN enable animation
        // (prevents Home→X animation glitch on load)
        // ------------------------------------------------
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                indicator.classList.remove("no-animate");
            });
        });
    });

    // ---------------------------
    // Animate on click
    // ---------------------------
    items.forEach((item) => {
        item.addEventListener("click", () => {
            document.querySelector(".nav-item.active")?.classList.remove("active");
            item.classList.add("active");
            moveIndicator(item);
        });
    });

    // ---------------------------
    // Reposition on resize
    // ---------------------------
    window.addEventListener("resize", () => {
        moveIndicator(document.querySelector(".nav-item.active"));
    });
}

