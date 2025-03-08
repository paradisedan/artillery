import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.noise2D = createNoise2D();
        
        // Wind properties
        this.windDirection = new THREE.Vector3(1, 0, 0);
        this.windStrength = 0;
        this.targetWindStrength = 0;
        this.windChangeRate = 0.1;
        
        // Time tracking for noise
        this.time = 0;
        
        // Create wind indicator
        this.createWindIndicator();
    }

    createWindIndicator() {
        // Create arrow geometry for wind direction
        const arrowGeometry = new THREE.BufferGeometry();
        const arrowMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });

        // Arrow vertices
        const vertices = new Float32Array([
            0, 0, 0,    // start
            1, 0, 0,    // end
            1, 0.2, 0,  // arrow head
            1, 0, 0,    // back to end
            1, -0.2, 0  // arrow head
        ]);

        arrowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.windIndicator = new THREE.Line(arrowGeometry, arrowMaterial);
        
        // Position in top-right corner of screen
        this.windIndicator.scale.set(50, 50, 50);
        this.windIndicator.position.set(window.innerWidth - 100, window.innerHeight - 50, 0);
        
        // Add text for wind strength
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.windText = new THREE.Sprite(material);
        this.windText.position.set(window.innerWidth - 150, window.innerHeight - 80, 0);
        this.windText.scale.set(100, 25, 1);
        
        // Add to scene
        this.scene.add(this.windIndicator);
        this.scene.add(this.windText);
    }

    update(deltaTime) {
        this.time += deltaTime;
        
        // Update wind using noise
        const windX = this.noise2D(this.time * 0.1, 0);
        const windZ = this.noise2D(this.time * 0.1, 100);
        
        // Smoothly change wind direction
        this.windDirection.x = THREE.MathUtils.lerp(this.windDirection.x, windX, 0.1);
        this.windDirection.z = THREE.MathUtils.lerp(this.windDirection.z, windZ, 0.1);
        this.windDirection.normalize();
        
        // Update wind strength
        this.targetWindStrength = (Math.abs(windX) + Math.abs(windZ)) * 0.5;
        this.windStrength = THREE.MathUtils.lerp(
            this.windStrength,
            this.targetWindStrength,
            this.windChangeRate * deltaTime
        );
        
        // Update wind indicator
        this.updateWindIndicator();
        
        // Return current wind state
        return {
            direction: this.windDirection.clone(),
            strength: this.windStrength
        };
    }

    updateWindIndicator() {
        // Rotate arrow to match wind direction
        const angle = Math.atan2(this.windDirection.z, this.windDirection.x);
        this.windIndicator.rotation.z = angle;
        
        // Scale arrow based on wind strength
        const scale = 50 * (1 + this.windStrength);
        this.windIndicator.scale.set(scale, scale, scale);
        
        // Update wind strength text
        const canvas = this.windText.material.map.image;
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw new text
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(
            `Wind: ${Math.round(this.windStrength * 100)}%`,
            canvas.width / 2,
            canvas.height / 2
        );
        
        this.windText.material.map.needsUpdate = true;
    }

    // Create particle effects for strong winds
    createWindParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Create random positions within view volume
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 1000;     // x
            positions[i + 1] = Math.random() * 100;          // y
            positions[i + 2] = (Math.random() - 0.5) * 1000; // z
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        this.windParticles = new THREE.Points(geometry, material);
        this.scene.add(this.windParticles);
    }

    // Update wind particles
    updateWindParticles(deltaTime) {
        if (!this.windParticles) return;
        
        const positions = this.windParticles.geometry.attributes.position.array;
        const speed = this.windStrength * 50;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Move particles in wind direction
            positions[i] += this.windDirection.x * speed * deltaTime;
            positions[i + 2] += this.windDirection.z * speed * deltaTime;
            
            // Wrap particles around when they go out of bounds
            if (positions[i] > 500) positions[i] = -500;
            if (positions[i] < -500) positions[i] = 500;
            if (positions[i + 2] > 500) positions[i + 2] = -500;
            if (positions[i + 2] < -500) positions[i + 2] = 500;
        }
        
        this.windParticles.geometry.attributes.position.needsUpdate = true;
    }
}
