import * as THREE from 'three';
import { noise } from '@utils/perlinNoise.js';

export class ButtonRadiant {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'button';

        this.color = color;
        let colorTypeOne = [0xc7c7c7, 0xc7c7c7, 0xffffff, 0xff00ff];
        let colorTypeTwo = [];
        let colorCustom = [];
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        let isHovered = false;
        let clickDetect = false;
        let clickTime = 0;
        let currentSpeedMult = 1.0;
        let smoothChaos = 0;

        // 2. Meshes
        const matelFlowerGeom = new THREE.TorusKnotGeometry(1.0, 0.3, 44, 20, 1, 20);
        const matelFlowerMat = new THREE.MeshPhysicalMaterial({
            color: this.colorTypeList[this.color][0],
            metalness: 0.95,
            roughness: 0.04,
            emissive: this.colorTypeList[this.color][1],
            emissiveIntensity: 0.08,
        });
        this.mainMesh = new THREE.Mesh(matelFlowerGeom, matelFlowerMat);

        const STREAM_COUNT = 25;
        const SEG_COUNT = 15;
        this.particleCount = STREAM_COUNT * SEG_COUNT;

        const particleGeom = new THREE.SphereGeometry(0.04, 6, 6);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });

        this.instancedParticles = new THREE.InstancedMesh(particleGeom, particleMat, this.particleCount);
        this.dummy = new THREE.Object3D();

        this.streamStates = [];
        for (let s = 0; s < STREAM_COUNT; s++) {
            const basePhi = 0.5 + Math.random() * (Math.PI - 1.0); // Far from the North and South Poles ( 0.5 ~ π-0.5 )
            this.streamStates.push({
                theta: Math.random() * Math.PI * 2,
                phi: basePhi,
                basePhi,
                phiFreq: 0.05 + Math.random() * 0.15,
                phiAmp: 0.1 + Math.random() * 0.18,  // Reduce the amplitude to avoid hitting the North and South Poles
                baseR: 2.0 + Math.random() * 2.0,
                thetaSpeed: 0.06 + Math.random() * 0.12,
                trailArc: 0.7 + Math.random() * 0.9,
                noiseOffset: Math.random() * 100,
                noiseOffsetPhi: Math.random() * 100,
                noiseOffsetR: Math.random() * 100,
            });
        }

        this.particleData = [];
        const whiteColor = new THREE.Color(1.0, 1.0, 1.0);
        const grayColor = new THREE.Color(0.0, 0.0, 0.0);
        const tempColor = new THREE.Color();

        for (let s = 0; s < STREAM_COUNT; s++) {
            const headSize = 0.5 + Math.random() * 2.5;
            const streamPhaseOffset = Math.random() * Math.PI * 2;

            for (let j = 0; j < SEG_COUNT; j++) {
                const phase = j / (SEG_COUNT - 1);
                this.particleData.push({
                    streamIndex: s,
                    phase,
                    individualROffset: (Math.random() - 0.5) * 1.2,
                    phaseShift: streamPhaseOffset,
                    size: headSize * Math.pow(1.0 - phase, 2.2),
                    vel: new THREE.Vector3(),
                    explodePos: new THREE.Vector3(),
                    currentPos: new THREE.Vector3(),
                    clickLife: 0.3 + Math.random() * 1.7,
                    chaosDir: new THREE.Vector3(
                        (Math.random() - 0.5) * 2.5,
                        (Math.random() - 0.5) * 2.5,
                        (Math.random() - 0.5) * 2.5
                    )
                });
                tempColor.lerpColors(whiteColor, grayColor, phase);
                this.instancedParticles.setColorAt(s * SEG_COUNT + j, tempColor);
            }
        }
        this.instancedParticles.instanceColor.needsUpdate = true;

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {
            isHovered = true;
        };

        this.notMouseOver = () => {
            isHovered = false;
        };

        this.whenClick = () => {
            clickDetect = true;
            clickTime = 0;
            for (let i = 0; i < this.particleCount; i++) {
                const data = this.particleData[i];
                data.explodePos.copy(data.currentPos);
                data.vel.copy(data.currentPos).normalize().multiplyScalar(8 + Math.random() * 10);
            }
        };

        this.whenMouseMove = (x, y) => {};

        this.customizeWhenMouseOver = () => {};

        this.customizeNotMouseOver = () => {};

        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = (delta, elapsed) => {
            const time = elapsed;
            const targetSpeedMult = isHovered ? 2.5 : 1.0;
            currentSpeedMult += (targetSpeedMult - currentSpeedMult) * 4.0 * delta;
            this.mainMesh.rotation.y += (isHovered ? 1.5 : 0.4) * delta;

            const rawChaos = Math.sin(time * 0.4) > 0.7 ? 1.0 : 0.0;
            smoothChaos += (rawChaos - smoothChaos) * 0.5 * delta;

            if (!clickDetect) {
                for (let s = 0; s < STREAM_COUNT; s++) {
                    const st = this.streamStates[s];
                    st.theta += st.thetaSpeed * currentSpeedMult * delta;
                    st.phi = st.basePhi + Math.sin(time * st.phiFreq) * st.phiAmp;
                }
            }

            for (let i = 0; i < this.particleCount; i++) {
                const data = this.particleData[i];

                if (clickDetect) {
                    const progress = clickTime / data.clickLife;
                    if (progress < 1.0) {
                        data.explodePos.addScaledVector(data.vel, delta);
                        data.vel.multiplyScalar(0.93);
                        this.dummy.position.copy(data.explodePos);
                        const s = data.size * (1.0 - progress);
                        this.dummy.scale.set(s, s, s);
                    } else {
                        this.dummy.position.set(0, 0, 0);
                        this.dummy.scale.set(0, 0, 0);
                    }
                } else {
                    const st = this.streamStates[data.streamIndex];

                    const curvPhase = Math.pow(data.phase, 0.7);
                    const segTheta  = st.theta - (curvPhase * st.trailArc) + data.phaseShift;

                    // Water waves: The distance between two traveling wave directions is defined by the angle of the particle's spherical surface
                    const waveDir1 =  segTheta * 0.55 + st.phi * 0.40;
                    const waveDir2 = -segTheta * 0.30 + st.phi * 0.65;

                    // Three traveling waves superimposed ( each with different speeds / frequencies )
                    // Interference creates complex ripples
                    const waveA = Math.sin(waveDir1 * 2.2 - time * 1.1) * 0.35;
                    const waveB = Math.sin(waveDir2 * 1.6 - time * 0.75) * 0.18;
                    const waveC = Math.sin((waveDir1 + waveDir2) * 1.1 - time * 1.4) * 0.10;

                    // Gentle surface drift + minimal noise
                    const drift = noise(segTheta * 0.22 + st.noiseOffset,    st.phi * 0.22, time * 0.18) * 0.28;
                    const dPhi  = noise(st.phi   * 0.28 + st.noiseOffsetPhi, segTheta * 0.18, time * 0.15 + 30) * 0.09;
                    const nR    = noise(segTheta * 0.45, st.phi * 0.45, time * 0.3 + st.noiseOffsetR) * 0.1;

                    const finalTheta = segTheta + drift;
                    const finalPhi   = Math.max(0.08, Math.min(Math.PI - 0.08, st.phi + dPhi));
                    const finalR     = st.baseR + waveA + waveB + waveC + nR + data.individualROffset;

                    const regularPos = new THREE.Vector3().setFromSphericalCoords(finalR, finalPhi, finalTheta);
                    const randomPos  = regularPos.clone().add(data.chaosDir);

                    data.currentPos.lerpVectors(regularPos, randomPos, smoothChaos);

                    this.dummy.position.copy(data.currentPos);
                    // The size varies with the wave crest ( wave A, the main wave )
                    const s = data.size * (1.0 + waveA * 0.18);
                    this.dummy.scale.set(s, s, s);
                }

                this.dummy.updateMatrix();
                this.instancedParticles.setMatrixAt(i, this.dummy.matrix);
            }

            if (clickDetect) {
                clickTime += delta;
                if (clickTime > 2.3) clickDetect = false;
            }

            this.instancedParticles.instanceMatrix.needsUpdate = true;
        };

        // 6. Functions
    }
    
    async getMeshes() {
        return {
            // main mesh must be named "this.mainMesh", for raycaster judging.
            mainMesh: this.mainMesh,
            particleSystem: this.instancedParticles,
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
        this.mainMesh.scale.set(x, y, z);
        this.instancedParticles.scale.set(x, y, z);
    }

    positionSet(x, y, z) {
        this.mainMesh.position.set(x, y, z);
        this.instancedParticles.position.set(x, y, z);
    }

    rotationSet(x, y, z) {}
}
