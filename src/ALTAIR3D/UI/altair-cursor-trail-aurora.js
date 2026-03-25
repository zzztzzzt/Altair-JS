import * as THREE from 'three';

export class CursorTrailAurora {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'cursor-trail';

        this.color = color;
        let colorTypeOne = {};
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        this.trailHistory = Array(45).fill().map(() => new THREE.Vector3());
        this.smoothedVelocity = new THREE.Vector3();

        this.target = new THREE.Vector3();
        this._initialized = false;

        this.elapsedTime = 0;
        this.clickBurst = 0;

        this.baseColor = new THREE.Color(0x88ffff);
        this.accentColor = new THREE.Color('#cd8cff');

        // 2. Meshes
        const mainGroup = new THREE.Group();
        mainGroup.visible = false;
        mainGroup.raycast = function () {};
        this.mainMesh = mainGroup;

        const visualGroup = new THREE.Group();
        visualGroup.raycast = function () {};
        this.visualGroup = visualGroup;

        const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.core.raycast = function () {};
        visualGroup.add(this.core);

        this.trailMeshes = [];
        const trailCount = this.trailHistory.length;
        const trailGeo = new THREE.ConeGeometry(0.18, 0.4, 6, 1, false);

        for (let i = 0; i < trailCount; i++) {
            const mat = new THREE.MeshPhongMaterial({
                color: 0x88ffff,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                shininess: 100,
                side: THREE.FrontSide,
            });

            const mesh = new THREE.Mesh(trailGeo, mat);
            mesh.raycast = function () {};
            mesh.geometry.rotateX(-Math.PI / 2);

            this.trailMeshes.push(mesh);
            visualGroup.add(mesh);
        }

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => { this.customizeWhenMouseOver(); };

        this.notMouseOver = () => { this.customizeNotMouseOver(); };

        this.whenClick = () => {
            this.clickBurst = 1.5;
            this.customizeWhenClick();
        };

        this.whenMouseMove = (x, y) => {
            const mx = x * 5;
            const my = y * 5;
            if (!this._initialized) {
                this._initialized = true;
                this.core.position.set(mx, my, 0);
                this.trailHistory.forEach(v => v.set(mx, my, 0));
            }
            this.target.set(mx, my, 0);
        };

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = () => {
            if (!this._initialized) return;
            this.elapsedTime += 0.02;
            this.clickBurst *= 0.91; 
            this.updateCore();
            this.updateTrail();
        };

        // 6. Functions
    }

    updateCore() {
        const prev = this.core.position.clone();
        // The 0.18 value here determines the sensitivity of the core-following mouse
        this.core.position.lerp(this.target, 0.18); 

        const vel = new THREE.Vector3().subVectors(this.core.position, prev);
        this.smoothedVelocity.lerp(vel, 0.2);

        const speed = this.smoothedVelocity.length();
        const pulse = 1 + Math.sin(this.elapsedTime * 6) * 0.1 + this.clickBurst * 0.5;

        this.core.scale.set(pulse, pulse, pulse);
        this.core.material.opacity = 0.7 + speed * 8 + this.clickBurst;
    }

    updateTrail() {
        // Let the first point smoothly follow the core, instead of directly cloning
        this.trailHistory[0].lerp(this.core.position, 0.6);

        // This allows subsequent points to exhibit a "chasing" effect, rather than a simple array displacement
        // This way in the turn, the point will be pulled along the curve, forming a circular arc feeling
        for (let i = 1; i < this.trailHistory.length; i++) {
            const point = this.trailHistory[i];
            const prevPoint = this.trailHistory[i - 1];
            // Values ​​between 0.35 and 0.5 can result in a more graceful arc
            point.lerp(prevPoint, 0.45); 
        }

        const speed = this.smoothedVelocity.length();

        for (let i = 0; i < this.trailMeshes.length; i++) {
            const mesh = this.trailMeshes[i];
            const p = this.trailHistory[i];
            
            // Calculate the local direction based on the front and rear points
            // This allows each ribbon to rotate precisely along the curved direction
            let localDir = new THREE.Vector3();
            if (i > 0) {
                localDir.subVectors(this.trailHistory[i-1], p).normalize();
            } else {
                localDir.copy(this.smoothedVelocity).normalize();
            }

            const t = i / this.trailMeshes.length;
            mesh.position.copy(p);

            // Color and Transparency Logic
            const flow = (Math.sin(this.elapsedTime * 2.0 + i * 0.2) + 1) * 0.5;
            const mix = t * 0.65 + flow * 0.35;
            const color = this.baseColor.clone().lerp(this.accentColor, mix);
            const hsl = {};
            color.getHSL(hsl);
            hsl.h += Math.sin(this.elapsedTime * 0.6 + i * 0.08) * 0.04;
            color.setHSL(hsl.h, hsl.s, hsl.l);
            mesh.material.color.copy(color);

            const fade = (1 - t); 
            mesh.material.opacity = fade * (0.5 + speed * 9 + this.clickBurst);

            // Size
            const width = (1 - t) * 1.0 + speed * 1.5; 
            const length = (0.8 + speed * 6.0) * 1.2;
            const thickness = fade * 0.2 + speed * 1; 

            mesh.scale.set(width, length, thickness);

            // Dir Optimization
            if (localDir.length() > 0.001) {
                const angle = Math.atan2(localDir.y, localDir.x);
                mesh.rotation.z = angle - Math.PI / 2;
            }

            mesh.rotation.x = Math.sin(this.elapsedTime * 2.5 + i * 0.25) * 0.4;
        }
    }

    async getMeshes() {
        return {
            mainMesh: this.mainMesh,
            visualGroup: this.visualGroup
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

    colorSet(color) { this.color = color; }

    scaleSet(x, y, z) { this.mainMesh.scale.set(x, y, z); this.visualGroup.scale.set(x, y, z); }

    positionSet(x, y, z) { this.mainMesh.position.set(x, y, z); this.visualGroup.position.set(x, y, z); }

    rotationSet(x, y, z) { this.mainMesh.rotation.set(x, y, z); this.visualGroup.rotation.set(x, y, z); }
}