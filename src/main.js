import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('canvas-container');
let scene, camera, renderer, controls;
let asteroidsList = [];
let asteroidOrbitalData = [];
const AU_TO_UNITS = 250;
const clock = new THREE.Clock();
let asteroidInstances;
let starField;
let marker;
const targetCamera = new THREE.Vector3(0, 0, 0);
let goToTarget = false;
let earthSystem;
let earth;
let moon;
const earthSpeed = 0.12;
const moonOrbitRadius = 70;

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111215);
    scene.fog = new THREE.FogExp2(0x111215, 0.00015);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 8000);
    camera.position.set(0, 400, 700);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 3000;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 5, 5000);
    scene.add(sunLight);

    createCosmicBodies();
    createSpaceBackground();

    marker = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.8 })
    );
    marker.visible = false;
    scene.add(marker);

    animationLoop();
}

// Create the sun, earth-moon system, and orbital lines.
function createCosmicBodies() {
    const sunGeo = new THREE.SphereGeometry(30, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    const glowGeo = new THREE.SphereGeometry(38, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(sunGlow);

    const orbitGeo = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * AU_TO_UNITS, 0, Math.sin(theta) * AU_TO_UNITS));
    }
    orbitGeo.setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x00bcff, transparent: true, opacity: 0.3 });
    const earthOrbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(earthOrbitLine);

    earthSystem = new THREE.Group();
    scene.add(earthSystem);

    const earthGeo = new THREE.SphereGeometry(20, 32, 32);
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x00a8ff,
        emissive: 0x002244,
        shininess: 15
    });
    earth = new THREE.Mesh(earthGeo, earthMat);
    earthSystem.add(earth);

    const moonGeometry = new THREE.SphereGeometry(10, 20, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.x = moonOrbitRadius;
    earthSystem.add(moon);

    const moonOrbitGeo = new THREE.BufferGeometry();
    const moonOrbitPoints = [];
    const moonSegments = 64;

    for (let i = 0; i <= moonSegments; i++) {
        const theta = (i / moonSegments) * Math.PI * 2;
        moonOrbitPoints.push(new THREE.Vector3(Math.cos(theta) * moonOrbitRadius, 0, Math.sin(theta) * moonOrbitRadius));
    }
    moonOrbitGeo.setFromPoints(moonOrbitPoints);

    const moonOrbitMat = new THREE.LineBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.6
    });
    const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    earthSystem.add(moonOrbitLine);
}

function createCosmicDust() {
    const dustCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);

    const color1 = new THREE.Color(0x3a0066);
    const color2 = new THREE.Color(0x002244);

    for (let i = 0; i < dustCount * 3; i += 3) {
        const radius = 200 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const mixedColor = new THREE.Color().lerpColors(color1, color2, Math.random());

        positions[i] = Math.cos(theta) * radius;
        positions[i + 1] = (Math.random() - 0.5) * 150;
        positions[i + 2] = Math.sin(theta) * radius;

        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const dustField = new THREE.Points(geometry, material);
    scene.add(dustField);
}

// Create a star field background for depth and ambience.
function createSpaceBackground() {
    const starsCount = 2000;
    const starsGeo = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
        const radius = 4000 + Math.random() * 2000;
        if (Math.random() > 0.4) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.15;

            starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
            starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starsPositions[i + 2] = radius * Math.cos(phi);
        } else {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);

            starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
            starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starsPositions[i + 2] = radius * Math.cos(phi);
        }
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.9,
        transparent: true,
        opacity: 1.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false
    });

    starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);
}

// Generate and return an irregular asteroid mesh geometry.
function createAsteroidGeometry() {
    const geometry = new THREE.DodecahedronGeometry(0.8, 1);
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        const noise = 1 + (Math.random() - 0.5) * 0.4;
        positionAttribute.setXYZ(i, x * noise, y * noise, z * noise);
    }

    geometry.computeVertexNormals();
    return geometry;
}

// Build the asteroid belt as an InstancedMesh and record orbital data.
function createAsteroidsBelt(asteroids) {
    const count = asteroids.length;
    const geometry = createAsteroidGeometry();
    const material = new THREE.MeshStandardMaterial({
        roughness: 0.9,
        metalness: 0.2,
        flatShading: true
    });

    asteroidInstances = new THREE.InstancedMesh(geometry, material, count);

    const fastColor = new THREE.Color(0xff3300);
    const slowColor = new THREE.Color(0x4ba3a5);
    const dummy = new THREE.Object3D();

    asteroids.forEach((ast, i) => {
        const distKm = parseFloat(ast.dist_km) || 150000000;
        const distAu = distKm / 149597870.7;
        const baseRadiusAu = 1.0 + (Math.random() - 0.5) * 0.4;
        const radiusThree = baseRadiusAu * AU_TO_UNITS;
        const thetaInitial = Math.random() * Math.PI * 2;
        const eccentricityX = 0.85 + Math.random() * 0.3;
        const eccentricityZ = 0.85 + Math.random() * 0.3;
        const posX = radiusThree * Math.cos(thetaInitial) * eccentricityX;
        const posZ = radiusThree * Math.sin(thetaInitial) * eccentricityZ;
        const inclination = (Math.random() - 0.5) * 0.35;
        const posY = radiusThree * Math.sin(thetaInitial) * Math.sin(inclination);
        const rotX = Math.random() * Math.PI;
        const rotY = Math.random() * Math.PI;
        const rotZ = Math.PI;
        const rotSpeedX = (Math.random() - 0.5) * 2;
        const rotSpeedY = (Math.random() - 0.5) * 2;
        const scaleX = 0.8 + Math.random() * 1.2;
        const scaleY = 0.8 + Math.random() * 1.0;
        const scaleZ = 0.8 + Math.random() * 1.0;

        dummy.position.set(posX, posY, posZ);
        dummy.rotation.set(rotX, rotY, rotZ);
        dummy.scale.set(scaleX, scaleY, scaleZ);
        dummy.updateMatrix();
        asteroidInstances.setMatrixAt(i, dummy.matrix);

        const periodYears = Math.sqrt(Math.pow(baseRadiusAu, 3)) || 1.0;
        const angularVelocity = (Math.PI * 2 / periodYears) * 0.05;

        asteroidOrbitalData.push({
            radiusThree: radiusThree,
            eccentricityX: eccentricityX,
            eccentricityZ: eccentricityZ,
            inclination: inclination,
            theta: thetaInitial,
            angularVelocity: angularVelocity,
            rotX,
            rotY,
            rotZ,
            rotSpeedX,
            rotSpeedY,
            scaleX,
            scaleY,
            scaleZ,
            designation: ast.designation
        });

        const speed = parseFloat(ast.velocity_km_s) || 15;
        const speedFactor = Math.min(1, Math.max(0, (speed - 5) / 30));
        const finalColor = new THREE.Color().lerpColors(slowColor, fastColor, speedFactor);
        asteroidInstances.setColorAt(i, finalColor);
    });
    scene.add(asteroidInstances);
    asteroidInstances.instanceMatrix.needsUpdate = true;
}

// Initialize the search input and result selection behavior.
function initSearcher() {
    const input = document.getElementById('search-input');
    const resultsList = document.getElementById('results');

    if (!input || !resultsList) return;

    input.addEventListener('input', (e) => {
        const text = e.target.value.trim().toLowerCase();
        resultsList.innerHTML = '';

        if (text.length === 0) {
            resultsList.style.display = 'none';
            if (marker) marker.visible = false;
            targetCamera.set(0, 0, 0);
            goToTarget = true;
            return;
        }

        const filtered = asteroidsList
            .map((ast, index) => ({ ...ast, originalIndex: index }))
            .filter(ast => ast.designation && ast.designation.toLowerCase().includes(text))
            .slice(0, 5);

        if (filtered.length > 0) {
            resultsList.style.display = 'block';
            filtered.forEach(ast => {
                const li = document.createElement('li');
                li.className = 'result-item';
                const year = ast.close_approach_date ? ast.close_approach_date.substring(0, 4) : 'N/A';
                li.textContent = `${ast.designation} (${year})`;
                li.addEventListener('click', () => focusAsteroid(ast.originalIndex));
                resultsList.appendChild(li);
            });
        } else {
            resultsList.style.display = 'none';
        }
    });

    input.addEventListener('search', () => {
        if (input.value === '') {
            if (marker) marker.visible = false;
            targetCamera.set(0, 0, 0);
            goToTarget = true;
        }
    });
}

// Focus the camera and marker on the selected asteroid.
function focusAsteroid(index) {
    const ast_data = asteroidsList[index];
    const orb_data = asteroidOrbitalData[index];
    const earthCurrentTheta = clock.getElapsedTime() * earthSpeed;
    orb_data.theta = earthCurrentTheta + ((Math.random() - 0.5) * 0.05);

    const currentX = orb_data.radiusThree * Math.cos(orb_data.theta) * (orb_data.eccentricityX || 1.0);
    const currentY = orb_data.radiusThree * Math.sin(orb_data.theta) * Math.sin(orb_data.inclination || 0.0);
    const currentZ = orb_data.radiusThree * Math.sin(orb_data.theta) * (orb_data.eccentricityZ || 1.0);

    marker.position.set(currentX, currentY, currentZ);
    marker.visible = true;

    targetCamera.set(currentX, currentY, currentZ);
    controls.target.copy(targetCamera);
    goToTarget = true;

    const listElement = document.getElementById('results');
    if (listElement) listElement.style.display = 'none';

    const inputElement = document.getElementById('search-input');
    if (inputElement) inputElement.value = ast_data.designation;

    showAsteroidMetricsPanel(ast_data);
}

// Display a telemetry panel for the chosen asteroid.
function showAsteroidMetricsPanel(data) {
    let panel = document.getElementById('telemetry-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'telemetry-panel';
        panel.style = "position:absolute; bottom:20px; left:20px; background:rgba(0,10,20,0.85); padding:15px; border-left:4px solid #00ff00; color:white; font-family:monospace; min-width:260px; box-shadow: 0 0 15px rgba(0,255,0,0.2); z-index:100;";
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div style="color:#00ff00; font-weight:bold; margin-bottom:5px;">&gt; ASTEROID TELEMETRY</div>
        <div>NAME: ${data.designation}</div>
        <div>CLOSE APPROACH: ${data.close_approach_date}</div>
        <div>DIST. EARTH: ${parseFloat(data.dist_km).toLocaleString()} km</div>
        <div>VELOCITY: ${parseFloat(data.velocity_km_s).toFixed(2)} km/s</div>
    `;
}

// Update scene objects each animation frame and move the camera.
function animationLoop() {
    requestAnimationFrame(animationLoop);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (earthSystem) {
        const currentEarthX = Math.cos(elapsedTime * earthSpeed) * AU_TO_UNITS;
        const currentEarthZ = Math.sin(elapsedTime * earthSpeed) * AU_TO_UNITS;
        earthSystem.position.set(currentEarthX, 0, currentEarthZ);

        if (earth) {
            earth.rotation.y += 0.005;
        }

        if (moon) {
            if (typeof moonAngle === 'undefined') window.moonAngle = 0;
            window.moonAngle += 1.5 * deltaTime;

            moon.position.x = Math.cos(window.moonAngle) * moonOrbitRadius;
            moon.position.z = Math.sin(window.moonAngle) * moonOrbitRadius;
        }
    }

    if (asteroidInstances && asteroidOrbitalData.length > 0) {
        const dummy = new THREE.Object3D();

        asteroidOrbitalData.forEach((orb, i) => {
            orb.theta += (orb.angularVelocity || 0.01) * deltaTime;
            const r = orb.radiusThree || 45;
            const eccX = orb.eccentricityX || 1.0;
            const eccZ = orb.eccentricityZ || 1.0;
            const inc = orb.inclination || 0.0;
            const newX = r * Math.cos(orb.theta) * eccX;
            const newY = r * Math.sin(orb.theta) * Math.sin(inc);
            const newZ = r * Math.sin(orb.theta) * eccZ;

            if (marker && marker.visible && inputElementMatches(orb.designation)) {
                const earthCurrentTheta = elapsedTime * earthSpeed;
                orb.theta = earthCurrentTheta + 0.03;

                const targetX = r * Math.cos(orb.theta) * eccX;
                const targetY = r * Math.sin(orb.theta) * Math.sin(inc);
                const targetZ = r * Math.sin(orb.theta) * eccZ;

                marker.position.set(targetX, targetY, targetZ);

                if (goToTarget) {
                    targetCamera.set(targetX, targetY, targetZ);
                    controls.target.lerp(targetCamera, 0.05);
                }
            }

            dummy.position.set(newX, newY, newZ);
            const sX = orb.scaleX || 1.0;
            const sY = orb.scaleY || 1.0;
            const sZ = orb.scaleZ || 1.0;
            dummy.scale.set(sX, sY, sZ);

            orb.rotX += (orb.rotSpeedX || 0) * deltaTime;
            orb.rotY += (orb.rotSpeedY || 0) * deltaTime;
            dummy.rotation.set(orb.rotX, orb.rotY, orb.rotZ || 0);

            dummy.updateMatrix();
            asteroidInstances.setMatrixAt(i, dummy.matrix);
        });

        asteroidInstances.instanceMatrix.needsUpdate = true;
    }

    if (goToTarget) {
        let idealCameraPos;

        if (targetCamera.x === 0 && targetCamera.y === 0 && targetCamera.z === 0) {
            idealCameraPos = new THREE.Vector3(0, 400, 700);
            controls.target.lerp(targetCamera, 0.05);
        } else {
            idealCameraPos = new THREE.Vector3(
                targetCamera.x + 40,
                targetCamera.y + 30,
                targetCamera.z + 60
            );
        }

        camera.position.lerp(idealCameraPos, 0.05);

        if (camera.position.distanceTo(idealCameraPos) < 1.0) {
            goToTarget = false;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

function inputElementMatches(designation) {
    const input = document.getElementById('search-input');
    return input && input.value === designation;
}

window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

fetch('./data/asteroids.json')
    .then(res => res.json())
    .then(data => {
        asteroidsList = data;
        initEngine();
        createAsteroidsBelt(data);
        initSearcher();
    })
    .catch(err => console.error("Critical error loading layout dataset:", err));