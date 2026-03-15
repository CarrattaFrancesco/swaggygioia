// No-op stub — called by app.js during model load, no longer needed
function updateLoadingProgress() {}

function hideLoadingScreen() {
    const crtContainer = document.getElementById('crt-container');
    const container = document.getElementById('container');
    const logo = document.getElementById('brand-logo');

    // Fade out the black overlay
    if (crtContainer) {
        crtContainer.classList.add('hidden');
    }
    // Show the 3D scene
    if (container) {
        container.classList.add('loaded');
    }
    // Slide logo to top-left corner
    if (logo) {
        logo.classList.add('corner');
    }
}
