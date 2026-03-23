import * as THREE from 'three';
import { noise } from '@utils/perlinNoise.js';

export class MovieNebula {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'movie';

        // this.color is now replaced with InstancedMesh's color control
        //this.color = color;
        let colorTypeOne = {
            "spheres-start-color": "#bdd9ff",
            "spheres-start-color-setColorAt": 0xbdd9ff,
        };
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        this.particleCount = 4000;

        // 2. Meshes
        let mistGroup = new THREE.Group();
        this.mainMesh = mistGroup;

        const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 8);

        // The color here will serve as the base for InstancedMesh.setColorAt
        // If material needs to be affected by light, please use MeshStandardMaterial instead
        const material = new THREE.MeshBasicMaterial({
            color: this.colorTypeList[color]["spheres-start-color"], 
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        // Use InstancedMesh instead of Points
        this.instancedMesh = new THREE.InstancedMesh(sphereGeometry, material, this.particleCount);
        // To use setColorAt, this feature must be enabled in the renderer
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.particleCount * 3), 3);
        mistGroup.add(this.instancedMesh);

        // Intermediate object used to calculate location
        this.dummy = new THREE.Object3D();

        const radius = 0.1;
        const height = 10;
        this.velocities = [];
        this.limit = 5;

        this.tempColor = new THREE.Color();

        for (let i = 0; i < this.particleCount; i++) {
            // Initial position calculation
            const theta = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * radius;
            const initialY = (Math.random() - 0.5) * 10;
            
            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);

            // Set the initial matrix
            this.dummy.position.set(x, initialY, z);
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

            // Set initial color
            this.instancedMesh.setColorAt(i, this.tempColor.setHex(this.colorTypeList[color]["spheres-start-color-setColorAt"]));

            const direction = Math.random() > 0.5 ? 1 : -1;
            this.velocities.push({
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() * 0.01 + 0.005) * direction,
                z: (Math.random() - 0.5) * 0.005
            });
        }

        // matrix and colors need to be updated
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.instanceColor.needsUpdate = true;

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {};

        this.notMouseOver = () => {};

        this.whenClick = () => {};

        this.whenMouseMove = (x, y) => {};

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        const clock = new THREE.Clock();
        this.animateFunc = () => {
            const time = clock.getElapsedTime();
            
            for (let i = 0; i < this.particleCount; i++) {
                // Retrieve the matrix of the current instance from InstancedMesh
                const matrix = new THREE.Matrix4();
                this.instancedMesh.getMatrixAt(i, matrix);
                
                // Parse the matrix positions back into a dummy for easier manipulation
                this.dummy.position.setFromMatrixPosition(matrix);

                let { x, y, z } = this.dummy.position;

                // Smoke diffusion logic
                const heightProgress = Math.abs(y) / this.limit; 

                const spread = Math.pow(heightProgress, 3) * 2.5; 

                const noiseX = noise(x * 0.5, y * 0.5, time * 0.2);
                const noiseZ = noise(z * 0.5, y * 0.5, time * 0.2);

                y += this.velocities[i].y;
                x += (noiseX * 0.02 + this.velocities[i].x) * (1 + spread) * 2;
                z += (noiseZ * 0.02 + this.velocities[i].z) * (1 + spread);

                // Color changes with altitude
                // Logic: The closer to the end (y is close to limit or -limit), the darker the color。
                // Simple grayscale
                const colorValue = 1 - heightProgress;

                this.tempColor.setRGB(colorValue, colorValue, colorValue);

                this.instancedMesh.setColorAt(i, this.tempColor);


                // Boundary checks
                if (y > this.limit || y < -this.limit) {
                    y = 0;
                    x = (Math.random() - 0.5) * 0.2;
                    z = (Math.random() - 0.5) * 0.2;
                    
                    // When resetting, set the color back to the brightest ( center )
                    this.instancedMesh.setColorAt(i, this.tempColor.setHex(this.colorTypeList[color]["spheres-start-color-setColorAt"]));
                }

                // Update the dummy and rewrite the matrix
                this.dummy.position.set(x, y, z);
                this.dummy.updateMatrix();
                this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            }
            
            // Tell the GPU that the matrix and colors have been updated
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            this.instancedMesh.instanceColor.needsUpdate = true;
        };

        // 6. Functions
    }
    
    async getMeshes() {
        return {
            // main mesh must be named "this.mainMesh", for raycaster judging.
            mainMesh: this.mainMesh,
        };
    }

    getAnimateFunc() {
        return this.animateFunc;
    }

    getListenerFunc(listenerType) {
        if (listenerType === "click") {
            return this.whenClick;
        }
        if (listenerType === "mousemove") {
            return this.whenMouseMove;
        }
        if (listenerType === "mouseover") {
            return this.whenMouseOver;
        }
        if (listenerType === "notmouseover") {
            return this.notMouseOver;
        }
    }

    // If you want to change the base color entirely, modify material.color
    colorSet(color) {
        if (this.instancedMesh) {
            this.instancedMesh.material.color.set(color);
        }
    }

    scaleSet(x, y, z) {
        this.mainMesh.scale.set(x, y, z);
    }

    positionSet(x, y, z) {
        this.mainMesh.position.set(x, y, z);
    }

    rotationSet(x, y, z) {
        this.mainMesh.rotation.set(x, y, z);
    }
}