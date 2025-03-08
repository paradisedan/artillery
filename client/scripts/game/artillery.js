import * as THREE from 'three';

export class Artillery {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.projectiles = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Create projectile geometry and material
        this.projectileGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        this.projectileMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    }

    fire(position, angle, power, windDirection, windStrength) {
        // Convert angle to radians
        const angleRad = (angle * Math.PI) / 180;
        
        // Calculate initial velocity
        const velocity = new THREE.Vector3(
            Math.sin(angleRad) * power,
            Math.cos(angleRad) * power,
            0
        );

        // Create projectile mesh
        const projectile = new THREE.Mesh(
            this.projectileGeometry,
            this.projectileMaterial
        );
        projectile.position.copy(position);
        projectile.castShadow = true;

        // Add to scene and tracking array
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            velocity: velocity,
            position: position.clone(),
            windEffect: windDirection.clone().multiplyScalar(windStrength)
        });

        // Create tracer effect
        const tracerGeometry = new THREE.BufferGeometry();
        const tracerMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000,
            opacity: 0.5,
            transparent: true
        });
        
        const tracerPoints = [position.clone()];
        tracerGeometry.setFromPoints(tracerPoints);
        
        const tracer = new THREE.Line(tracerGeometry, tracerMaterial);
        this.scene.add(tracer);

        return {
            projectile: projectile,
            tracer: tracer,
            tracerPoints: tracerPoints
        };
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update velocity with gravity and wind
            projectile.velocity.add(
                this.gravity.clone().multiplyScalar(deltaTime)
            );
            projectile.velocity.add(
                projectile.windEffect.clone().multiplyScalar(deltaTime)
            );
            
            // Update position
            const movement = projectile.velocity.clone().multiplyScalar(deltaTime);
            projectile.position.add(movement);
            projectile.mesh.position.copy(projectile.position);

            // Check for collision with terrain
            const terrainHeight = this.terrain.getHeightAt(
                projectile.position.x,
                projectile.position.z
            );

            if (projectile.position.y <= terrainHeight) {
                // Create explosion effect
                this.createExplosion(projectile.position);
                
                // Create crater in terrain
                this.terrain.deform(
                    projectile.position,
                    10, // radius
                    5   // depth
                );

                // Remove projectile
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);

                // Damage nearby units
                this.damageNearbyUnits(projectile.position);
            }
        }
    }

    createExplosion(position) {
        // Create particle system for explosion
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const colors = [];

        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Random velocity
            velocities.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.random() * 5,
                Math.sin(angle) * radius
            ));

            // Color gradient from yellow to red
            colors.push(new THREE.Color(
                1,                    // R
                Math.random() * 0.5,  // G
                0                     // B
            ));
        }

        particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.Float32BufferAttribute(colors.flat(), 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);

        // Animate explosion
        let time = 0;
        const animate = () => {
            time += 0.016; // Approximately 60fps

            const positions = particles.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * 0.016;
                positions[i * 3 + 1] += (velocities[i].y - time * 9.81) * 0.016;
                positions[i * 3 + 2] += velocities[i].z * 0.016;
            }
            particles.attributes.position.needsUpdate = true;

            particleMaterial.opacity = 1 - time;

            if (time < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
            }
        };

        animate();
    }

    damageNearbyUnits(position) {
        // Get all units in the scene
        this.scene.traverse(object => {
            if (object.userData.unit) {
                const unit = object.userData.unit;
                const distance = position.distanceTo(unit.position);
                
                // Apply damage based on distance
                if (distance < 10) {
                    const damage = Math.floor((1 - distance / 10) * 100);
                    unit.takeDamage(damage);
                }
            }
        });
    }
}
