import * as THREE from 'three';

export class ClickTrackingNeonOrange {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'click-tracking';

        this.color = color;
        let colorTypeOne = {};
        let colorTypeTwo = {};
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        this.wave = {};

        this.burst = 0;
        this.implode = 0;

        const count = 12000;
        const horizonRadius = 2.0;
        const photonSphere = 2.8;
        const diskOuterRadius = 18;

        // 2. Meshes
        const geo = new THREE.SphereGeometry(0.08, 20, 20);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        this.wave.mesh = new THREE.InstancedMesh(geo, mat, count);
        // override the raycast method to prevent Raycaster from detecting the Mesh
        this.wave.mesh.raycast = function (raycaster, intersects) {
            // return directly without doing any operation, preventing Raycaster from detecting
        };
        this.mainMesh = this.wave.mesh;

        this.wave.positions = [];
        this.wave.dummy = new THREE.Object3D();
        this.tempColor = new THREE.Color();

        this.tiltMatrix = new THREE.Matrix4().makeRotationZ(Math.PI * 0.22);

        // Initialize particles
        for (let i = 0; i < count; i++) {
            const r = horizonRadius + Math.pow(Math.random(), 2.8) * diskOuterRadius;
            const theta = Math.random() * Math.PI * 2;

            this.wave.positions.push({
                r,
                theta,
                phi: (Math.random() - 0.5) * Math.pow(r, 0.5) * 0.18,
                baseSize: Math.random() < 0.08
                    ? 0.2 + Math.random() * 0.25
                    : 0.03 + Math.random() * 0.08,
                wobbleSpeed: 0.1 + Math.random() * 0.4
            });
        }

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {};

        this.notMouseOver = () => {};

        this.whenClick = () => {
            this.burst = 6.0;
            this.implode = 2.0;
        };

        this.whenMouseMove = (x, y) => {};

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = (delta, elapsed) => {
            const time = elapsed;

            this.burst *= 0.95;
            this.implode *= 0.92;

            for (let i = 0; i < this.wave.positions.length; i++) {
                const p = this.wave.positions[i];

                // Opposites rotation ( the closer the rotation, the faster the rotation )
                const relativistic = Math.max(0.15, 1.0 - (1.9 / p.r));
                const angularVel =
                    (0.4 / (Math.pow(p.r, 1.5) + 0.1)) *
                    relativistic;

                p.theta += angularVel * delta * 2.5;

                let cosT = Math.cos(p.theta);
                let sinT = Math.sin(p.theta);

                let x = cosT * p.r;
                let z = sinT * p.r;
                let y = p.phi;

                // Gravitational lens ( back side raised )
                // There are artistic elements involved; it is not a direct copy of physics formulas
                if (z < 0) {
                    // 1. Calculate an intensity factor : the closer to the boundary ( horizon radius ), the more pronounced the curvature
                    // distFactor is 1 at the boundary and approaches 0 at the periphery
                    const distFactor = Math.pow(THREE.MathUtils.clamp(1.0 - (p.r - horizonRadius) / (diskOuterRadius - horizonRadius), 0, 1), 1.5);

                    // 2. Calculate the target height ( i.e., the height when it is "completely rounded" )
                    const liftStrength = horizonRadius * 1.5; 
                    const targetY = liftStrength * Math.abs(sinT);

                    // 3. The sign of phi determines whether the curve goes upwards or downwards
                    const side = p.phi > 0 ? 1 : -1;

                    // 4. Smooth Mixing
                    // Instead of directly assigning a height, we interpolate between the "original height ( p.phi )" and the "target height ( side * targetY )"
                    // The closer to the center ( the larger the distFactor ), the more it tends to targetY
                    // The mixing strength of 0.7 is an adjustable parameter ( 0.0 - 1.0 )
                    const bendMix = distFactor * 0.7; 
                    y = THREE.MathUtils.lerp(p.phi, side * targetY, bendMix);

                    // 5. Adjust the X-axis to make the ring on the back slightly "recessed," so it doesn't look so ostentatious
                    const collapseFactor = distFactor * 0.15;
                    x *= (1.0 - collapseFactor);
                }

                // inhale when clicked
                const pull = this.implode / (p.r + 0.5);
                x -= cosT * pull;
                z -= sinT * pull;

                // Energy Wave
                const waveFront = time * 10.0;
                const dist = Math.abs(p.r - waveFront);
                const wave = Math.exp(-dist * 2.2);
                const delay = Math.sin(p.r * 2.5 - time * 12);

                const burstForce = this.burst * wave * delay;

                x += cosT * burstForce * 1.8;
                z += sinT * burstForce * 1.8;
                y += burstForce * 0.8;

                // Disturbance
                const turbulence =
                    Math.sin(p.r * 0.7 - time * p.wobbleSpeed) * 0.12;

                y += turbulence;

                // Color ( thermal accretion disk )
                const velFactor = cosT * 0.5 + 0.5;
                const tempFactor =
                    1.0 / (Math.pow(Math.abs(p.r - photonSphere), 1.2) + 0.1);

                const isPhoton = THREE.MathUtils.clamp(tempFactor * 0.07, 0, 1);

                let rVal = 1.0;
                let gVal = 0.15 + velFactor * 0.5;
                let bVal = 0.05 + velFactor * 0.15;

                // The photon sphere appears white
                rVal = THREE.MathUtils.lerp(rVal, 1.0, isPhoton);
                gVal = THREE.MathUtils.lerp(gVal, 0.95, isPhoton);
                bVal = THREE.MathUtils.lerp(bVal, 0.85, isPhoton);

                // Burst Brightness
                const glow = this.burst * 0.25;
                rVal += glow;
                gVal += glow * 0.6;
                bVal += glow * 0.3;

                this.tempColor.setRGB(rVal, gVal, bVal);
                this.wave.mesh.setColorAt(i, this.tempColor);

                // Apply slant
                const pos = new THREE.Vector3(x, y, z);
                pos.applyMatrix4(this.tiltMatrix);

                this.wave.dummy.position.copy(pos);

                const distH = p.r - horizonRadius;

                if (distH < 0.05) {
                    this.wave.dummy.scale.set(0, 0, 0);
                } else {
                    // Lengthening
                    const stretch = 1.0 + (3.5 / (distH + 0.25));

                    const size =
                        p.baseSize *
                        (1 + isPhoton * 2.5) *
                        (1 + this.burst * 0.5);

                    this.wave.dummy.scale.set(
                        size * 0.7,
                        size * stretch,
                        size * 0.7
                    );

                    this.wave.dummy.rotation.set(0, -p.theta, Math.PI / 2);
                }

                this.wave.dummy.updateMatrix();
                this.wave.mesh.setMatrixAt(i, this.wave.dummy.matrix);
            }

            this.wave.mesh.instanceMatrix.needsUpdate = true;
            if (this.wave.mesh.instanceColor)
                this.wave.mesh.instanceColor.needsUpdate = true;
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

    colorSet(color) {}

    scaleSet(x, y, z) {}

    positionSet(x, y, z) {}

    rotationSet(x, y, z) {}
}
