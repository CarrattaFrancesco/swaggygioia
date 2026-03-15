# Gioia — 3D Photobooth Viewer

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
| `app.js` | Main Three.js app (~1,100 lines): scene, textures, interaction, bloom, animation |
| `loading.js` | Loading screen logic: particles, progress bar, SWAG messages |
| `main.css` | App container styles |
| `loading-styles.css` | Retro CRT loading screen effects |
| `data/projects.json` | Portfolio project metadata (currently unused) |
| `PHOTOBOOTH_1/phb.glb` | Main 3D model |
| `PHOTOBOOTH_1/TXT/` | PBR texture maps (BaseColor, Normal, ORM) per component |
| `PHOTOBOOTH_1/compression.py` | Offline PNG compression utility (Pillow + pngquant) |

## Key Conventions

### JavaScript
- **No modules** — all scripts use global `<script>` tags with legacy `THREE.*` namespace (not ES imports)
- **Global texture config** — `window.texturePaths` maps mesh/material names to PBR texture paths and parameters
- **Name-based material matching** — meshes match texture configs via lowercased `String.includes()` fallthrough: exact mesh → exact material → object type key → "default"
- **Selective bloom** — dual-composer approach: `bloomComposer` renders only emissive objects, `finalComposer` blends on top

### Textures
- Folder names: ALL CAPS (`CAMERA/`, `WALL/`, `SPRAY/`)
- File pattern: `COMPONENT_shadingGroup_MapType.UDIM.png`
- ORM maps: packed Occlusion/Roughness/Metallic in one file

### Design
- Loading screen: dark purple background (`#0a0015`), Celeste (`#94ffe3`) + Viola (`#7702ef`) accents
- Scene: black (`0x000000`), ACES Filmic tone mapping, exposure 1.8
- 4 colored point lights: white, purple, blue, light-blue, gold/amber

## Known Issues / Gotchas

1. **`projects.json` is unused** — defined but never loaded in JS
2. **HDR environment map is disabled** — `loadEnvironmentMap()` is gated behind `if (false)`
3. **No orbit control limits** — `minDistance: 0`, `maxDistance: Infinity` (users can zoom through the model)
4. **Hover clones materials on every event** — `highlightObject()` allocates each time
5. **Cache-busting uses `document.write`** — breaks with CSP headers
6. **HTML typo** — `<source>` tag has double `>>`
7. **Texture matching can false-positive** — overlapping mesh names cause `includes()` mismatches

## Dependencies

All loaded via CDN (r128 / 0.128.0):
- three.js core, GLTFLoader, RGBELoader, OrbitControls
- EffectComposer, RenderPass, UnrealBloomPass, ShaderPass
- LuminosityHighPassShader, CopyShader

Python (offline tool only): Pillow, optional pngquant CLI
