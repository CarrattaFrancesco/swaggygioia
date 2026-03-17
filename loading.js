// Update the loading bar progress (0–100)
function updateLoadingProgress(progress) {
    const fill = document.getElementById('loading-bar-fill');
    if (fill) {
        fill.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
}

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
    // Hide the loading bar
    const loadingBar = document.getElementById('loading-bar-container');
    if (loadingBar) {
        loadingBar.classList.add('hidden');
    }
}
