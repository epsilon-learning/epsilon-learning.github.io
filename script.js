function changeVideo() {
    const box = document.querySelector('.video-box');

    // Animate out
    box.classList.add('animate-out');

    setTimeout(() => {
        // (OPTIONAL) Replace video content here
        // box.innerHTML = "New content";

        // Animate in
        box.classList.remove('animate-out');
        box.classList.add('animate-in');

        setTimeout(() => {
            box.classList.remove('animate-in');
        }, 400);

    }, 300);
}
