import * as THREE from 'three';

export class UnitBase {
    constructor(position, team) {
        this.position = position;
        this.team = team;
        this.health = 100;
        this.mesh = null;
        this.selected = false;
        this.moving = false;
        this.targetPosition = null;
    }

    init() {
        // Base geometry and material - will be overridden by specific units
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: this.team === 'player' ? 0x2196F3 : 0xf44336
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add unit reference to the mesh for raycasting
        this.mesh.userData.unit = this;
    }

    update(deltaTime, terrain) {
        if (this.moving && this.targetPosition) {
            const direction = new THREE.Vector3()
                .subVectors(this.targetPosition, this.position)
                .normalize();
            
            const speed = this.speed * deltaTime;
            const movement = direction.multiplyScalar(speed);
            
            this.position.add(movement);
            this.mesh.position.copy(this.position);
            
            // Get height at current position
            const height = terrain.getHeightAt(this.position.x, this.position.z);
            this.mesh.position.y = height + this.heightOffset;
            
            // Check if we've reached the target
            if (this.position.distanceTo(this.targetPosition) < 0.1) {
                this.moving = false;
                this.targetPosition = null;
            }
        }
    }

    moveTo(position) {
        this.targetPosition = position;
        this.moving = true;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }

    select() {
        this.selected = true;
        // Add selection visual indicator
        const selectionRing = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.4, 32),
            new THREE.MeshBasicMaterial({
                color: 0xffff00,
                side: THREE.DoubleSide
            })
        );
        selectionRing.rotation.x = -Math.PI / 2;
        selectionRing.position.y = 0.1;
        this.mesh.add(selectionRing);
    }

    deselect() {
        this.selected = false;
        // Remove selection visual indicator
        this.mesh.children.forEach(child => {
            if (child.geometry instanceof THREE.RingGeometry) {
                this.mesh.remove(child);
            }
        });
    }

    // Combat system using Risk-style dice rules
    attack(target) {
        const attackRoll = Math.floor(Math.random() * 6) + 1;
        const defenseRoll = Math.floor(Math.random() * 6) + 1;
        
        if (attackRoll > defenseRoll) {
            const damage = (attackRoll - defenseRoll) * 20;
            target.takeDamage(damage);
            return {
                success: true,
                damage: damage
            };
        }
        
        return {
            success: false,
            damage: 0
        };
    }
}
