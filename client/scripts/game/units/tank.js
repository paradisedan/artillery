import * as THREE from 'three';
import { UnitBase } from './unitBase.js';

export class Tank extends UnitBase {
    constructor(position, team) {
        super(position, team);
        this.type = 'tank';
        this.cost = 150;
        this.speed = 3;
        this.heightOffset = 1.5;
        this.attackRange = 15;
        this.health = 200; // Tanks have more health

        // Tanks are strong against infantry, weak against helicopters
        this.advantages = ['infantry'];
        this.disadvantages = ['helicopter'];
    }

    init() {
        this.mesh = new THREE.Group();

        // Create tank body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const turretGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.8, 8);
        const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        
        const material = new THREE.MeshPhongMaterial({
            color: this.team === 'player' ? 0x2196F3 : 0xf44336
        });

        // Body
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = 0.5;

        // Turret
        const turret = new THREE.Mesh(turretGeometry, material);
        turret.position.y = 1.4;
        turret.rotation.x = Math.PI / 2;

        // Barrel
        const barrel = new THREE.Mesh(barrelGeometry, material);
        barrel.position.set(0, 1.4, 1.5);
        barrel.rotation.x = Math.PI / 2;

        // Add tracks
        const trackGeometry = new THREE.BoxGeometry(2.4, 0.4, 3.2);
        const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const tracks = new THREE.Mesh(trackGeometry, trackMaterial);
        tracks.position.y = 0.2;

        this.mesh.add(body);
        this.mesh.add(turret);
        this.mesh.add(barrel);
        this.mesh.add(tracks);

        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Store turret and barrel references for animation
        this.turret = turret;
        this.barrel = barrel;

        // Add unit reference to the mesh for raycasting
        this.mesh.userData.unit = this;
    }

    attack(target) {
        // Rotate turret to face target
        const direction = new THREE.Vector3()
            .subVectors(target.position, this.position)
            .normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.turret.rotation.y = angle;
        this.barrel.rotation.y = angle;

        // Modify attack rolls based on advantages/disadvantages
        let attackBonus = 0;
        if (this.advantages.includes(target.type)) {
            attackBonus = 2;  // Strong bonus against infantry
        } else if (this.disadvantages.includes(target.type)) {
            attackBonus = -1; // Penalty against helicopters
        }

        const attackRoll = Math.floor(Math.random() * 6) + 1 + attackBonus;
        const defenseRoll = Math.floor(Math.random() * 6) + 1;
        
        if (attackRoll > defenseRoll) {
            const damage = (attackRoll - defenseRoll) * 25; // Tanks deal more damage
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
            // Add track movement animation
            const trackRotation = (Date.now() * 0.001) % (Math.PI * 2);
            this.mesh.children[3].rotation.x = trackRotation;
        }
    }
}
