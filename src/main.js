import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//RENDER
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.001);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 300, 600);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

    //State variables
let asteroidsList = [];
let calculatedPositions = []; //XYZ coordinates
const distScale = 0.000008;

    //Camera control
let marker;
let targetCamera = new THREE.Vector3(0, 0, 0);
let goToTarget = false;

//ENTITIES
    //SUN
const sun = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd700 })
);
scene.add(sun);

    //EARTH
const earth = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00a8ff })
);
earth.position.set(250, 0, 0);
scene.add(earth);

    //EARTHs ORBIT
const orbit_eart = new THREE.BufferGeometry();
const orbit_eart_points = [];
for (let i=0; i <= 64; i++){
    const theta = (i / 64) * Math.PI * 2;
    orbit_eart_points.push(new THREE.Vector3(Math.cos(theta) * 250, 0, Math.sin(theta) * 250));
}
orbit_eart.setFromPoints(orbit_eart_points);
scene.add(new THREE.Line(orbit_eart, new THREE.LineBasicMaterial({ color: 0x222222 })));

    //BOX FOR MARKED ASTEROID
marker = new THREE.Mesh(
    new THREE.BoxGeometry(12, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
);
marker.visible = false;
scene.add(marker);

//JSON DATA UPLOAD
fetch('./asteroids_data.json')
    .then(res => res.json())
    .then(data => {
        asteroidsList = data;
        createAsteroidsBelt(data);
        initSearcher();
    })
    .catch(err => console.error("data JSON error", err));

function createAsteroidsBelt(asteroids){
    const count = asteroids.length;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const fastColor = new THREE.Color(0xff3300);
    const slowColor = new THREE.Color(0x555566);

    //TODO: develop the asteroids belt well
    
    asteroids.forEach((ast, i) => {
        const distKm = parseFloat(ast.dist_km) || 150000;
        const velocityKmS = parseFloat(ast.velocity_km_s) || 15;

        const visual_dist = Math.max(40, distKm * distScale);

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.cos(2.0 * v - 1.0);

        const x = earth.position.x + (visual_dist* Math.sin(phi) * Math.cos(theta));
        const y = earth.position.y + (visual_dist* Math.sin(phi) * Math.sin(theta));
        const z = earth.position.z + (visual_dist* Math.cos(phi));

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        calculatedPositions.push({ x, y, z });

        const speedFactor = Math.min(1, velocityKmS / 35);
        const finalColor = new THREE.Color().lerpColors(slowColor, fastColor, speedFactor);

        colors[i * 3] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const materialPoints = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const cloudPoints = new THREE.Points(geometry, materialPoints);
    scene.add(cloudPoints);
}

function initSearcher(){
    const input = document.getElementById('search-input');
    const resultsList = document.getElementById('results');

    input.addEventListener('input', (e) => {
        const text = e.target.value.trim().toLowerCase();
        resultsList.innerHTML='';

        if(text.length === 0){
            resultsList.style.display = 'none';
            return;
        }

        const filtered = asteroidsList
            .map((ast, index) => ({ ...ast, originalIndex: index }))
            .filter(ast => ast.designation && ast.designation.toLowerCase().includes(text))
            .slice(0, 5);
        
        if(filtered.length > 0){
            resultsList.style.display = 'block';
            filtered.forEach(ast => {
                const li = document.createElement('li');
                li.textContent = `${ast.designation} (${ast.close_approach_date})`;
                li.addEventListener('click', () => focusAsteroid(ast.originalIndex));
                resultsList.appendChild(li);
            });
        } else {
            resultsList.style.display = 'none';
        }
    });
}

function focusAsteroid(index) {
    const ast_data = asteroidsList[index];
    const pos = calculatedPositions[index];

    marker.position.set(pos.x, pos.y, pos.z);
    marker.visible = true;

    targetCamera.set(pos.x, pos.y, pos.z);
    controls.target.copy(targetCamera);
    goToTarget = true;

    document.getElementById('results').style.display = 'none';
    document.getElementById('search-input').value = ast_data.designation;
}

//ANIMATION LOOP - RENDER
function animation() {
    requestAnimationFrame(animation);

    scene.rotation.y += 0.0003;

    if(goToTarget){
        const idealPositionCamera = new THREE.Vector3(
            targetCamera.x,
            targetCamera.y + 40,
            targetCamera.z + 80
        );

        camera.position.lerp(idealPositionCamera, 0.05);

        if(camera.position.distanceTo(idealPositionCamera) < 1){
            goToTarget = false;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animation();
