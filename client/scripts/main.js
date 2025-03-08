import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TerrainGenerator } from './game/terrain.js';
import { Artillery } from './game/artillery.js';
import { WeatherSystem } from './game/weather.js';
import { Infantry } from './game/units/infantry.js';
import { Tank } from './game/units/tank.js';
import { Helicopter } from './game/units/helicopter.js';
import { initSocket } from './networking/socket.js';
import { initAuth } from './auth/login.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Initialize game systems
        this.setupLighting();
        this.setupControls();
        this.initializeSystems();
        this.setupEventListeners();
        
        // Game state
        this.selectedUnit = null;
        this.resources = 500;
        this.units = [];
        
        // Start game loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x666666);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // Adjust shadow properties
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        
        const d = 200;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        
        this.scene.add(sunLight);
    }

    setupControls() {
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI / 2.2;
    }

    initializeSystems() {
        // Initialize terrain
        this.terrain = new TerrainGenerator();
        const terrainMesh = this.terrain.generate();
        this.scene.add(terrainMesh);
        
        // Initialize artillery system
        this.artillery = new Artillery(this.scene, this.terrain);
        
        // Initialize weather system
        this.weather = new WeatherSystem(this.scene);
        
        // Initialize networking
        this.socket = initSocket();
        
        // Initialize authentication
        this.auth = initAuth();
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children, true);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                
                if (clickedObject.userData.unit) {
                    // Unit selection
                    this.selectUnit(clickedObject.userData.unit);
                } else if (this.selectedUnit) {
                    // Move selected unit
                    const targetPosition = intersects[0].point;
                    this.selectedUnit.moveTo(targetPosition);
                }
            }
        });

        // Artillery controls
        document.getElementById('fire-button').addEventListener('click', () => {
            const angle = parseFloat(document.getElementById('angle-slider').value);
            const power = parseFloat(document.getElementById('power-slider').value);
            
            // Get current wind
            const wind = this.weather.update(0);
            
            // Fire from current base position
            this.artillery.fire(
                new THREE.Vector3(0, 10, 0),
                angle,
                power * 0.5,
                wind.direction,
                wind.strength
            );
        });

        // Unit spawn buttons
        document.getElementById('infantry-btn').addEventListener('click', () => {
            this.spawnUnit('infantry');
        });
        
        document.getElementById('tank-btn').addEventListener('click', () => {
            this.spawnUnit('tank');
        });
        
        document.getElementById('helicopter-btn').addEventListener('click', () => {
            this.spawnUnit('helicopter');
        });
    }

    selectUnit(unit) {
        if (this.selectedUnit) {
            this.selectedUnit.deselect();
        }
        this.selectedUnit = unit;
        unit.select();
    }

    spawnUnit(type) {
        let unit;
        const spawnPosition = new THREE.Vector3(
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
        );

        switch (type) {
            case 'infantry':
                if (this.resources >= 50) {
                    unit = new Infantry(spawnPosition, 'player');
                    this.resources -= 50;
                }
                break;
            case 'tank':
                if (this.resources >= 150) {
                    unit = new Tank(spawnPosition, 'player');
                    this.resources -= 150;
                }
                break;
            case 'helicopter':
                if (this.resources >= 200) {
                    unit = new Helicopter(spawnPosition, 'player');
                    this.resources -= 200;
                }
                break;
        }

        if (unit) {
            unit.init();
            this.scene.add(unit.mesh);
            this.units.push(unit);
            this.updateResourceDisplay();
        }
    }

    updateResourceDisplay() {
        document.getElementById('resource-count').textContent = this.resources;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 1/60;
        
        // Update systems
        this.controls.update();
        this.artillery.update(deltaTime);
        const wind = this.weather.update(deltaTime);
        
        // Update units
        this.units.forEach(unit => {
            unit.update(deltaTime, this.terrain, wind.direction, wind.strength);
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
