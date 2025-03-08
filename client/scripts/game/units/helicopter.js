import * as THREE from 'three';
import { UnitBase } from './unitBase.js';

export class Helicopter extends UnitBase {
    constructor(position, team) {
        super(position, team);
        this.type = 'helicopter';
        this.cost = 200;
        this.speed = 8;
        this.heightOffset = 15; // Helicopters fly high
        this.attackRange = 20;
        this.health = 150;

        // Helicopters are strong against tanks, weak against infantry
        this.advantages = ['tank'];
        this.disadvantages = ['infantry'];
        
        // Wind effect properties
        this.windOffset = new THREE.Vector3();
        this.windStrength = 0;
    }

    init() {
        this.mesh = new THREE.Group();

        // Create helicopter body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.8, 2, 8);
        const cockpitGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        const rotorGeometry = new THREE.BoxGeometry(8, 0.1, 0.3);
        const tailGeometry = new THREE.BoxGeometry(0.2, 0.2, 3);
        const tailRotorGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);

        const material = new THREE.MeshPhongMaterial({
            color: this.team === 'player' ? 0x2196F3 : 0xf44336
        });

        // Body
        const body = new THREE.Mesh(bodyGeometry, material);
        body.rotation.x = Math.PI / 2;

        // Cockpit
        const cockpit = new THREE.Mesh(cockpitGeometry, material);
        cockpit.position.z = -0.5;
        cockpit.position.y = 0.2;

        // Main rotor
        this.mainRotor = new THREE.Mesh(rotorGeometry, material);
        this.mainRotor.position.y = 1;

        // Tail boom
        const tail = new THREE.Mesh(tailGeometry, material);
        tail.position.z = 2.5;

        // Tail rotor
        this.tailRotor = new THREE.Mesh(tailRotorGeometry, material);
        this.tailRotor.position.z = 4;
        this.tailRotor.position.y = 0.5;

        this.mesh.add(body);
        this.mesh.add(cockpit);
        this.mesh.add(this.mainRotor);
        this.mesh.add(tail);
        this.mesh.add(this.tailRotor);

        this.mesh.position.copy(this.position);
        this.mesh.position.y += this.heightOffset;
        this.mesh.castShadow = true;

        // Add unit reference to the mesh for raycasting
        this.mesh.userData.unit = this;
    }

    attack(target) {
        // Rotate to face target
        const direction = new THREE.Vector3()
            .subVectors(target.position, this.position)
            .normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;

        // Modify attack rolls based on advantages/disadvantages
        let attackBonus = 0;
        if (this.advantages.includes(target.type)) {
            attackBonus = 2;  // Strong bonus against tanks
        } else if (this.disadvantages.includes(target.type)) {
            attackBonus = -2; // Strong penalty against infantry
        }

        const attackRoll = Math.floor(Math.random() * 6) + 1 + attackBonus;
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

    update(deltaTime, terrain, windDirection, windStrength) {
        super.update(deltaTime, terrain);

        // Rotate rotors
        this.mainRotor.rotation.y += deltaTime * 10;
        this.tailRotor.rotation.x += deltaTime * 15;

        // Apply wind effects
        this.windStrength = THREE.MathUtils.lerp(this.windStrength, windStrength, deltaTime);
        this.windOffset.copy(windDirection).multiplyScalar(this.windStrength * deltaTime);
        this.position.add(this.windOffset);
        
        // Add hovering effect
        const hoverOffset = Math.sin(Date.now() * 0.002) * 0.2;
        this.mesh.position.y = this.heightOffset + hoverOffset;

        // Update position
        this.mesh.position.copy(this.position);
        this.mesh.position.y += this.heightOffset + hoverOffset;
    }

    // Override moveTo to handle 3D movement
    moveTo(position) {
        const targetWithHeight = position.clone();
        targetWithHeight.y += this.heightOffset;
        this.targetPosition = targetWithHeight;
        this.moving = true;
    }
}
