(function () {
    const items = document.querySelectorAll(".nav-item");
    const indicator = document.querySelector(".nav-indicator");

    function moveIndicator(el) {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const parent = el.parentElement.getBoundingClientRect();

        indicator.style.width = rect.width + "px";
        indicator.style.transform = `translateX(${rect.left - parent.left}px)`;
    }

    // Disable animation BEFORE first render
    indicator.classList.add("no-animate");

    window.addEventListener("DOMContentLoaded", () => {
        const active = document.querySelector(".nav-item.active");
        moveIndicator(active);

        // Force two frames to guarantee no animation on load
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                indicator.classList.remove("no-animate");
            });
        });
    });

    // Animate when clicking tabs (only after load)
    items.forEach((item) => {
        item.addEventListener("click", () => {
            document.querySelector(".nav-item.active")?.classList.remove("active");
            item.classList.add("active");

            moveIndicator(item);
        });
    });

    // Readjust indicator on resize
    window.addEventListener("resize", () => {
        moveIndicator(document.querySelector(".nav-item.active"));
    });
})();

