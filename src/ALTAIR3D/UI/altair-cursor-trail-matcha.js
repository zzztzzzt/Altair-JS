import * as THREE from 'three';
//import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class CursorTrailMatcha {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'cursor-trail';

        this.color = color;
        let colorTypeOne = {
            "leaf-color-center": 0x91FFCA,
            "leaf-color-edge": 0xDEDEDE,
        };
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        const MAX_LEAVES = 20;
        const MIN_LEAF_DISTANCE = 0.3;

        // 2. Meshes
        const leavesGroup = new THREE.Group();
        this.mainMesh = leavesGroup;

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {};

        this.notMouseOver = () => {};

        this.whenClick = () => {};

        this.whenMouseMove = (x, y) => {
            const tx = x * 8; const ty = y * 6;
            createLeaves(this.colorTypeList, tx, ty, 0);
        };

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        let decayTimer = 0;
        this.animateFunc = (delta, elapsed, timestamp) => {
            const children = leavesGroup.children;
            if (children.length === 0) return;

            for (let i = 0; i < children.length; i++) {
                const leaf = children[i];
                if (leaf.userData) {
                    leaf.rotation.x += leaf.userData.rotSpeedX * delta;
                    leaf.rotation.y += leaf.userData.rotSpeedY * delta;
                    leaf.rotation.z += leaf.userData.rotSpeedZ * delta;

                    leaf.scale.multiplyScalar(0.98);
                    leaf.material.opacity = leaf.scale.x;
                }
            }

            decayTimer += delta;
    
            if (decayTimer > 0.06) { 
                const oldest = children[0];
                oldest.geometry.dispose();
                oldest.material.dispose();
                leavesGroup.remove(oldest);
                
                decayTimer = 0;
            }
        };

        // 6. Functions
        function createLeaves(colorTypeList, x, y, z, radius = 1.1) {
            const newPosition = new THREE.Vector3(x, y, z);
            
            for (let i = 0; i < leavesGroup.children.length; i++) {
                const existingLeaf = leavesGroup.children[i];
                
                const distance = newPosition.distanceTo(existingLeaf.position);
                
                if (distance < MIN_LEAF_DISTANCE) {
                    return; 
                }
            }
        
            const geometry = new THREE.CircleGeometry(radius, 12, 0, 1.1);
            
            const count = geometry.attributes.position.count;
            const colors = [];
            const colorCenter = new THREE.Color(colorTypeList[0]["leaf-color-center"]);
            const colorEdge = new THREE.Color(colorTypeList[0]["leaf-color-edge"]);
            
            const posAttr = geometry.attributes.position;
            for (let i = 0; i < count; i++) {
                const vx = posAttr.getX(i);
                const vy = posAttr.getY(i);
                const dist = Math.sqrt(vx * vx + vy * vy);
                const ratio = Math.min(1, dist / radius);
                
                const finalColor = new THREE.Color().lerpColors(colorCenter, colorEdge, ratio);
                colors.push(finalColor.r, finalColor.g, finalColor.b);
            }

            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            
            const material = new THREE.MeshStandardMaterial({ 
                vertexColors: true,
                roughness: 0.5,
                metalness: 0.1,
                side: THREE.DoubleSide,
                transparent: true
            });
        
            const leaf = new THREE.Mesh(geometry, material);
            leaf.position.set(x, y, z);
            
            leaf.userData = {
                rotSpeedX: (Math.random() - 0.5) * 3.5,
                rotSpeedY: (Math.random() - 0.5) * 3.5,
                rotSpeedZ: (Math.random() - 0.5) * 3.5
            };

            leaf.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // override the raycast method to prevent Raycaster from detecting the Mesh
            leaf.raycast = function (raycaster, intersects) {
                // return directly without doing any operation, preventing Raycaster from detecting
            };

            leavesGroup.add(leaf);

            if (leavesGroup.children.length > MAX_LEAVES) {
                const oldestLeaf = leavesGroup.children[0];
                
                oldestLeaf.geometry.dispose();
                oldestLeaf.material.dispose();
                
                leavesGroup.remove(oldestLeaf);
            }
        }
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

    colorSet(color) {}

    scaleSet(x, y, z) {}

    positionSet(x, y, z) {}

    rotationSet(x, y, z) {}
}
