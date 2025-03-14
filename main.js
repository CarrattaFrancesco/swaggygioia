import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';

const image_path = {   
    "Paper" : [
        "DSC07024.jpg","DSC07075.jpg","DSC07084.jpg","DSC07089.jpg","DSC07097.jpg","DSC07105.jpg","DSC07149.jpg","DSC07190.jpg","DSC07192.jpg","DSC07193.jpg","DSC07208.jpg","DSC07214.jpg"
    ]
}

// 3D scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
// Set the size of the renderer to the size of the window
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = 0; // Remove margin
document.body.style.overflow = 'hidden'; // Hide overflow
renderer.setClearColor( 0x808080 );
document.body.appendChild(renderer.domElement);

// Add an event listener for the resize event
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    // Update the size of the renderer and the aspect ratio of the camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Set the point to look at
controls.enableZoom = false; // Disable zooming
controls.enablePan = false; // Disable panning
controls.update();

// LIGHT
// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040,3); // soft white light
scene.add(ambientLight);

// Add point light
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// Add point light
const pointLight2 = new THREE.PointLight(0xffffff, 1, 100);
pointLight2.position.set(0, 0, 0);
scene.add(pointLight2);

// OBJECTS
// Create a raycaster and a mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loader = new GLTFLoader();

// PHOTOBOOT
loader.load( 'public/photoboot.glb', function ( gltf ) {

    // Add a click event listener to the window
    window.addEventListener('click', onClick, false);

    function onClick(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(gltf.scene.children, true);

        intersects.forEach(intersect => {
            // Check if the intersected object's name includes "Paper"
            if (intersect.object.name.includes("Paper")) {
                // change name
                $("#title").text(intersect.object.name);

                // add all the images in div with id "image_container" wtih <img> this block as wrapper <div class="grid-item"></div>
                $(".mosaic-gallery").empty();
                console.log(image_path[intersect.object.name]);
        
                const imageName = intersect.object.name;
                if (image_path[imageName]) {
                    const images = image_path[imageName].map(imageName => {
                        const img = new Image();
                        img.onload = function() {
                            const imgSrc = `public/projects/${imageName}/${imageName}`;
                            return `<li  style="background-image:url('${imgSrc}')"><img src="${imgSrc}" alt="image"></li>`;
                        };
                        img.src = `public/projects/${imageName}/${imageName}`;
                        return img;
                    });
                    $(".mosaic-gallery").append(images);
                } else {
                    console.warn(`No images found for ${imageName}`);
                }

                // display the block with id project_card
                $("#project_card").fadeIn("fast");
            }
        });
    }

    gltf.scene.traverse(function(node) {
        if (node.isMesh) {
            if (node.name && node.name.includes("Paper")) {
                // Generate a random color
                const color = new THREE.Color(0xffffff);

                // Set the material of the node to a new MeshBasicMaterial with the random color
                node.material = new THREE.MeshBasicMaterial({color: color});

            }
        }
    });

    gltf.scene.position.set(0, -5, 0); // Set position to the center
    gltf.scene.rotateY(-Math.PI / 2);
    scene.add( gltf.scene );
}, undefined, function ( error ) {
    console.error( error );
} );

camera.position.z = 15;




// BLOOM
// Create a composer
const composer = new EffectComposer(renderer);

// Create an UnrealBloomPass
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    100, // strength
    0.4, // radius
    0.85 // threshold
);
composer.addPass(bloomPass);


renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});


// ----------- MODAL ------------
// function to put display none for the project_card when the user clicks on the close button
document.getElementById("close_button").addEventListener("click", function() {
    $("#project_card").fadeOut();
});


$('.grid').masonry({
    // options
    itemSelector: '.grid-item',
    columnWidth: 200
  });