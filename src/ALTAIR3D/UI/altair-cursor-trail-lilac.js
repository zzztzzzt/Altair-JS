import * as THREE from 'three';

export class CursorTrailLilac {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'cursor-trail';

        this.color = color;
        let colorTypeOne = {};
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        this._clickPulse = 0;
        let t = 0;

        // Spring System
        const makeSpring = (k, d) => ({
            pos: new THREE.Vector3(), vel: new THREE.Vector3(), target: new THREE.Vector3(), k, d
        });
        this._springs = [
            makeSpring(0.04, 0.90), makeSpring(0.045, 0.88), makeSpring(0.05, 0.86),
            makeSpring(0.055, 0.84), makeSpring(0.06, 0.82), makeSpring(0.065, 0.80)
        ];

        // 2. Meshes
        const ringGroup = new THREE.Group();
        this.mainMesh = ringGroup;

        const colors_lilac = [new THREE.Color(0x8a2be2), new THREE.Color(0xe6e6fa), new THREE.Color(0xffffff)];
        const colors_inner = [new THREE.Color(0xba68c8), new THREE.Color(0xe1bee7), new THREE.Color(0xffffff)];

        const ringConfigs = [
            { radius: 1.0, tube: 0.015, colors: colors_lilac, count: 1800, size: 0.02 },
            { radius: 1.05, tube: 0.01, colors: colors_lilac, count: 1400, size: 0.015 },
            { radius: 0.95, tube: 0.012, colors: colors_lilac, count: 1200, size: 0.018 },
            { radius: 0.45, tube: 0.005, colors: colors_inner, count: 800, size: 0.008 },
            { radius: 0.35, tube: 0.015, colors: colors_inner, count: 900, size: 0.012 },
            { radius: 0.12, tube: 0.008, colors: colors_inner, count: 500, size: 0.01 }
        ];

        this.rings = ringConfigs.map(config => {
            const group = new THREE.Group();
            
            // Particle ring
            const points = createShaderRing(config.radius, config.tube, config.colors, config.count, config.size);
            points.name = 'particles';
            // override the raycast method to prevent Raycaster from detecting the Mesh
            points.raycast = function (raycaster, intersects) {
                // return directly without doing any operation, preventing Raycaster from detecting
            };
            group.add(points);
            
            const torusGeo = new THREE.TorusGeometry(config.radius, config.tube * 1.5, 16, 100);
            const torusMat = new THREE.MeshBasicMaterial({ 
                color: config.colors[1],
                transparent: true,
                opacity: 0.3
            });
            const torusMesh = new THREE.Mesh(torusGeo, torusMat);
            // override the raycast method to prevent Raycaster from detecting the Mesh
            torusMesh.raycast = function (raycaster, intersects) {
                // return directly without doing any operation, preventing Raycaster from detecting
            };
            group.add(torusMesh);
            
            return group;
        });
        this.rings.forEach(group => ringGroup.add(group));

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {};

        this.notMouseOver = () => {};

        this.whenClick = () => { this._clickPulse = 1.0; };

        this.whenMouseMove = (x, y) => {
            const tx = x * 8; const ty = y * 6;
            this._springs.forEach(sp => sp.target.set(tx, ty, 0));
        };

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = (delta) => {
            if (delta > 0.1) delta = 0.016;
            t += delta;
            this._clickPulse *= 0.92;
            const CYCLE_DURATION = 10;
            const rawChaos = Math.sin(t * (Math.PI * 2 / CYCLE_DURATION)) * 0.5 + 0.5;
            const chaosFactor = Math.pow(rawChaos, 1.5) * 0.7;

            this.rings.forEach((ringGroup, i) => {
                const sp = this._springs[i];
                const diff = new THREE.Vector3().subVectors(sp.target, sp.pos);
                sp.vel.addScaledVector(diff, sp.k); sp.vel.multiplyScalar(sp.d); sp.pos.add(sp.vel);
                ringGroup.position.copy(sp.pos);

                const points = ringGroup.getObjectByName('particles');
                if (points) {
                    points.material.uniforms.uChaos.value = chaosFactor;
                    points.material.uniforms.uPulse.value = i < 3 ? this._clickPulse : 0;
                }
                
                ringGroup.rotation.y += 0.003 * (i + 1);
                ringGroup.rotation.x += 0.002 * (i + 1);
            });
        };

        // 6. Functions
        function createShaderRing(radius, tube, colorArray, count, baseSize) {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const offsets = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const sWeight = new Float32Array(count);

            const tempCol = new THREE.Color();
            const tempVec = new THREE.Vector3();

            for (let i = 0; i < count; i++) {
                const u = Math.random() * Math.PI * 2;
                const v = Math.random() * Math.PI * 2;
                const x = (radius + tube * Math.cos(v)) * Math.cos(u);
                const y = (radius + tube * Math.sin(v)) * Math.sin(u);
                const z = tube * Math.sin(v);
                pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;

                tempVec.set(x, y, z).normalize();
                const dist = radius * (0.2 + Math.random() * 0.4);
                offsets[i * 3] = tempVec.x * dist;
                offsets[i * 3 + 1] = tempVec.y * dist;
                offsets[i * 3 + 2] = tempVec.z * dist;

                // Particle size weight
                sWeight[i] = Math.pow(Math.random(), 2.0) * 2.0 + 0.5;

                const ratio = u / (Math.PI * 2);
                if (ratio < 0.5) tempCol.lerpColors(colorArray[0], colorArray[1], ratio * 2);
                else tempCol.lerpColors(colorArray[1], colorArray[2], (ratio - 0.5) * 2);
                colors[i * 3] = tempCol.r; colors[i * 3 + 1] = tempCol.g; colors[i * 3 + 2] = tempCol.b;
            }

            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 3));
            geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
            geo.setAttribute('aSizeWeight', new THREE.BufferAttribute(sWeight, 1));

            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uChaos: { value: 0 },
                    uPulse: { value: 0 },
                    uBaseSize: { value: baseSize },
                    uPixelRatio: { value: window.devicePixelRatio || 1 }
                },
                vertexShader: `
                    attribute vec3 aOffset;
                    attribute vec3 aColor;
                    attribute float aSizeWeight;
                    varying vec3 vColor;
                    uniform float uChaos;
                    uniform float uPulse;
                    uniform float uBaseSize;
                    uniform float uPixelRatio;

                    void main() {
                        vColor = aColor;

                        vec3 newPos = position + (aOffset * uChaos);
                        
                        // Point size compensation : Increases by 2.5 times during diffusion
                        float size = uBaseSize * aSizeWeight * (1.0 + uChaos * 0.8 + uPulse * 1.5);
                        
                        vec4 mvPos = modelViewMatrix * vec4(newPos, 1.0);
                        // 150.0 is a baseline perspective factor, which can be fine-tuned as needed
                        gl_PointSize = size * uPixelRatio * (150.0 / -mvPos.z);
                        gl_Position = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        
                        if (dist > 0.5) discard;
                        
                        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
                        
                        gl_FragColor = vec4(vColor, alpha * 0.9);
                    }
                `,
                transparent: true,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            return new THREE.Points(geo, mat);
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
