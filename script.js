/* ===========================================
   GLOBAL NAV INDICATOR CONTROLLER
   =========================================== */
(function () {
    const items = document.querySelectorAll(".nav-item");
    const indicator = document.querySelector(".nav-indicator");

    function moveIndicator(el) {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement.getBoundingClientRect();

        indicator.style.width = Math.round(rect.width) + "px";
        indicator.style.transform =
            "translateX(" + Math.round(rect.left - parentRect.left) + "px)";
    }

    // Position instantly on load (no animation)
    window.addEventListener("load", () => {
        const active = document.querySelector(".nav-item.active");

        indicator.classList.add("no-animate");
        moveIndicator(active);

        // Allow animation again AFTER positioning
        requestAnimationFrame(() => {
            indicator.classList.remove("no-animate");
        });
    });

    // Animate indicator on click
    items.forEach((item) => {
        item.addEventListener("click", () => {
            document.querySelector(".nav-item.active")?.classList.remove("active");
            item.classList.add("active");

            moveIndicator(item);
        });
    });

    // Re-center indicator on window resize
    window.addEventListener("resize", () => {
        moveIndicator(document.querySelector(".nav-item.active"));
    });
})();

