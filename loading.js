// Loading screen particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}
createParticles();

// Random SWAG loading messages
const swagMessages = [
    'ADDING A PINCH OF SWAG...',
    'LOADING SWAGGER...',
    'INITIALIZING COOLNESS...',
    'CALIBRATING STYLE LEVELS...',
    'DOWNLOADING SWAG...',
    'RENDERING FRESHNESS...',
    'BUFFERING ATTITUDE...',
    'INSTALLING CONFIDENCE...',
    'COMPILING COOLNESS...',
    'SYNCING SWAGGER...',
    'DEPLOYING STYLE...'
];

let lastMessagePercentage = 0;

// Update loading progress
function updateLoadingProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    const loaderText = document.getElementById('loadingText');
    
    if (progressBar  && loaderText) {
        progressBar.style.width = percentage + '%';
        
        // Change message every 10% progress
        const currentSegment = Math.floor(percentage / 10);
        const lastSegment = Math.floor(lastMessagePercentage / 10);
        
        if (currentSegment !== lastSegment || percentage === 0) {
            const messageIndex = Math.floor(Math.random() * swagMessages.length);
            loaderText.textContent = swagMessages[messageIndex];
            lastMessagePercentage = percentage;
        }
    }
}

function hideLoadingScreen() {
    const crtContainer = document.getElementById('crt-container');
    const container = document.getElementById('container');
    
    if (crtContainer) {
        crtContainer.classList.add('hidden');
    }
    if (container) {
        container.classList.add('loaded');
    }
}
