import * as THREE from 'three';

export class ButtonAurora {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'button';
        this.color = color;

        const colorTypeOne = {
            "core": 0xff00ff,
            "core-emissive": 0x00ffff,
            "shard-color-a": 0x00f2ff,
            "shard-color-b": 0xff007f,
            "pulse": 0xffffff
        };
        const colorTypeTwo = [];
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        const palette = this.colorTypeList[color] || this.colorTypeList[0];
        let isHovered = false;
        let burstStrength = 0;
        let pulseProgress = 0;
        const shardDataList = [];
        const orbitDataList = []; // Store orbital tetrahedral data

        // 2. Meshes
        // Collision detection ball
        this.mainMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({ visible: false })
        );

        this.core = new THREE.Mesh(
            new THREE.TetrahedronGeometry(0.5, 0),
            new THREE.MeshStandardMaterial({
                color: palette["core"],
                emissive: palette["core-emissive"],
                emissiveIntensity: 1.5,
                metalness: 0.8,
                roughness: 0.1
            })
        );

        // Orbital Group
        const colorA = new THREE.Color(palette["shard-color-a"]);
        const colorB = new THREE.Color(palette["shard-color-b"]);

        this.ring = new THREE.Group();
        this.createOrbit(30, 2.5, this.ring, colorA, colorB, orbitDataList);
        this.ring.rotation.x = Math.PI / 2.8;

        this.ringTwo = new THREE.Group();
        this.createOrbit(20, 1.1, this.ringTwo, colorB, colorA, orbitDataList);
        this.ringTwo.rotation.y = Math.PI / 3.5;
        this.ringTwo.rotation.z = Math.PI / 6;

        // Stardust Fragments
        this.shards = new THREE.Group();
        const shardGeometry = new THREE.IcosahedronGeometry(0.02, 1);
        for (let i = 0; i < 360; i++) {
            const tempColor = colorA.clone().lerp(colorB, Math.random());
            const shard = new THREE.Mesh(shardGeometry, new THREE.MeshStandardMaterial({
                color: tempColor, emissive: tempColor, emissiveIntensity: 1, transparent: true, opacity: 0.5
            }));
            shard.raycast = () => {};
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(1 - 2 * Math.random());
            const baseRadius = 1.4 + Math.random() * 2.0;
            shardDataList.push({ 
                theta, phi, baseRadius, 
                speed: 0.002 + Math.random() * 0.008, 
                wobble: Math.random() * Math.PI * 2, 
                targetScale: 1 
            });
            this.shards.add(shard);
        }

        this.pulse = new THREE.Mesh(
            new THREE.RingGeometry(0.65, 0.8, 64),
            new THREE.MeshBasicMaterial({ color: palette["pulse"], transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        this.pulse.rotation.x = Math.PI / 2;
        this.pulse.visible = false;

        // 4. Event Listeners
        this.whenMouseOver = () => { isHovered = true; };
        this.notMouseOver = () => { isHovered = false; };
        this.whenClick = () => {
            burstStrength = 2.0; pulseProgress = 1.0;
            this.pulse.visible = true; this.pulse.scale.set(1, 1, 1); this.pulse.material.opacity = 0.9;
        };
        this.whenMouseMove = (x, y) => {};
        this.customizeWhenMouseOver = () => {};
        this.customizeNotMouseOver = () => {};
        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = () => {
            const time = Date.now() * 0.001;
            const hoverTarget = isHovered ? 1 : 0;

            // Core Animation
            this.core.material.emissiveIntensity = THREE.MathUtils.lerp(this.core.material.emissiveIntensity, 1.5 + hoverTarget * 1.5, 0.08);
            this.core.rotation.x += 0.01;
            this.core.rotation.y += 0.015;

            // The entire track rotates
            this.ring.rotation.z += 0.008 + hoverTarget * 0.01;
            this.ringTwo.rotation.x -= 0.01 + hoverTarget * 0.01;

            // lerp scaling and rotation of individual tetrahedrons within the orbit
            const allOrbitChildren = [...this.ring.children, ...this.ringTwo.children];
            allOrbitChildren.forEach((child, i) => {
                const data = orbitDataList[i];
                if (data) {
                    if (Math.random() > 0.98) data.targetScale = 0.6 + Math.random() * 1.4;
                    const s = THREE.MathUtils.lerp(child.scale.x, data.targetScale, 0.05);
                    child.scale.set(s, s, s);
                    child.rotation.x += 0.02;
                    child.rotation.y += 0.02;
                }
            });

            // Stardust Fragments Animation
            burstStrength *= 0.93;
            for (let i = 0; i < this.shards.children.length; i++) {
                const shard = this.shards.children[i];
                const data = shardDataList[i];
                
                data.theta += data.speed * (1 + burstStrength * 3);
                const radius = data.baseRadius + Math.sin(time * 2 + data.wobble) * 0.1 + burstStrength * 0.5;
                
                shard.position.set(
                    radius * Math.sin(data.phi) * Math.cos(data.theta), 
                    radius * Math.cos(data.phi), 
                    radius * Math.sin(data.phi) * Math.sin(data.theta)
                );

                if (Math.random() > 0.98) data.targetScale = 0.4 + Math.random() * 1.6;
                const ss = THREE.MathUtils.lerp(shard.scale.x, data.targetScale, 0.05);
                shard.scale.set(ss, ss, ss);
            }

            if (pulseProgress > 0) {
                pulseProgress *= 0.88;
                this.pulse.scale.multiplyScalar(1.08);
                this.pulse.material.opacity *= 0.87;
                if (pulseProgress < 0.03) { pulseProgress = 0; this.pulse.visible = false; }
            }
        };

        this.changePosition = (x, y, z) => {
            [this.mainMesh, this.core, this.ring, this.ringTwo, this.shards, this.pulse].forEach(o => o.position.set(x, y, z));
        };
        this.changeScale = (x, y, z) => {
            [this.mainMesh, this.core, this.ring, this.ringTwo, this.shards, this.pulse].forEach(o => o.scale.set(x, y, z));
        };
    }

    createOrbit(num, radius, group, c1, c2, dataList) {
        for (let i = 0; i < num; i++) {
            const size = 0.04 + Math.random() * 0.06;
            const geo = new THREE.TetrahedronGeometry(size, 0);
            const color = c1.clone().lerp(c2, Math.random());
            const mat = new THREE.MeshStandardMaterial({ 
                color, emissive: color, emissiveIntensity: 1.5, metalness: 0.8, roughness: 0 
            });
            const mesh = new THREE.Mesh(geo, mat);
            const angle = (i / num) * Math.PI * 2;
            
            // Add random Y-axis bias to create a dense, grainy texture
            mesh.position.set(Math.cos(angle) * radius, (Math.random()-0.5)*0.3, Math.sin(angle) * radius);
            dataList.push({ targetScale: 1 });
            group.add(mesh);
        }
    }

    async getMeshes() {
        return {
            mainMesh: this.mainMesh, core: this.core,
            ring: this.ring, ringTwo: this.ringTwo,
            shards: this.shards, pulse: this.pulse
        };
    }

    getAnimateFunc() { return this.animateFunc; }

    getListenerFunc(type) {
        if (type === "click") return this.whenClick;
        if (type === "mousemove") return this.whenMouseMove;
        if (type === "mouseover") return this.whenMouseOver;
        if (type === "notmouseover") return this.notMouseOver;
    }

    colorSet(color) {}
    scaleSet(x, y, z) { this.changeScale(x, y, z); }
    positionSet(x, y, z) { this.changePosition(x, y, z); }
    rotationSet(x, y, z) {}
}