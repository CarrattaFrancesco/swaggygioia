# Gioia — 3D Photobooth Viewer

## Purpose & Concept

Gioia is a **personal portfolio website** disguised as an interactive 3D experience. Instead of a traditional flat page, the visitor explores a photobooth model in a dark, atmospheric scene. Portfolio projects are displayed as **posters attached to the photobooth** — clicking a poster opens a centered modal with a full image carousel and project details.

The name "Gioia" evokes joy and playfulness. The site is meant to feel like stumbling into a street-art photo booth at night: moody lighting, retro CRT loading screen, glowing accents in Celeste (`#94ffe3`) and Viola (`#7702ef`).

**Target audience:** potential clients, collaborators, recruiters — anyone browsing the portfolio.

**Core user flow:**
1. Retro CRT loading screen with progress bar and SWAG messages
2. Scene fades in — photobooth model with glowing posters
3. Onboarding tip appears: *"Click on the posters to explore the portfolio"*
4. User hovers a poster → tooltip + highlight; clicks → camera flies to poster → centered modal opens with image gallery + project info
5. User can navigate between projects via lateral arrows on screen edges (or ↑↓ keys), and between images via in-card arrows (or ←→ keys)
6. Close modal (×, backdrop click, ESC, double-click) → camera resets

## Overview

Interactive Three.js (r128) photobooth model viewer with a retro CRT loading screen. Pure static site — no build system, no bundler, no npm.

## Running the Project

```bash
# Any static HTTP server from project root
python -m http.server 8000
# or
npx serve .
```

No build step. No tests. No linting.

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Entry point — HTML structure + CDN script tags |
| `app.js` | Main Three.js app: scene, textures, interaction, bloom, animation, modals |
| `loading.js` | Loading screen logic: particles, progress bar, SWAG messages |
| `main.css` | App container + modal + tooltip + onboarding styles |
| `loading-styles.css` | Retro CRT loading screen effects |
| `data/projects.json` | Portfolio project metadata (name, description, category, year, images) |
| `data/IMG/{KEY}/` | Project images for the carousel (e.g. `data/IMG/LEFT_POSTER/img_1.png`) |
| `PHOTOBOOTH_1/phb.glb` | Main 3D model |
| `PHOTOBOOTH_1/TXT/` | PBR texture maps (BaseColor, Normal, ORM) per component |
| `PHOTOBOOTH_1/compression.py` | Offline PNG compression utility (Pillow + pngquant) |

## Key Conventions

### JavaScript
- **No modules** — all scripts use global `<script>` tags with legacy `THREE.*` namespace (not ES imports)
- **Global texture config** — `window.texturePaths` maps mesh/material names to PBR texture paths and parameters
- **Name-based material matching** — meshes match texture configs via lowercased `String.includes()` fallthrough: exact mesh → exact material → object type key → "default"
- **Selective bloom** — dual-composer approach: `bloomComposer` renders only emissive objects, `finalComposer` blends on top
- **Poster detection** — meshes whose name includes "poster" and exists as a key in `projects.json` are interactive portfolio items

### Portfolio / Modal System
- **Centered modal** — clicking a poster opens a full centered overlay with image carousel on top, project info below
- **HTML image carousel** — images shown via `<img>` element (not 3D texture swaps); navigated with in-card arrows or ←→ keys
- **Project navigation** — lateral arrows on viewport edges (or ↑↓ keys) fly the camera to the next poster and update the modal
- **Project counter** — "Project 1 / N" shown in the modal info area
- **Backdrop** — semi-transparent overlay behind the modal; click to dismiss

### Discoverability
- **Poster glow pulse** — idle posters oscillate emissive intensity in celeste (`#94ffe3`) to attract attention
- **Hover tooltip** — "Click to view project" pill follows cursor when hovering a poster
- **Onboarding tip** — appears ~1.5s after scene loads, auto-dismisses after 6s: *"Click on the posters to explore the portfolio"*

### Textures
- Folder names: ALL CAPS (`CAMERA/`, `WALL/`, `SPRAY/`)
- File pattern: `COMPONENT_shadingGroup_MapType.UDIM.png`
- ORM maps: packed Occlusion/Roughness/Metallic in one file

### Design
- Loading screen: dark purple background (`#0a0015`), Celeste (`#94ffe3`) + Viola (`#7702ef`) accents
- Scene: black (`0x000000`), ACES Filmic tone mapping, exposure 1.8
- 4 colored point lights: white, purple, blue, light-blue, gold/amber
- Modal: dark glass aesthetic (rgba background, backdrop-filter blur, subtle borders)

### Adding a New Project
1. Add a key to `data/projects.json` matching the poster mesh name in the 3D model (case-sensitive)
2. Create folder `data/IMG/{KEY}/` with project images
3. The poster mesh must contain "poster" in its name (case-insensitive) for detection

## Known Issues / Gotchas

1. **HDR environment map is disabled** — `loadEnvironmentMap()` is gated behind `if (false)`
2. **No orbit control limits** — `minDistance: 0`, `maxDistance: Infinity` (users can zoom through the model)
3. **Hover clones materials on every event** — `highlightObject()` allocates each time
4. **Cache-busting uses `document.write`** — breaks with CSP headers
5. **HTML typo** — `<source>` tag has double `>>`
6. **Texture matching can false-positive** — overlapping mesh names cause `includes()` mismatches

## Dependencies

All loaded via CDN (r128 / 0.128.0):
- three.js core, GLTFLoader, RGBELoader, OrbitControls
- EffectComposer, RenderPass, UnrealBloomPass, ShaderPass
- LuminosityHighPassShader, CopyShader

Python (offline tool only): Pillow, optional pngquant CLI
