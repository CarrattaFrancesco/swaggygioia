// Scene setup
let scene, camera, renderer, controls;
let photoboothModel;
let bloomComposer, finalComposer;

// Mouse interaction variables
let raycaster, mouse;

// Object management variables
let bloomObjects = [];

// Bloom control parameters
let bloomStrength = 2.5;
let bloomRadius = 1.0;
let bloomThreshold = 0.2;

// Camera animation variables
let isAnimatingCamera = false;
let animationId = null;
let focusedObject = null;
let originalCameraPosition = new THREE.Vector3();
let originalCameraTarget = new THREE.Vector3();

// Video textures storage
let videoTextures = [];

// Project data (loaded from projects.json)
window.projectsData = {};

// Carousel state
let currentCarouselIndex = 0;
let currentPaperKey = null;
let currentPaperMesh = null;

// Poster glow pulse state
let posterMeshes = [];
let glowClock = new THREE.Clock();

// Contact card mesh
let contactMesh = null;

// Cached list of intersectable meshes (rebuilt after model load, not every frame)
let cachedIntersectableMeshes = [];

// Throttle utility
function throttle(fn, wait) {
    let last = 0;
    return function() {
        var now = Date.now();
        if (now - last >= wait) {
            last = now;
            fn.apply(this, arguments);
        }
    };
}

// Debounce utility
function debounce(fn, wait) {
    let timer;
    return function() {
        var ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() { fn.apply(ctx, args); }, wait);
    };
}

// WebP support flag (cached)
let _supportsWebP = null;
function supportsWebP() {
    if (_supportsWebP !== null) return _supportsWebP;
    try {
        var c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        _supportsWebP = c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { _supportsWebP = false; }
    return _supportsWebP;
}
function toWebP(src) {
    if (!supportsWebP()) return src;
    return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

// Project keys list for navigation
let projectKeys = [];

// Texture paths mapping (make it global for preloading)
window.texturePaths = {
    "stop": {
        "stop1": {
            baseColor: 'PHOTOBOOTH_1/TXT/STOP/STOP_standardSurface50SG_BaseColor.1001.png',
            roughness: 0.8,
            metalness: 0.1,
        },
        "stop1003": {
            baseColor: 'PHOTOBOOTH_1/TXT/STOP/STOP_standardSurface7SG_BaseColor.1001.png',
            roughness: 0.8,
            metalness: 0.1
        },
        "stop1004": {
            baseColor: '#2C2B2B',
            roughness: 0.8,
            metalness: 0.1
        }
    },
    "cone":{
        "cameracone":{
            baseColor:"PHOTOBOOTH_1/TXT/CONE/CONE_camera_standardSurface5SG_BaseColor.1001.png",
            orm: "PHOTOBOOTH_1/TXT/CONE/CONE_camera_standardSurface5SG_OcclusionRoughnessMetallic.1001.png",
            roughness: 0.8,
            metalness: 0.1
        },
        "cameracone001":{
            baseColor:"PHOTOBOOTH_1/TXT/CONE/CONE_camera_standardSurface6SG_BaseColor.1001.png",
            orm: "PHOTOBOOTH_1/TXT/CONE/CONE_camera_standardSurface6SG_OcclusionRoughnessMetallic.1001.png",
            roughness: 0.8,
            metalness: 0.1
        }
    },
    "cameratrash":{
        "cameratrash":{
            baseColor:"PHOTOBOOTH_1/TXT/CESTINO/CESTINO_BaseColor_0.png",
            metalness: 0.8,
            roughness: 0.3
        }
    },
    "cameracamera":{
        "cameracamera":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_Camera_rough_0.png",
            normalMap:"PHOTOBOOTH_1/TXT/CAMERA/camera_Camera_normal.png",
            roughness: 0,
            metalness: 1
        },
        "cameracamera001":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_001.png",
            roughness: 1,
            metalness: 0
        },
        "cameracamera002":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_002.png",
            roughness: 1,
            metalness: 0
        },
        "cameracamera003":{
            roughness: 0,
            metalness: 1
        },
        "cameracamera004":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_004_rough_a_0.png",
            roughness: 0,
            metalness: 1
        },
        "cameracamera005":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_005_rough_a_0.png",
            roughness: 0,
            metalness: 1
        },
        "cameracamera006":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_006.png",
            roughness: 1,
            metalness: 0
        },
         "cameracamera007":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_007_schermo.png",
            roughness: 1,
            metalness: 0,
            emissionColor: "#00ff88"
        },
        "cameracamera008":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/camera_008.png",
            roughness: 1,
            metalness: 0
        },
         "cameracamera009":{
            baseColor:"PHOTOBOOTH_1/TXT/CAMERA/CAMERA_BaseColor.png",
            roughness: 0.5,
            metalness: 0.8,
            emissionColor: "#0088ff"
        },
    },
    "chair001":{
        "chair001":{
            baseColor:"PHOTOBOOTH_1/TXT/CHAIR/CHAIR_standardSurface10SG_BaseColor.1001.png",
            roughness: 0.7,
            metalness: 0
        }
    },
    "wallpcube19":{
        "wallpcube19":{
            baseColor:"PHOTOBOOTH_1/TXT/WALL/WALL_initialShadingGroup_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/WALL/WALL_initialShadingGroup_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/WALL/WALL_initialShadingGroup_OcclusionRoughnessMetallic.1001.png",
            metalness: 0.0
        }
    },
    "pcube16":{
        "pcube16":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_DOWN_standardSurface39SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_DOWN_standardSurface39SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_DOWN_standardSurface39SG_Roughness.1001.png",
            metalness: 0.0
        }
    },
    "pcube7":{
        "pcube7":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_UP_standardSurface38SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_UP_standardSurface38SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/FLOOR_UP_standardSurface38SG_Roughness.1001.png",
            metalness: 0.0
        }
    },
    "pcube19":{
        "pcube19":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/PHOTOBOOTH_standardSurface51SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/PHOTOBOOTH_standardSurface51SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/PHOTOBOOTH_standardSurface51SG_OcclusionRoughnessMetallic.1001.png",
            metalness: 0.0
        }
    },
    "pcube2":{
        "pcube2":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/ROOF_standardSurface42SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/ROOF_standardSurface42SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/ROOF_standardSurface42SG_Roughness.1001.png",
            metalness: 0.0
        }
    },
    "pcube5":{
        "pcube5":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/AIR_DUCT_standardSurface43SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/AIR_DUCT_standardSurface43SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/AIR_DUCT_standardSurface43SG_OcclusionRoughnessMetallic.1001.png",
            metalness: 0.0
        }
    },
    "sweep2":{
        "sweep2":{
            baseColor:"PHOTOBOOTH_1/TXT/SWEEP/sweep.png",
        }
    },
    "pcube4":{
        "pcube4":{
            videoTexture: true,
            videoElementId: "pcube4Video",
            roughness: 0.3,
            metalness: 0,
            emissionColor: "#2F2BA9",
            emissiveIntensity: 0.1
        },
        "pcube4001":{
            baseColor:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/SCREEN_OUT_standardSurface45SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/PHOTOBOOTH/SCREEN_OUT_standardSurface45SG_Normal.1001.png",
            metalness: 0.1
        }
    }, 
    "pcube6":{
        "pcube6":{
            baseColor: "#ffffff",
            roughness: 0,
            metalness: 0,
            emissionColor: "#ffffff"
        },
        "pcube6001":{
            baseColor: "#000000",
            roughness: 0.1,
            metalness: 0.1,
            emissionColor: null
        }
    },
    "floor_sign":{
        "floor_sign":{
            baseColor:"PHOTOBOOTH_1/TXT/FLOOR/FLOOR_SIGN_camera_standardSurface3SG_BaseColor.1001.png",
            normalMap:"PHOTOBOOTH_1/TXT/FLOOR/FLOOR_SIGN_camera_standardSurface3SG_Normal.1001.png",
            orm:"PHOTOBOOTH_1/TXT/FLOOR/FLOOR_SIGN_camera_standardSurface3SG_OcclusionRoughnessMetallic.1001.png",
            metalness: 0.8,
            roughness: 0.3
        }
    },
    "sprayspray":{
        "sprayspray2":{
            baseColor:"PHOTOBOOTH_1/TXT/SPRAY/SPRAY_2.png",
            metalness: 0.8,
            roughness: 0.3
        },
        "sprayspray2001":{
            baseColor:"PHOTOBOOTH_1/TXT/SPRAY/SPRAY2_001.png",
            metalness: 0.8,
            roughness: 0.3
        },
        "sprayspray2002":{
            baseColor:"#ffffff",
            metalness: 0.8,
            roughness: 0.3
        },
        "sprayspray2003":{
            baseColor:"PHOTOBOOTH_1/TXT/SPRAY/SORAY2_003.png",
            metalness: 0.8,
            roughness: 0.3
        },
    },
    "curtain":{
        "curtain_back":{
            baseColor:"PHOTOBOOTH_1/TXT/CURTAIN/CURTAIN_standardSurface13SG_BaseColor.1001.png",
            roughness: 0.7,
            metalness: 0
        },
        "curtain_front":{
            baseColor:"PHOTOBOOTH_1/TXT/CURTAIN/CURTAIN_standardSurface13SG_BaseColor.1001.png",
            roughness: 0.7,
            metalness: 0
        }
    },
    "pcube18":{
        "pcube18":{
            baseColor:"PHOTOBOOTH_1/TXT/SCREEN/PHOTOBOOTH_standardSurface49SG_BaseColor.1001.png",
            metalness: 0.0
        },
        "pcube18001":{
            baseColor:"#ffffff",
            metalness: 0.0
        }
    },
    "pcube3": {
        "pcube3": {
            baseColor: "#ffffff",
            roughness: 0.1,
            metalness: 0.9
        }
    },
    "pcylinder":{
        "buttonpcylinder19":{
            baseColor: "#0a4d02",
            roughness: 0,
            metalness: 0,

        },
        "default":{
            baseColor: "#ffffff",
            roughness: 0.1,
            metalness: 0.9
        }
    },
    "card":{
        "card":{
            videoTexture: true,
            videoElementId: 'cardVideo',
            roughness: 0.8,
            metalness: 0.0,
            emissiveIntensity: 0
        }
    }
};

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 3);
    camera.layers.enableAll();

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    
    document.getElementById('container').appendChild(renderer.domElement);

    // Initialize raycaster and mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.target.set(0, 0.5, 0);

    // Add mouse event listeners
    renderer.domElement.addEventListener('mousemove', throttle(onMouseMove, 60), false);
    renderer.domElement.addEventListener('click', onMouseClick, false);
    renderer.domElement.addEventListener('dblclick', onMouseDoubleClick, false);
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);

    // Add lights
    setupLighting();

    // Load project data first, then model (so poster detection works during traverse)
    loadProjectsData(function() {
        loadPhotoboothModel();
    });

    // Handle window resize (debounced to avoid excessive framebuffer reallocation)
    window.addEventListener('resize', debounce(onWindowResize, 250), false);

    // Escape key to close card and reset
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideProjectCard();
            hideContactCard();
            if (focusedObject) resetCamera();
        }
        if (currentPaperKey && document.getElementById('project-card').classList.contains('visible')) {
            if (e.key === 'ArrowRight') navigateCarousel(1);
            if (e.key === 'ArrowLeft') navigateCarousel(-1);
            if (e.key === 'ArrowUp') { e.preventDefault(); navigateProject(-1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); navigateProject(1); }
        }
    });

    // Card close button
    document.getElementById('card-close').addEventListener('click', function(e) {
        e.stopPropagation();
        hideProjectCard();
        if (focusedObject) resetCamera();
    });

    // Contact card close button
    document.getElementById('contact-close').addEventListener('click', function(e) {
        e.stopPropagation();
        hideContactCard();
        if (focusedObject) resetCamera();
    });

    // Contact button (bottom-right UI)
    document.getElementById('contact-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        flyToCardAndShowContact();
    });

    // Carousel buttons (inside card)
    document.getElementById('carousel-prev').addEventListener('click', function(e) {
        e.stopPropagation();
        navigateCarousel(-1);
    });
    document.getElementById('carousel-next').addEventListener('click', function(e) {
        e.stopPropagation();
        navigateCarousel(1);
    });

    // Backdrop click to close
    document.getElementById('card-backdrop').addEventListener('click', function(e) {
        hideProjectCard();
        hideContactCard();
        if (focusedObject) resetCamera();
    });

    // Project navigation arrows (viewport edges)
    document.getElementById('project-prev').addEventListener('click', function(e) {
        e.stopPropagation();
        navigateProject(-1);
    });
    document.getElementById('project-next').addEventListener('click', function(e) {
        e.stopPropagation();
        navigateProject(1);
    });

    // Onboarding dismiss button
    document.getElementById('onboarding-dismiss').addEventListener('click', function(e) {
        e.stopPropagation();
        dismissOnboarding();
    });
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    ambientLight.layers.enableAll();
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 3.0, 10);
    pointLight.position.set(0, 0.1, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 512;
    pointLight.shadow.mapSize.height = 512;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 5;
    pointLight.layers.enableAll();
    scene.add(pointLight);

    const pointLight_purple_1 = new THREE.PointLight(0x6a4c93, 1.0, 10);
    pointLight_purple_1.position.set(-0.4, 0.4, 0.4);
    pointLight_purple_1.layers.enableAll();
    scene.add(pointLight_purple_1);

    const pointLight_blue = new THREE.PointLight(0x4a90e2, 1.0, 10);
    pointLight_blue.position.set(0.4, 0.4, 0.4);
    pointLight_blue.layers.enableAll();
    scene.add(pointLight_blue);

    const pointLight_lightBlue = new THREE.PointLight(0x7fb3d3, 1.0, 10);
    pointLight_lightBlue.position.set(0.4, 0.4, -0.4);
    pointLight_lightBlue.layers.enableAll();
    scene.add(pointLight_lightBlue);

    const pointLight_violet = new THREE.PointLight(0xffd54f, 0.5, 10);
    pointLight_violet.position.set(-0.4, 0.4, -0.4);
    pointLight_violet.layers.enableAll();
    scene.add(pointLight_violet);
}

function loadEnvironmentMap() {
    const loader = new THREE.RGBELoader();
    
    if (false) {
        loader.load('data/models/shanghai_bund_4k.hdr', 
            function(texture) {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;
                console.log('HDR environment map loaded successfully');
            },
            function(progress) {
                console.log('Loading HDR environment:', (progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.warn('HDR environment map not found, using fallback lighting');
                createFallbackEnvironment();
            }
        );
    }
}

function createFallbackEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const renderTarget = pmremGenerator.fromScene(createEnvironmentScene());
    scene.environment = renderTarget.texture;
    pmremGenerator.dispose();
    console.log('Fallback environment created');
}

function createEnvironmentScene() {
    const envScene = new THREE.Scene();
    const geometry = new THREE.SphereGeometry(100, 32, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const sphere = new THREE.Mesh(geometry, material);
    envScene.add(sphere);
    return envScene;
}

function setupPostProcessing() {
    try {
        console.log('Setting up selective bloom for objects:', bloomObjects.length);

        // Bloom renders at half resolution for performance (bloom is naturally blurry)
        var bloomW = Math.round(window.innerWidth * 0.5);
        var bloomH = Math.round(window.innerHeight * 0.5);
        const bloomRenderTarget = new THREE.WebGLRenderTarget(bloomW, bloomH);
        const normalRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

        bloomComposer = new THREE.EffectComposer(renderer, bloomRenderTarget);
        bloomComposer.renderToScreen = false;
        
        const bloomRenderPass = new THREE.RenderPass(scene, camera);
        bloomRenderPass.clear = true;
        
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(bloomW, bloomH),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        );
        
        window.currentBloomPass = bloomPass;
        
        bloomComposer.addPass(bloomRenderPass);
        bloomComposer.addPass(bloomPass);

        finalComposer = new THREE.EffectComposer(renderer);
        
        const normalRenderPass = new THREE.RenderPass(scene, camera);
        normalRenderPass.clear = true;
        
        const finalPass = new THREE.ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: null }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D baseTexture;
                    uniform sampler2D bloomTexture;
                    varying vec2 vUv;
                    
                    void main() {
                        vec4 baseColor = texture2D(baseTexture, vUv);
                        vec4 bloomColor = texture2D(bloomTexture, vUv);
                        
                        gl_FragColor = baseColor + bloomColor * 0.8;
                    }
                `
            }), "baseTexture"
        );
        
        finalComposer.addPass(normalRenderPass);
        finalComposer.addPass(finalPass);
        
        finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget2.texture;
        
        console.log('✓ Selective bloom setup complete');
    } catch (error) {
        console.error('Error setting up post-processing:', error);
    }
}

// Loading manager to track all assets
const loadingManager = new THREE.LoadingManager();
let texturesLoaded = 0;
let totalTextures = 0;
let modelLoadProgress = 0;

loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    updateLoadingProgress(progress);
};

// Preload all textures in parallel
function preloadTextures() {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader(loadingManager);
        const texturePromises = [];
        const loadedTexturesCache = new Map();
        
        // Collect all unique texture paths
        const texturePaths = new Set();
        
        for (const objectType in window.texturePaths) {
            const objectConfig = window.texturePaths[objectType];
            for (const variant in objectConfig) {
                const config = objectConfig[variant];
                if (config.baseColor && !config.baseColor.startsWith('#')) {
                    texturePaths.add(config.baseColor);
                }
                if (config.normalMap) texturePaths.add(config.normalMap);
                if (config.orm) texturePaths.add(config.orm);
                if (config.roughnessMap) texturePaths.add(config.roughnessMap);
                if (config.metalnessMap) texturePaths.add(config.metalnessMap);
            }
        }
        
        totalTextures = texturePaths.size;
        console.log(`Preloading ${totalTextures} textures in parallel...`);
        
        if (totalTextures === 0) {
            resolve(loadedTexturesCache);
            return;
        }
        
        // Load all textures in parallel
        texturePaths.forEach(path => {
            const promise = new Promise((resolveTexture) => {
                textureLoader.load(
                    path,
                    function(texture) {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.encoding = THREE.sRGBEncoding;
                        texture.flipY = false;
                        
                        loadedTexturesCache.set(path, texture);
                        texturesLoaded++;
                        
                        const textureProgress = (texturesLoaded / totalTextures) * 30; // 0-30% for textures
                        updateLoadingProgress(textureProgress);
                        
                        resolveTexture(texture);
                    },
                    undefined,
                    function(error) {
                        console.warn(`Failed to load texture: ${path}`, error);
                        texturesLoaded++;
                        resolveTexture(null);
                    }
                );
            });
            texturePromises.push(promise);
        });
        
        // Wait for all textures to load
        Promise.all(texturePromises).then(() => {
            console.log(`✓ All ${totalTextures} textures preloaded`);
            resolve(loadedTexturesCache);
        });
    });
}

function loadPhotoboothModel() {
    updateLoadingProgress(0);
    
    // First, preload all textures in parallel
    preloadTextures().then((textureCache) => {
        updateLoadingProgress(35);
        
        // Store texture cache globally for applyTextures function
        window.preloadedTextures = textureCache;
        
        // Now load the model
        const loader = new THREE.GLTFLoader();
        
        loader.load('PHOTOBOOTH_1/phb.glb', 
            function(gltf) {
                updateLoadingProgress(65);
                
                photoboothModel = gltf.scene;
                
                updateLoadingProgress(70);
                applyTextures(photoboothModel);
                
                updateLoadingProgress(80);
                photoboothModel.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                photoboothModel.scale.setScalar(2);
                photoboothModel.position.set(0, 0, 0);
                
                scene.add(photoboothModel);
                
                updateLoadingProgress(90, 'Positioning camera...');
                const box = new THREE.Box3().setFromObject(photoboothModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                controls.target.copy(center);
                controls.update();
                
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.5;
                
                camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.5, center.z + cameraZ);
                camera.lookAt(center);
                
                originalCameraPosition.copy(camera.position);
                originalCameraTarget.copy(center);
                
                loadEnvironmentMap();
                
                updateLoadingProgress(95);
                setupPostProcessing();
                
                updateLoadingProgress(100);
                
                setTimeout(() => {
                    hideLoadingScreen();
                    // Show onboarding tip after scene is visible
                    setTimeout(function() {
                        var tip = document.getElementById('onboarding-tip');
                        if (tip) tip.classList.add('visible');
                        // Auto-dismiss after 6 seconds
                        setTimeout(function() { dismissOnboarding(); }, 6000);
                    }, 1500);
                }, 300);
                
                console.log('Photobooth model loaded:', photoboothModel);
                
                // Collect poster meshes for glow pulse
                photoboothModel.traverse(function(child) {
                    if (child.isMesh && getPaperProjectKey(child.name)) {
                        posterMeshes.push(child);
                        // Store base emissive for pulse
                        child.userData._posterBaseEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0);
                        child.userData._posterBaseIntensity = child.material.emissiveIntensity || 0;
                    }
                    // Collect contact card mesh
                    if (child.isMesh && child.name.toLowerCase().includes('card') && !contactMesh) {
                        contactMesh = child;
                        child.userData._posterBaseEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0);
                        child.userData._posterBaseIntensity = child.material.emissiveIntensity || 0;
                    }
                });

                // Cache intersectable meshes for raycasting (avoids traverse on every hover/click)
                cachedIntersectableMeshes = [];
                photoboothModel.traverse(function(child) {
                    if (child.isMesh && child.visible) {
                        cachedIntersectableMeshes.push(child);
                    }
                });
            },
            function(progress) {
                const modelProgress = 35 + (progress.loaded / progress.total * 30); // 35-65% for model
                updateLoadingProgress(modelProgress);
            },
            function(error) {
                console.error('Error loading model:', error);
                alert('Error loading model. Please refresh the page.');
            }
        );
    });
}

function applyTextures(model) {
    // Use preloaded textures from cache
    const loadedTextures = window.preloadedTextures || new Map();
    
    function loadTexture(path) {
        // Return from cache if available (already preloaded)
        if (loadedTextures.has(path)) {
            return loadedTextures.get(path);
        }
        
        // Fallback: load synchronously if not in cache (shouldn't happen)
        console.warn('Texture not preloaded, loading on demand:', path);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(path);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        loadedTextures.set(path, texture);
        return texture;
    }

    const posterMeshes = [];
    model.traverse(function(child) {
        if (child.isMesh && child.material) {
            const meshName = child.name.toLowerCase();
            const materialName = child.material.name.toLowerCase();
            
            if (meshName.includes('poster')) {
                posterMeshes.push(child.name);
            }
            
            console.log('Processing mesh:', child.name, 'Material:', child.material.name);
            
            const appliedTexture = applyDynamicTextures(child, meshName, materialName, loadTexture);
            
            if (!appliedTexture) {
                // Check if this is a registered poster — apply img_1 texture
                var posterProjectKey = getPaperProjectKey(child.name);
                if (posterProjectKey) {
                    var project = window.projectsData[posterProjectKey];
                    if (project && project.images && project.images.length > 0) {
                        var imgFolder = project.folder_name || posterProjectKey;
                        var imgPath = 'data/IMG/' + imgFolder + '/' + project.images[0];
                        var posterMat = new THREE.MeshStandardMaterial({
                            roughness: 0.9,
                            metalness: 0.0
                        });
                        child.material = posterMat;
                        // Load texture async so we can fit it after the image is available
                        (function(meshRef, matRef, projRef) {
                            var texLoader = new THREE.TextureLoader();
                            texLoader.load(imgPath, function(tex) {
                                tex.encoding = THREE.sRGBEncoding;
                                tex.flipY = false;
                                fitTextureToMesh(tex, meshRef, projRef.rotation || 0);
                                matRef.map = tex;
                                matRef.needsUpdate = true;
                            });
                        })(child, posterMat, project);
                        console.log('Applied poster texture to', child.name, '→', posterProjectKey);
                    } else {
                        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 });
                    }
                } else if (child.material.isMeshStandardMaterial) {
                    child.material.color.setHex(0xffffff);
                    child.material.roughness = 0.3;
                    child.material.metalness = 0.6;
                    child.material.map = null;
                    child.material.needsUpdate = true;
                } else {
                    const newMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.3,
                        metalness: 0.6
                    });
                    child.material = newMaterial;
                }
            }
        }
    });
    if (posterMeshes.length > 0) {
        console.log('%c📋 Poster meshes found (' + posterMeshes.length + '):', 'color: #94ffe3; font-weight: bold;', posterMeshes);
    }
}

function applyDynamicTextures(meshObject, meshName, materialName, loadTexture) {
    for (const objectType in window.texturePaths) {
        const objectTypeConfig = window.texturePaths[objectType];
        
        const isMatch = meshName.includes(objectType) || 
                       materialName.includes(objectType) ||
                       meshName === objectType ||
                       materialName === objectType;
                       
        if (isMatch) {
            console.log(`Found matching object type '${objectType}' for mesh:`, meshObject.name);
            
            let newMaterial = meshObject.material.clone();
            
            if (!newMaterial.isMeshStandardMaterial) {
                const oldMaterial = newMaterial;
                newMaterial = new THREE.MeshStandardMaterial();
                newMaterial.color.copy(oldMaterial.color || new THREE.Color(0xffffff));
                if (oldMaterial.map) newMaterial.map = oldMaterial.map;
            }
            
            newMaterial.color = new THREE.Color(0xffffff);
            
            let meshConfig = null;
            const exactMeshName = meshObject.name.toLowerCase();
            const exactMaterialName = meshObject.material.name.toLowerCase();
            
            if (objectTypeConfig[exactMeshName]) {
                meshConfig = objectTypeConfig[exactMeshName];
            } else if (objectTypeConfig[exactMaterialName]) {
                meshConfig = objectTypeConfig[exactMaterialName];
            } else if (objectTypeConfig[objectType]) {
                meshConfig = objectTypeConfig[objectType];
            } else if (objectTypeConfig['default']) {
                meshConfig = objectTypeConfig['default'];
            } else {
                const firstKey = Object.keys(objectTypeConfig)[0];
                if (firstKey) {
                    meshConfig = objectTypeConfig[firstKey];
                }
            }
            
            if (meshConfig) {
                // Check if this is a video texture configuration
                if (meshConfig.videoTexture && meshConfig.videoElementId) {
                    const videoElement = document.getElementById(meshConfig.videoElementId);
                    if (videoElement) {
                        const videoTexture = new THREE.VideoTexture(videoElement);
                        videoTexture.minFilter = THREE.LinearFilter;
                        videoTexture.magFilter = THREE.LinearFilter;
                        videoTexture.encoding = THREE.sRGBEncoding;
                        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
                        videoTexture.wrapT = THREE.ClampToEdgeWrapping;
                        videoTexture.center.set(0.5, 0.5);
                        videoTexture.repeat.set(2.5, 2.5);
                        videoTexture.offset.x = -0.8;
                        videoTexture.flipY = false;
                        
                        newMaterial.map = videoTexture;
                        
                        // Store for animation loop updates
                        videoTextures.push(videoTexture);
                        
                        // Auto-play the video
                        videoElement.play().catch(err => {
                            console.warn('Video autoplay failed, will play on user interaction:', err);
                            // Retry on first user interaction
                            document.addEventListener('click', () => {
                                videoElement.play();
                            }, { once: true });
                        });
                        
                        console.log('Video texture applied to:', meshObject.name);
                    } else {
                        console.warn(`Video element not found: ${meshConfig.videoElementId}`);
                    }
                } else if (meshConfig.baseColor) {
                    if (meshConfig.baseColor.startsWith('#')) {
                        try {
                            newMaterial.color = new THREE.Color(meshConfig.baseColor);
                            newMaterial.map = null;
                        } catch (error) {
                            console.warn(`Failed to apply baseColor hex: ${meshConfig.baseColor}`, error);
                        }
                    } else {
                        try {
                            newMaterial.map = loadTexture(meshConfig.baseColor);
                        } catch (error) {
                            console.warn(`Failed to load baseColor texture: ${meshConfig.baseColor}`, error);
                        }
                    }
                }
                
                if (meshConfig.normalMap) {
                    try {
                        newMaterial.normalMap = loadTexture(meshConfig.normalMap);
                        newMaterial.normalScale = new THREE.Vector2(1, 1);
                    } catch (error) {
                        console.warn(`Failed to load normalMap texture: ${meshConfig.normalMap}`, error);
                    }
                }
                
                if (meshConfig.orm) {
                    try {
                        const ormTexture = loadTexture(meshConfig.orm);
                        newMaterial.aoMap = ormTexture;
                        newMaterial.roughnessMap = ormTexture;
                        newMaterial.metalnessMap = ormTexture;
                        newMaterial.aoMapIntensity = 1.0;
                    } catch (error) {
                        console.warn(`Failed to load ORM texture: ${meshConfig.orm}`, error);
                    }
                }
                
                if (typeof meshConfig.roughness === 'number') {
                    newMaterial.roughness = meshConfig.roughness;
                } else {
                    newMaterial.roughness = 0.8;
                }
                
                if (typeof meshConfig.metalness === 'number') {
                    newMaterial.metalness = meshConfig.metalness;
                } else {
                    newMaterial.metalness = 0.1;
                }
                
                const emissionColor = meshConfig.emissionColor || meshConfig.emissiveColor;
                if (emissionColor) {
                    newMaterial.emissive = new THREE.Color(emissionColor);
                    const customIntensity = typeof meshConfig.emissiveIntensity === 'number' ? meshConfig.emissiveIntensity : null;
                    setupBloomObject(meshObject, newMaterial, emissionColor, customIntensity);
                }
                
                if (typeof meshConfig.emissiveIntensity === 'number') {
                    newMaterial.emissiveIntensity = meshConfig.emissiveIntensity;
                }
                
                newMaterial.needsUpdate = true;
                meshObject.material = newMaterial;
                
                return true;
            }
            
            break;
        }
    }
    
    return false;
}

function setupBloomObject(meshObject, material, emissionColor, customIntensity = null) {
    try {
        const color = new THREE.Color(emissionColor);
        
        material.emissive = color.clone();
        material.emissiveIntensity = customIntensity || 1.5;
        material.toneMapped = false;
        material.depthTest = true;
        material.depthWrite = true;
        material.transparent = false;
        meshObject.renderOrder = 0;
        material.needsUpdate = true;
        meshObject.userData.hasBloom = true;
        
        // Assign to both default (0) and bloom (1) layers so it renders in both passes
        meshObject.layers.enable(1);
        
        bloomObjects.push({
            original: meshObject,
            clone: null,
            emissiveColor: color.clone()
        });
        
        console.log(`✓ Bloom effect applied to ${meshObject.name}`);
    } catch (error) {
        console.error('Error setting up bloom object:', error);
    }
}



var touchStartX = 0, touchStartY = 0;

function onTouchStart(event) {
    if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
}

function onTouchEnd(event) {
    if (event.changedTouches.length !== 1) return;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    // Only treat as tap if finger didn't move much (not a drag/orbit)
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        onMouseClick({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

function onMouseClick(event) {
    if (!photoboothModel || isAnimatingCamera) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(cachedIntersectableMeshes);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log('Clicked mesh:', clickedObject.name);
        const paperKey = getPaperProjectKey(clickedObject.name);
        
        if (paperKey) {
            focusedObject = clickedObject;
            currentPaperMesh = clickedObject;
            currentPaperKey = paperKey;
            
            const box = new THREE.Box3().setFromObject(clickedObject);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            distance *= 3.5;
            
            // Use mesh face normal to position camera straight in front
            const normal = getPosterNormal(clickedObject);
            const targetPos = center.clone().add(normal.multiplyScalar(distance));
            animateCamera(
                camera.position.clone(), targetPos,
                controls.target.clone(), center,
                1500,
                function() {
                    showProjectCard(paperKey);
                    initCarousel(paperKey, clickedObject);
                }
            );
        } else if (clickedObject.name.toLowerCase().includes('card')) {
            // Contact card click — use shared flyToCard helper
            flyToCardAndShowContact();
        }
    }
}

var hoveredObject = null;

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkHover(event);
}

function checkHover(event) {
    if (!photoboothModel) return;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(cachedIntersectableMeshes);
    var tooltip = document.getElementById('poster-tooltip');

    if (intersects.length > 0) {
        var hit = intersects[0].object;
        var paperKey = getPaperProjectKey(hit.name);
        var isCardMesh = hit.name.toLowerCase().includes('card');
        var isInteractive = paperKey || isCardMesh;
        if (isInteractive) {
            if (hoveredObject !== hit) {
                if (hoveredObject) unhighlightObject(hoveredObject);
                hoveredObject = hit;
                highlightObject(hoveredObject);
                renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            if (hoveredObject) {
                unhighlightObject(hoveredObject);
                hoveredObject = null;
                renderer.domElement.style.cursor = 'default';
            }
        }
        // Show tooltip for poster meshes or contact card mesh
        if ((paperKey || isCardMesh) && tooltip && event) {
            tooltip.textContent = isCardMesh ? 'Click for contact info' : 'Click to view project';
            tooltip.style.left = (event.clientX + 16) + 'px';
            tooltip.style.top = (event.clientY - 12) + 'px';
            tooltip.classList.add('visible');
        } else if (tooltip) {
            tooltip.classList.remove('visible');
        }
    } else {
        if (hoveredObject) {
            unhighlightObject(hoveredObject);
            hoveredObject = null;
            renderer.domElement.style.cursor = 'default';
        }
        if (tooltip) tooltip.classList.remove('visible');
    }
}

function highlightObject(obj) {
    if (!obj || !obj.material) return;
    if (!obj.userData._savedEmissive) {
        obj.userData._savedEmissive = obj.material.emissive ? obj.material.emissive.clone() : new THREE.Color(0);
        obj.userData._savedEmissiveIntensity = obj.material.emissiveIntensity || 0;
    }
    if (obj.material.emissive) {
        obj.material.emissive.set(0x333333);
        obj.material.emissiveIntensity = 0.5;
    }
}

function unhighlightObject(obj) {
    if (!obj || !obj.material || !obj.userData._savedEmissive) return;
    obj.material.emissive.copy(obj.userData._savedEmissive);
    obj.material.emissiveIntensity = obj.userData._savedEmissiveIntensity;
    delete obj.userData._savedEmissive;
    delete obj.userData._savedEmissiveIntensity;
}


function focusOnObject(object) {
    if (!object || isAnimatingCamera) return;
    
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    distance *= 2.5;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate();
    
    if (Math.abs(direction.y) < 0.3) {
        direction.y = 0.5;
        direction.normalize();
    }
    
    const targetCameraPosition = center.clone().add(direction.multiplyScalar(distance));
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    const endPosition = targetCameraPosition;
    const endTarget = center;
    
    focusedObject = object;
    
    animateCamera(startPosition, endPosition, startTarget, endTarget);
}

function animateCamera(startPos, endPos, startTarget, endTarget, duration = 1500, onComplete) {
    if (isAnimatingCamera) {
        cancelAnimationFrame(animationId);
    }
    
    isAnimatingCamera = true;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeInOutCubic = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(startPos, endPos, easeInOutCubic);
        controls.target.lerpVectors(startTarget, endTarget, easeInOutCubic);
        controls.update();
        
        if (progress < 1) {
            animationId = requestAnimationFrame(animate);
        } else {
            isAnimatingCamera = false;
            animationId = null;
            camera.position.copy(endPos);
            controls.target.copy(endTarget);
            controls.update();
            if (onComplete) onComplete();
        }
    }
    
    animate(startTime);
}

function onMouseDoubleClick(event) {
    if (isAnimatingCamera) return;
    resetCamera();
}

function resetCamera() {
    if (isAnimatingCamera) return;
    
    hideProjectCard();
    hideContactCard();
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    focusedObject = null;
    currentPaperKey = null;
    currentPaperMesh = null;
    
    animateCamera(startPosition, originalCameraPosition, startTarget, originalCameraTarget);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (bloomComposer && finalComposer) {
        bloomComposer.setSize(Math.round(window.innerWidth * 0.5), Math.round(window.innerHeight * 0.5));
        finalComposer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Cached DOM elements for animate loop (avoid per-frame getElementById)
let _projectCardEl = null;
let _contactCardEl = null;

function animate() {
    requestAnimationFrame(animate);
    
    // Cache DOM references once
    if (!_projectCardEl) _projectCardEl = document.getElementById('project-card');
    if (!_contactCardEl) _contactCardEl = document.getElementById('contact-card');
    
    controls.update();
    
    // Poster glow pulse
    var elapsed = glowClock.getElapsedTime();
    var cardVisible = _projectCardEl && _projectCardEl.classList.contains('visible');
    posterMeshes.forEach(function(mesh) {
        if (cardVisible && mesh === currentPaperMesh) return; // skip focused poster
        if (mesh === hoveredObject) return; // skip hovered poster (highlight takes over)
        if (mesh.material && mesh.material.emissive) {
            var pulse = (Math.sin(elapsed * 2.0) + 1) * 0.5; // 0..1
            mesh.material.emissive.setHex(0x94ffe3);
            mesh.material.emissiveIntensity = pulse * 0.12;
        }
    });

    // Contact card mesh: stronger + faster glow pulse
    var contactVisible = _contactCardEl && _contactCardEl.classList.contains('visible');
    if (contactMesh && contactMesh.material && contactMesh.material.emissive) {
        if (contactMesh !== hoveredObject && !contactVisible) {
            var contactPulse = (Math.sin(elapsed * 2.5) + 1) * 0.5; // faster frequency
            contactMesh.material.emissive.setHex(0x94ffe3);
            contactMesh.material.emissiveIntensity = contactPulse * 0.25; // 2× brighter than posters
        }
    }
    
    // Update video textures
    videoTextures.forEach(videoTexture => {
        if (videoTexture && videoTexture.image && videoTexture.image.readyState >= videoTexture.image.HAVE_CURRENT_DATA) {
            videoTexture.needsUpdate = true;
        }
    });
    
    if (bloomComposer && finalComposer && bloomObjects.length > 0) {
        // Use layers to isolate bloom objects instead of scene traversal
        camera.layers.set(1); // Only render bloom layer
        bloomComposer.render();
        
        camera.layers.enableAll(); // Render everything for final pass
        finalComposer.render();
    } else {
        camera.layers.enableAll();
        renderer.render(scene, camera);
    }
}

// --- Project card & carousel functions ---

function loadProjectsData(callback) {
    fetch('data/projects.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            window.projectsData = data;
            projectKeys = Object.keys(data);
            console.log('Projects data loaded:', projectKeys.length, 'entries');
            if (callback) callback();
        })
        .catch(function(err) {
            console.warn('Could not load projects.json:', err);
            if (callback) callback();
        });
}

function getPaperProjectKey(meshName) {
    if (!meshName) return null;
    if (!meshName.toLowerCase().includes('poster')) return null;
    // Key is the mesh name directly
    if (window.projectsData[meshName]) return meshName;
    return null;
}

function showProjectCard(projectKey) {
    var project = window.projectsData[projectKey];
    if (!project) return;

    // Close contact card if open (mutual exclusivity)
    hideContactCard();
    
    document.getElementById('card-title').textContent = project.name || projectKey;
    document.getElementById('card-description').textContent = project.description || '';
    document.getElementById('card-category').textContent = project.category || '';
    document.getElementById('card-year').textContent = project.year || '';
    document.getElementById('card-status').textContent = project.status || '';
    
    // Project counter (e.g. "Project 1 / 2")
    var counterEl = document.getElementById('project-counter');
    if (counterEl && projectKeys.length > 0) {
        var idx = projectKeys.indexOf(projectKey);
        counterEl.textContent = 'Project ' + (idx + 1) + ' / ' + projectKeys.length;
    }
    
    // Load first image into the card (prefer WebP if supported)
    var images = project.images || [];
    var imgFolder = project.folder_name || projectKey;
    var cardImage = document.getElementById('card-image');
    if (images.length > 0) {
        cardImage.src = toWebP('data/IMG/' + imgFolder + '/' + images[0]);
        cardImage.style.display = 'block';
    } else {
        cardImage.style.display = 'none';
    }
    
    // Show/hide carousel arrows inside card
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');
    var carouselNav = document.getElementById('card-carousel-nav');
    if (images.length > 1) {
        prevBtn.classList.add('visible');
        nextBtn.classList.add('visible');
        carouselNav.style.display = 'flex';
        updateCarouselCounter();
    } else {
        prevBtn.classList.remove('visible');
        nextBtn.classList.remove('visible');
        carouselNav.style.display = 'none';
    }
    
    // Preload only adjacent images for instant navigation (not all at once)
    preloadAdjacentImages(project, imgFolder, 0);
    
    // Show/hide project navigation arrows (only if more than 1 project)
    var projPrev = document.getElementById('project-prev');
    var projNext = document.getElementById('project-next');
    if (projectKeys.length > 1) {
        projPrev.classList.add('visible');
        projNext.classList.add('visible');
    } else {
        projPrev.classList.remove('visible');
        projNext.classList.remove('visible');
    }

    // Apply per-project backdrop color
    var backdrop = document.getElementById('card-backdrop');
    backdrop.style.backgroundColor = project.backdropColor || 'rgba(0, 0, 0, 0.55)';
    
    // Show backdrop and card
    backdrop.classList.add('visible');
    document.getElementById('project-card').classList.add('visible');
    
    // Hide tooltip and onboarding
    var tooltip = document.getElementById('poster-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
    dismissOnboarding();
}

function hideProjectCard() {
    var card = document.getElementById('project-card');
    if (card) card.classList.remove('visible');
    var backdrop = document.getElementById('card-backdrop');
    if (backdrop) {
        backdrop.classList.remove('visible');
        backdrop.style.backgroundColor = ''; // reset to CSS default
    }
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');
    if (prevBtn) prevBtn.classList.remove('visible');
    if (nextBtn) nextBtn.classList.remove('visible');
    var projPrev = document.getElementById('project-prev');
    var projNext = document.getElementById('project-next');
    if (projPrev) projPrev.classList.remove('visible');
    if (projNext) projNext.classList.remove('visible');
    currentCarouselIndex = 0;
}

// --- Contact card functions ---

function showContactCard() {
    // Close project card if open (mutual exclusivity)
    hideProjectCard();

    var backdrop = document.getElementById('card-backdrop');
    backdrop.classList.add('visible');
    document.getElementById('contact-card').classList.add('visible');

    var tooltip = document.getElementById('poster-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
    dismissOnboarding();

    // Start playing the contact video only when card is shown
    var contactVideo = document.getElementById('contact-video');
    if (contactVideo) contactVideo.play().catch(function() {});
}

function hideContactCard() {
    var contact = document.getElementById('contact-card');
    if (contact) contact.classList.remove('visible');

    // Pause contact video to save resources
    var contactVideo = document.getElementById('contact-video');
    if (contactVideo) contactVideo.pause();
    // Only remove backdrop if project card is also hidden
    var projectCard = document.getElementById('project-card');
    if (projectCard && !projectCard.classList.contains('visible')) {
        var backdrop = document.getElementById('card-backdrop');
        if (backdrop) {
            backdrop.classList.remove('visible');
            backdrop.style.backgroundColor = '';
        }
    }
}

function flyToCardAndShowContact() {
    if (!contactMesh) return;
    hideProjectCard();
    focusedObject = contactMesh;

    var box = new THREE.Box3().setFromObject(contactMesh);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var fov = camera.fov * (Math.PI / 180);
    var distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 3.5;

    // Position camera at ~45° between front normal and above
    var normal = getPosterNormal(contactMesh);
    var up = new THREE.Vector3(0, 1, 0);
    var direction = new THREE.Vector3().addVectors(normal, up).normalize().negate();
    var targetPos = center.clone().add(direction.multiplyScalar(distance));

    animateCamera(
        camera.position.clone(), targetPos,
        controls.target.clone(), center,
        1500,
        function() {
            showContactCard();
        }
    );
}

function initCarousel(paperKey, meshObject) {
    var project = window.projectsData[paperKey];
    if (!project || !project.images || project.images.length === 0) return;
    
    currentCarouselIndex = 0;
    currentPaperKey = paperKey;
    currentPaperMesh = meshObject;
    updateCarouselCounter();
}

function navigateCarousel(direction) {
    var project = window.projectsData[currentPaperKey];
    if (!project || !project.images || project.images.length <= 1) return;
    
    var images = project.images;
    currentCarouselIndex = (currentCarouselIndex + direction + images.length) % images.length;
    
    var imgFolder = project.folder_name || currentPaperKey;
    var cardImage = document.getElementById('card-image');
    if (cardImage) {
        cardImage.src = toWebP('data/IMG/' + imgFolder + '/' + images[currentCarouselIndex]);
    }
    updateCarouselCounter();
    
    // Preload adjacent images for smooth navigation
    preloadAdjacentImages(project, imgFolder, currentCarouselIndex);
}

function preloadAdjacentImages(project, imgFolder, currentIndex) {
    var images = project.images;
    if (!images || images.length <= 1) return;
    for (var offset = -1; offset <= 1; offset++) {
        var idx = (currentIndex + offset + images.length) % images.length;
        var img = new Image();
        img.src = toWebP('data/IMG/' + imgFolder + '/' + images[idx]);
    }
}

function updateCarouselCounter() {
    var project = window.projectsData[currentPaperKey];
    if (!project || !project.images) return;
    var counter = document.getElementById('carousel-counter');
    if (counter) {
        counter.textContent = (currentCarouselIndex + 1) + ' / ' + project.images.length;
    }
}

function navigateProject(direction) {
    if (!currentPaperKey || projectKeys.length <= 1) return;
    var idx = projectKeys.indexOf(currentPaperKey);
    if (idx === -1) return;
    var newIdx = (idx + direction + projectKeys.length) % projectKeys.length;
    var newKey = projectKeys[newIdx];
    
    // Find the poster mesh for this project key
    var newMesh = null;
    for (var i = 0; i < posterMeshes.length; i++) {
        if (getPaperProjectKey(posterMeshes[i].name) === newKey) {
            newMesh = posterMeshes[i];
            break;
        }
    }
    if (!newMesh) return;
    
    // Update state
    currentPaperKey = newKey;
    currentPaperMesh = newMesh;
    focusedObject = newMesh;
    currentCarouselIndex = 0;
    
    // Animate camera to new poster
    var box = new THREE.Box3().setFromObject(newMesh);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var fov = camera.fov * (Math.PI / 180);
    var distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 3.5;
    var normal = getPosterNormal(newMesh);
    var targetPos = center.clone().add(normal.multiplyScalar(distance));
    
    animateCamera(
        camera.position.clone(), targetPos,
        controls.target.clone(), center,
        800,
        function() {
            showProjectCard(newKey);
            initCarousel(newKey, newMesh);
        }
    );
}

function dismissOnboarding() {
    var tip = document.getElementById('onboarding-tip');
    if (!tip) return;
    tip.classList.remove('visible');
    tip.classList.add('hiding');
}

// Initialize the scene
init();
animate();

// --- Utility: compute poster face normal in world space ---
function getPosterNormal(mesh) {
    var geo = mesh.geometry;
    var normal = new THREE.Vector3(0, 0, 1); // default: facing +Z
    if (geo && geo.attributes && geo.attributes.normal) {
        // Average the first face's normals
        var nAttr = geo.attributes.normal;
        var n = new THREE.Vector3(0, 0, 0);
        var count = Math.min(nAttr.count, 6);
        for (var i = 0; i < count; i++) {
            n.x += nAttr.getX(i);
            n.y += nAttr.getY(i);
            n.z += nAttr.getZ(i);
        }
        n.divideScalar(count).normalize();
        if (n.length() > 0.01) normal = n;
    }
    // Transform normal to world space
    normal.applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
    normal.normalize();
    return normal;
}

// --- Utility: fit texture to mesh without stretching (contain + center) ---
function fitTextureToMesh(texture, mesh, rotationDeg) {
    if (!texture.image) return;
    var imgW = texture.image.width || texture.image.videoWidth || 1;
    var imgH = texture.image.height || texture.image.videoHeight || 1;
    // If rotating 90 or 270 degrees, swap effective image dimensions
    var rot = (rotationDeg || 0) % 360;
    if (rot < 0) rot += 360;
    var swapDims = (rot === 90 || rot === 270);
    var effW = swapDims ? imgH : imgW;
    var effH = swapDims ? imgW : imgH;
    var imgAspect = effW / effH;

    // Compute mesh surface aspect ratio from UV-to-position mapping
    // This is always correct regardless of mesh orientation or axis layout
    var meshAspect = 1;
    var posAttr = mesh.geometry.getAttribute('position');
    var uvAttr = mesh.geometry.getAttribute('uv');
    if (posAttr && uvAttr && posAttr.count >= 3) {
        var p0 = new THREE.Vector3().fromBufferAttribute(posAttr, 0);
        var p1 = new THREE.Vector3().fromBufferAttribute(posAttr, 1);
        var p2 = new THREE.Vector3().fromBufferAttribute(posAttr, 2);
        var uv0 = new THREE.Vector2().fromBufferAttribute(uvAttr, 0);
        var uv1 = new THREE.Vector2().fromBufferAttribute(uvAttr, 1);
        var uv2 = new THREE.Vector2().fromBufferAttribute(uvAttr, 2);

        var dp1 = p1.clone().sub(p0);
        var dp2 = p2.clone().sub(p0);
        var duv1 = uv1.clone().sub(uv0);
        var duv2 = uv2.clone().sub(uv0);

        var det = duv1.x * duv2.y - duv1.y * duv2.x;
        if (Math.abs(det) > 0.0001) {
            var invDet = 1.0 / det;
            // Tangent = dPosition/dU (physical size per UV unit in U)
            var tangentLen = new THREE.Vector3(
                invDet * (duv2.y * dp1.x - duv1.y * dp2.x),
                invDet * (duv2.y * dp1.y - duv1.y * dp2.y),
                invDet * (duv2.y * dp1.z - duv1.y * dp2.z)
            ).length();
            // Bitangent = dPosition/dV (physical size per UV unit in V)
            var bitangentLen = new THREE.Vector3(
                invDet * (-duv2.x * dp1.x + duv1.x * dp2.x),
                invDet * (-duv2.x * dp1.y + duv1.x * dp2.y),
                invDet * (-duv2.x * dp1.z + duv1.x * dp2.z)
            ).length();
            if (bitangentLen > 0.0001) {
                meshAspect = tangentLen / bitangentLen;
            }
        }
    }
    console.log('fitTexture:', mesh.name, 'img:', imgW + 'x' + imgH, 'meshAspect:', meshAspect.toFixed(3));

    // Canvas sized to preserve image quality
    var canvasSize = Math.max(imgW, imgH, 1024);
    var canvasW, canvasH;
    if (meshAspect >= 1) {
        canvasW = canvasSize;
        canvasH = Math.round(canvasSize / meshAspect);
    } else {
        canvasH = canvasSize;
        canvasW = Math.round(canvasSize * meshAspect);
    }

    var canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext('2d');

    // Stretch: fill entire canvas, stretching the image to match the poster size
    var drawW = canvasW;
    var drawH = canvasH;

    // Apply rotation around canvas center
    if (rot !== 0) {
        ctx.save();
        ctx.translate(canvasW / 2, canvasH / 2);
        ctx.rotate(rot * Math.PI / 180);
        ctx.drawImage(texture.image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
    } else {
        ctx.drawImage(texture.image, 0, 0, drawW, drawH);
    }

    // Replace texture with canvas — 1:1 mapping, no repeat/offset tricks
    texture.image = canvas;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
}
