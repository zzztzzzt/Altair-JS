import * as THREE from 'three';

export class ButtonCubeSwarm {
    constructor(color = 0) {
        // 1. Variables
        this.objectType = 'button';

        this.color = color;
        const colorTypeOne = [0xb1ff75, 0xffffff];
        const colorTypeTwo = [0x69e1ff, 0xffffff];
        let colorCustom = {};
        this.colorTypeList = [colorTypeOne, colorTypeTwo, colorCustom];

        const gridSize = 7; // 7 x 7 x 7
        const cubeCount = gridSize * gridSize * gridSize;
        const cubeSize = 0.4;
        const spacing = 0.42; // > cubeSize so neighboring cubes never touch
        const halfExtent = ((gridSize - 1) * spacing) / 2;

        const maxDistance = Math.sqrt(
            halfExtent * halfExtent * 3
        );

        let hoverStatus = 'idle'; // 'idle' | 'hover'

        let clickActive = false;
        let clickTimer = 0;
        const burstAmplitude = 1.6; // how far cubes scatter outward
        const burstOutDuration = 0.05; // seconds to scatter out (quick, synchronized)
        const returnBaseDuration = 3.1; // base seconds for the return trip
        const returnSpeedMin = 0.7; // per-cube return-duration multiplier range
        const returnSpeedMax = 1.4; // -> some cubes drift back slower, some faster

        const waveDir = new THREE.Vector3(1, 0.4, 0.6).normalize();
        const waveFrequency = 0.9; // spatial frequency of the wave across the grid
        const waveSpeedIdle = 1.8; // rad/s, gradient flow speed at rest
        const waveSpeedHover = 2.4; // rad/s, flow speed while hovered
        const waveSpeedEase = 3; // how quickly flow speed eases toward its target
        let currentWaveSpeed = waveSpeedIdle;
        let waveTime = 0;

        const floatAmplitude = 0.06; // kept deliberately subtle

        const basePositions = [];
        const wavePhases = []; // precomputed spatial phase per cube ( position . waveDir )
        const burstDirections = [];
        const burstReturnRandoms = []; // per-cube return-speed multiplier, picked once at setup

        for (let xi = 0; xi < gridSize; xi++) {
            for (let yi = 0; yi < gridSize; yi++) {
                for (let zi = 0; zi < gridSize; zi++) {
                    const pos = new THREE.Vector3(
                        xi * spacing - halfExtent,
                        yi * spacing - halfExtent,
                        zi * spacing - halfExtent
                    );
                    basePositions.push(pos);
                    wavePhases.push(pos.dot(waveDir) * waveFrequency);

                    const len = pos.length();
                    burstDirections.push(len > 0.0001 ? pos.clone().normalize() : new THREE.Vector3(0, 0, 0));

                    burstReturnRandoms.push(returnSpeedMin + Math.random() * (returnSpeedMax - returnSpeedMin));
                }
            }
        }

        // 2. Meshes

        // invisible bounding box, used purely for raycaster hit detection
        const hitBoxSize = (gridSize - 1) * spacing + cubeSize * 2 + 1.0;
        const mainGeometry = new THREE.BoxGeometry(hitBoxSize, hitBoxSize, hitBoxSize);
        const mainMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        this.mainMesh = mainMesh;

        // many small cubes, one InstancedMesh for performance
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // stays white; instance colors carry the actual hue
            metalness: 0.6,
            roughness: 0.6,
        });
        const cubeGrid = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, cubeCount);
        // override the raycast method to prevent Raycaster from detecting the Mesh
        cubeGrid.raycast = function (raycaster, intersects) {
            // return directly without doing any operation, preventing Raycaster from detecting
        };
        this.cubeGrid = cubeGrid;
        cubeGrid.rotation.x = -Math.PI / 6;

        const colorA = new THREE.Color(this.colorTypeList[color][0]);
        const colorB = new THREE.Color(this.colorTypeList[color][1]);
        const tempColor = new THREE.Color();
        const dummy = new THREE.Object3D();

        // shared by both the initial setup and every animation frame
        const updateInstances = (waveTimeNow, clickTimerNow, clickActiveNow) => {
            for (let i = 0; i < cubeCount; i++) {
                const base = basePositions[i];
                const dir = burstDirections[i];
                const wave = Math.sin(wavePhases[i] - waveTimeNow);

                const normalizedWave = (wave + 1) * 0.5;

                const distanceFactor =
                    0.3 +
                    Math.pow(
                        base.length() / maxDistance,
                        2.0
                    ) * 0.7;

                const breath =
                    (1 - Math.cos(normalizedWave * Math.PI))
                    * 0.5;

                const scale =
                    0.45 +
                    breath *
                    0.55 *
                    distanceFactor;

                // click burst : every cube scatters outward together ( synchronized ),
                // then drifts back home at its own pace - simple ease, no bounce/overshoot
                let burstFactor = 0;
                if (clickActiveNow) {
                    if (clickTimerNow < burstOutDuration) {
                        const p = Math.min(1, clickTimerNow / burstOutDuration);
                        const eased = 1 - Math.pow(1 - p, 3); // ease-out
                        burstFactor = eased * burstAmplitude;
                    } else {
                        const myReturnDuration = returnBaseDuration * burstReturnRandoms[i];
                        const p = Math.min(1, (clickTimerNow - burstOutDuration) / myReturnDuration);
                        const eased = 1 - Math.pow(1 - p, 3); // ease-out, settles in cleanly
                        burstFactor = burstAmplitude * (1 - eased);
                    }
                }

                dummy.position.set(
                    base.x + dir.x * burstFactor,
                    base.y + wave * floatAmplitude + dir.y * burstFactor,
                    base.z + dir.z * burstFactor
                );

                dummy.scale.setScalar(scale);
        
                dummy.updateMatrix();
                cubeGrid.setMatrixAt(i, dummy.matrix);
        
                const t = (wave + 1) / 2;
                tempColor.copy(colorA).lerp(colorB, t);
                cubeGrid.setColorAt(i, tempColor);
            }
        
            cubeGrid.instanceMatrix.needsUpdate = true;
        
            if (cubeGrid.instanceColor) {
                cubeGrid.instanceColor.needsUpdate = true;
            }
        };

        updateInstances(0, 0, false); // initialize before first render, avoids a blank/white first frame

        // 3. Lights

        // 4. Event Listeners
        this.whenMouseOver = () => {
            hoverStatus = 'hover';
        };

        this.notMouseOver = () => {
            hoverStatus = 'idle';
        };

        this.whenClick = () => {
            clickActive = true;
            clickTimer = 0;
        };

        this.whenMouseMove = (x, y) => {};

        this.customizeWhenMouseOver = () => {};
        this.customizeNotMouseOver = () => {};
        this.customizeWhenClick = () => {};

        // 5. Animation
        this.animateFunc = (delta, elapsed) => {
            cubeGrid.rotation.y += delta * 0.15;

            if (clickActive) {
                clickTimer += delta;
                // the slowest cube ( returnSpeedMax multiplier ) decides when the whole burst is "done"
                const maxDuration = burstOutDuration + returnBaseDuration * returnSpeedMax;
                if (clickTimer >= maxDuration) {
                    clickActive = false;
                    clickTimer = 0;
                }
            }

            const targetWaveSpeed = hoverStatus === 'hover' ? waveSpeedHover : waveSpeedIdle;
            currentWaveSpeed += (targetWaveSpeed - currentWaveSpeed) * Math.min(1, delta * waveSpeedEase);
            waveTime += delta * currentWaveSpeed;

            updateInstances(waveTime, clickTimer, clickActive);
        };

        // 6. Functions
        function changePosition(x, y, z) {
            this.mainMesh.position.set(x, y, z);
            this.cubeGrid.position.set(x, y, z);
        }
        this.changePosition = changePosition;

        function changeScale(x, y, z) {
            this.mainMesh.scale.set(x, y, z);
            this.cubeGrid.scale.set(x, y, z);
        }
        this.changeScale = changeScale;
    }

    async getMeshes() {
        return {
            // main mesh must be named "this.mainMesh", for raycaster judging.
            mainMesh: this.mainMesh,
            cubeGrid: this.cubeGrid,
        };
    }

    getAnimateFunc() {
        return this.animateFunc;
    }

    getListenerFunc(listenerType) {
        if (listenerType === "click") return this.whenClick;
        if (listenerType === "mousemove") return this.whenMouseMove;
        if (listenerType === "mouseover") return this.whenMouseOver;
        if (listenerType === "notmouseover") return this.notMouseOver;
    }

    colorSet(color) {}

    scaleSet(x, y, z) {
        this.changeScale(x, y, z);
    }

    positionSet(x, y, z) {
        this.changePosition(x, y, z);
    }

    rotationSet(x, y, z) {}
}