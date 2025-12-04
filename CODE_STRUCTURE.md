# Code Organization Summary

## Overview
Your codebase has been reorganized following clean code principles with separation of concerns. All inline CSS and JavaScript have been extracted into separate, well-organized files.

## File Structure

### HTML Files
- **index.html** - Main entry point
  - Clean HTML structure only
  - Links to external CSS and JavaScript files
  - Contains Three.js CDN imports
  - Includes loading screen markup and hidden video element

### CSS Files
- **main.css** - Application container styles
  - Body styling (black background, no margins/padding)
  - #container styles (grab cursor, fade-in transition)
  - Loaded state (#container.loaded)

- **loading-styles.css** - CRT loading screen styles
  - All retro 90s CRT effects (scanlines, flicker, chromatic aberration)
  - Progress bar with 7-segment display design
  - Responsive typography using clamp()
  - Particle animation styles
  - Color scheme: Celeste (#94ffe3) and Viola (#7702ef)

### JavaScript Files
- **loading.js** - Loading screen functionality
  - createParticles() - Generates floating particles
  - updateLoadingProgress() - Updates progress bar and messages
  - hideLoadingScreen() - Fades out loading screen
  - swagMessages array - 11 random SWAG-themed messages

- **app.js** - Main Three.js application
  - Scene setup and initialization
  - Camera, renderer, and controls configuration
  - Lighting system (ambient + 4 colored point lights)
  - Model loading with progress tracking
  - Texture preloading and caching system
  - Material and texture application
  - Bloom post-processing effects
  - Mouse interaction (hover, click, double-click)
  - Camera animation and focus
  - Video texture support
  - Window resize handling
  - Animation loop

## Load Order
1. main.css - Base application styles
2. loading-styles.css - Loading screen visual effects
3. Three.js CDN libraries (core, loaders, controls, post-processing)
4. loading.js - Loading screen initialization
5. app.js - Three.js scene initialization and animation

## Key Features

### Loading Screen
- Instant appearance (inline HTML, no iframe delay)
- 90s retro CRT aesthetic with screen effects
- Progress tracking (0-100%)
- Dynamic SWAG messages changing every 10%
- Fully responsive design

### 3D Viewer
- Interactive photobooth model viewer
- Click objects to focus camera
- Double-click to reset camera
- Hover effects on meshable objects
- Selective bloom effects for emissive materials
- Video texture support for animated materials
- Parallel texture preloading for faster load times

## Benefits of This Organization
1. **Maintainability** - Easy to find and edit specific functionality
2. **Readability** - Clean, well-commented code
3. **Performance** - Optimized load order, no code duplication
4. **Scalability** - Easy to add new features or styles
5. **Debugging** - Isolated concerns make troubleshooting simpler
6. **Caching** - External files can be cached by browsers

## File Sizes
- index.html: ~50 lines (clean HTML structure)
- main.css: ~24 lines (application styles)
- loading-styles.css: ~250 lines (CRT effects and animations)
- loading.js: ~64 lines (loading screen logic)
- app.js: ~1,100 lines (Three.js application)

Total: ~1,500 lines of organized, maintainable code
