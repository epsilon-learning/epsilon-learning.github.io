// =========================================
// UNIVERSAL, STABLE NAV INDICATOR SCRIPT
// (Works even if fonts load late)
// =========================================

initNavIndicator(); // Run immediately

// If fonts load later, correct the position
document.fonts.ready.then(() => {
    initNavIndicator(true);
});

function initNavIndicator(fromFonts = false) {
    const items = document.querySelectorAll(".nav-item");
    const indicator = document.querySelector(".nav-indicator");
    if (!indicator || items.length === 0) return;

    function moveIndicator(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement.getBoundingClientRect();
        indicator.style.width = rect.width + "px";
        indicator.style.transform =
            `translateX(${rect.left - parent.left}px)`;
    }

    // Disable animation ONLY on the first initialization
    if (!fromFonts) {
        indicator.classList.add("no-animate");
    }

    window.requestAnimationFrame(() => {
        const active = document.querySelector(".nav-item.active");
        moveIndicator(active);

        // Re-enable animation AFTER first layout stabilizes
        if (!fromFonts) {
            requestAnimationFrame(() => {
                indicator.classList.remove("no-animate");
            });
        }
    });

    // Animate on click
    items.forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".nav-item.active")?.classList.remove("active");
            item.classList.add("active");
            moveIndicator(item);
        });
    });

    // On resize
    window.addEventListener("resize", () => {
        moveIndicator(document.querySelector(".nav-item.active"));
    });
}
