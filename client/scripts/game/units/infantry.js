import * as THREE from 'three';
import { UnitBase } from './unitBase.js';

export class Infantry extends UnitBase {
    constructor(position, team) {
        super(position, team);
        this.type = 'infantry';
        this.cost = 50;
        this.speed = 5;
        this.heightOffset = 1;
        this.attackRange = 10;
        
        // Infantry is strong against helicopters, weak against tanks
        this.advantages = ['helicopter'];
        this.disadvantages = ['tank'];
    }

    init() {
        // Create a more detailed infantry model
        const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 2, 8);
        const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: this.team === 'player' ? 0x2196F3 : 0xf44336
        });

        this.mesh = new THREE.Group();
        
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = 0.5;
        
        const head = new THREE.Mesh(headGeometry, material);
        head.position.y = 1;

        this.mesh.add(body);
        this.mesh.add(head);
        
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add unit reference to the mesh for raycasting
        this.mesh.userData.unit = this;
    }

    attack(target) {
        // Modify attack rolls based on advantages/disadvantages
        let attackBonus = 0;
        if (this.advantages.includes(target.type)) {
            attackBonus = 1;  // Bonus against helicopters
        } else if (this.disadvantages.includes(target.type)) {
            attackBonus = -1; // Penalty against tanks
        }

        const attackRoll = Math.floor(Math.random() * 6) + 1 + attackBonus;
        const defenseRoll = Math.floor(Math.random() * 6) + 1;
        
        if (attackRoll > defenseRoll) {
            const damage = (attackRoll - defenseRoll) * 15;
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

    update(deltaTime, terrain) {
        super.update(deltaTime, terrain);
        
        if (this.moving) {
            // Add walking animation
            const walkCycle = Math.sin(Date.now() * 0.01) * 0.1;
            this.mesh.rotation.x = walkCycle;
        }
    }
}
