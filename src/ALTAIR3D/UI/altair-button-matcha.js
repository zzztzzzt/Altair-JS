import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dropletsRing from '@models/droplets-ring.glb';

export class ButtonMatcha {
    constructor(color = 0, useEnvMap = false) {
        // 1. Variables
        this.objectType = 'button';

        this.useEnvMap = useEnvMap;

        this.color = color;
        let colorTypeOne = {
            "model-droplets-ring-path": dropletsRing,
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
        this.colorA = new THREE.Color(0x4fd1c5); // 青綠
        this.colorB = new THREE.Color(0x8b5cf6); // 紫色
        this.animateFunc = (delta, elapsed) => {
            const shader = this.material?.userData?.shader;
            if (shader) shader.uniforms.uTime.value = elapsed;
        
            this.rings?.forEach(({ mesh, axisA, axisB, axisC, speedA, speedB, speedC }) => {
                mesh.rotateOnWorldAxis(axisA, speedA * delta);
                mesh.rotateOnWorldAxis(axisB, speedB * delta);
                mesh.rotateOnWorldAxis(axisC, speedC * delta);
            });
        };

        // 6. Functions
    }

    async loadModelAsync(GlbPath = this.colorTypeList[this.color]["model-droplets-ring-path"]) {
        const loader = new GLTFLoader();
        const gltf = await this.loadModel(loader, GlbPath);
        
        this.mainMesh = new THREE.Group();
        this.rings = [];
    
        const ringCount = 3;
    
        for (let i = 0; i < ringCount; i++) {
            const ring = gltf.scene.clone(true);

            const scale = 1 - (i * 0.35);
            ring.scale.set(scale, scale, scale);
            
            const phi = Math.acos(1 - 2 * (i + 0.5) / ringCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
            const axis = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            ).normalize();
    
            this.rings.push({
                mesh: ring,
                axisA: axis,
                axisB: new THREE.Vector3(
                    Math.cos(phi) * Math.cos(theta),
                    -Math.sin(phi),
                    Math.cos(phi) * Math.sin(theta)
                ).normalize(),
                axisC: new THREE.Vector3(Math.sin(theta), 0, -Math.cos(theta)).normalize(),
                speedA: 0.5 + Math.random() * 1.0,
                speedB: 0.3 + Math.random() * 0.8,
                speedC: 0.2 + Math.random() * 0.6,
            });
    
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
            ring.quaternion.copy(quaternion);
    
            this.mainMesh.add(ring);
        }
    
        this.applyMaterial(this.mainMesh);
    }

    applyMaterial(mesh) {
        if (!this.useEnvMap) {
            this.material = new THREE.MeshPhongMaterial({
                color: 0xaeb8b2,
                specular: 0x8ecfb4,
                shininess: 80,
            });
    
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.material = this.material;
                }
            });
        } else {
            this.material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 1,
                roughness: 0.15,
                iridescence: 0.6,
                iridescenceIOR: 1.3,
                iridescenceThicknessRange: [100, 400],
            });
    
            const material = this.material;
    
            material.onBeforeCompile = (shader) => {
    
                shader.uniforms.uTime = { value: 0 };
                material.userData.shader = shader;
    
                shader.vertexShader =
                    `
                    varying vec3 vWorldPos;
                    `
                    + shader.vertexShader;
    
                // Modify the vertex shader : directly calculate world coordinates using modelMatrix
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <project_vertex>',
                    `
                    #include <project_vertex>
    
                    // modelMatrix ( Three.js built-in ) times local position yields stable, accurate world coordinates.
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    `
                );
    
                shader.fragmentShader =
                    `
                    uniform float uTime;
                    varying vec3 vWorldPos;
                    `
                    + shader.fragmentShader;
    
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <color_fragment>',
                    `
                    vec3 colorA = vec3(0.68, 0.70, 0.72);
                    vec3 colorB = vec3(0.63, 0.85, 0.72);
    
                    float gradient =
                        sin(
                            vWorldPos.y * 2.5 +
                            vWorldPos.x * 1.5 +
                            uTime
                        ) * 0.5 + 0.5;
    
                    diffuseColor.rgb *= mix(
                        colorA,
                        colorB,
                        gradient
                    );
                    `
                );
            };
    
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
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

    scaleSet(x, y, z) {}

    positionSet(x, y, z) {}

    rotationSet(x, y, z) {}
}
