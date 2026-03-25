import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ringOfPlanet from '@models/ring-of-planet.glb';

export class MovieStarRing {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'movie';

        this.color = color;
        let colorTypeOne = {
            "model-star-ring-path": ringOfPlanet,
        };
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        // 2. Meshes
        let glbModel = null;
        this.mainMesh = glbModel;

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
        this.animateFunc = (delta, elapsed, timestamp) => {};

        // 6. Functions
    }

    async loadModelAsync(GlbPath = this.colorTypeList[this.color]["model-star-ring-path"]) {
        const loader = new GLTFLoader();
        try {
            const gltf = await this.loadModel(loader, GlbPath);
            this.mainMesh = gltf.scene;

            // if model's surface is still transparent
            //this.fixBackfaceCulling(this.mainMesh);

            this.isModelLoaded = true;
        } catch (error) {
            console.error('Loading GLTF error', error);
        }
    }

    loadModel(loader, GlbPath) {
        return new Promise((resolve, reject) => {
            loader.load(
                GlbPath,
                (gltf) => resolve(gltf),
                (xhr) => {
                    // console.log('GLB model ' + (xhr.loaded / xhr.total * 100) + '% loaded');
                },
                (error) => reject(error)
            );
        });
    }

    // traverse all mesh settings for double-sided rendering
    fixBackfaceCulling(mesh) {
        mesh.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.side = THREE.DoubleSide);
                }
            }
        });
    }
    
    async getMeshes() {
        await this.loadModelAsync();
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

    colorSet(color) {}

    scaleSet(x, y, z) {
        if (this.mainMesh) {
            this.mainMesh.scale.set(x, y, z);
        }
    }

    positionSet(x, y, z) {
        if (this.mainMesh) {
            this.mainMesh.position.set(x, y, z);
        }
    }

    rotationSet(x, y, z) {
        if (this.mainMesh) {
            this.mainMesh.rotation.set(x, y, z);
        }
    }
}
