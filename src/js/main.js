import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
pointLight.castShadow = true;
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-10, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

function createAxis(p1, p2, color) {
    const material = new THREE.LineBasicMaterial({ color: color });
    const points = [p1, p2];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
}

const axisX = createAxis(new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0), 0xff0000);
const axisY = createAxis(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 10, 0), 0x00ff00);

scene.add(axisX);
scene.add(axisY);

const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const spheres = [];
const numPoints = 100;
const spacing = 0.2;

for (let i = 0; i < numPoints; i++) {
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        specular: 0x111111,
        shininess: 50
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    sphere.position.x = (i - numPoints / 2) * spacing;
    sphere.position.y = Math.sin(sphere.position.x);

    spheres.push(sphere);
    scene.add(sphere);
}

camera.position.z = 20;

function elevationToColor(elevation) {
    const minElevation = -1;
    const maxElevation = 1;
    const normalizedElevation = (elevation - minElevation) / (maxElevation - minElevation);
    const colorValue = Math.floor(normalizedElevation * 255);
    return new THREE.Color(`rgb(${colorValue}, 0, ${255 - colorValue})`);
}

function elevationToEmissive(elevation) {
    const baseColor = new THREE.Color(0x7573ff);
    const minElevation = -1;
    const maxElevation = 1;
    const normalizedElevation = (elevation - minElevation) / (maxElevation - minElevation);
    return baseColor.multiplyScalar(normalizedElevation);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const tooltip = document.getElementById("tooltip");

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener("mousemove", onMouseMove, false);

let animationStartTime = Date.now();

function animate() {
    requestAnimationFrame(animate);

    const autoPlay = document.getElementById("autoPlay").checked;
    const slider = document.getElementById("slider");

    let time;
    if (autoPlay) {
        slider.disabled = true;
        const elapsedTime = (Date.now() - animationStartTime) / 1000;
        time = elapsedTime % (2 * Math.PI);
    } else {
        slider.disabled = false;
        const sliderValue = slider.value;
        time = sliderValue / 100 * Math.PI * 2;
    }

    spheres.forEach((sphere, index) => {
        sphere.position.y = Math.sin(sphere.position.x + time);
        sphere.material.color = elevationToColor(sphere.position.y);
        sphere.material.emissive = elevationToEmissive(sphere.position.y);
        sphere.material.shininess = Math.max(50, 100 * (sphere.position.y + 1) / 2);
    });

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        tooltip.style.display = "block";
        tooltip.style.left = `${mouse.x * (window.innerWidth / 2) + window.innerWidth / 2 + 10}px`;
        tooltip.style.top = `${-mouse.y * (window.innerHeight / 2) + window.innerHeight / 2 + 10}px`;
        tooltip.innerHTML = `X: ${intersected.position.x.toFixed(2)}, Y: ${intersected.position.y.toFixed(2)}`;
    } else {
        tooltip.style.display = "none";
    }

    controls.update();

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
