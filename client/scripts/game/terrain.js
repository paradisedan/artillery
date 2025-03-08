import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
    constructor(width = 1000, depth = 1000, segments = 100) {
        this.width = width;
        this.depth = depth;
        this.segments = segments;
        this.noise2D = createNoise2D();
    }

    generate() {
        const geometry = new THREE.PlaneGeometry(
            this.width,
            this.depth,
            this.segments,
            this.segments
        );

        // Generate height map using Simplex noise
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i] / this.width;
            const y = vertices[i + 2] / this.depth;
            
            // Multiple octaves of noise for more natural looking terrain
            let height = 0;
            height += this.noise2D(x * 1, y * 1) * 50;
            height += this.noise2D(x * 2, y * 2) * 25;
            height += this.noise2D(x * 4, y * 4) * 12.5;
            height += this.noise2D(x * 8, y * 8) * 6.25;
            
            vertices[i + 1] = height;
        }

        // Update normals for proper lighting
        geometry.computeVertexNormals();

        // Create terrain material
        const material = new THREE.MeshPhongMaterial({
            color: 0x3d5e3d,
            wireframe: false,
            flatShading: true
        });

        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;

        return terrain;
    }

    // Get height at specific world coordinates
    getHeightAt(x, z) {
        const xRatio = (x + this.width / 2) / this.width;
        const zRatio = (z + this.depth / 2) / this.depth;
        
        let height = 0;
        height += this.noise2D(xRatio * 1, zRatio * 1) * 50;
        height += this.noise2D(xRatio * 2, zRatio * 2) * 25;
        height += this.noise2D(xRatio * 4, zRatio * 4) * 12.5;
        height += this.noise2D(xRatio * 8, zRatio * 8) * 6.25;
        
        return height;
    }

    // Modify terrain (e.g., for craters)
    deform(position, radius, depth) {
        // Implementation for terrain deformation
        // This will be called when artillery hits the ground
    }
}
