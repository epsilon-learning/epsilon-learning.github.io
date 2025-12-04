/* -----------------------------------------
   NAV INDICATOR + PAGE ROUTER
------------------------------------------ */

// Move the indicator under the active tab
function moveIndicator(el) {
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement.getBoundingClientRect();

    const indicator = document.querySelector(".nav-indicator");
    indicator.style.width = rect.width + "px";
    indicator.style.transform =
        `translateX(${rect.left - parent.left}px)`;
}

// Initial load
window.addEventListener("load", () => {
    const indicator = document.querySelector(".nav-indicator");
    const active = document.querySelector(".nav-item.active");

    indicator.classList.add("no-animate");
    moveIndicator(active);

    requestAnimationFrame(() => {
        indicator.classList.remove("no-animate");
    });
});

// Click switching
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {

        // Update active class
        document.querySelector(".nav-item.active")
            ?.classList.remove("active");
        item.classList.add("active");

        // Move indicator
        moveIndicator(item);

        // Page switching
        const page = item.dataset.page;

        document.querySelector(".active-section")
            ?.classList.remove("active-section");

        document.querySelector(`#${page}`)
            .classList.add("active-section");
    });
});

// Adjust indicator when resizing
window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-item.active");
    moveIndicator(active);
});
