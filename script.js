import * as THREE from "three";
import { setup } from "./src/setup";
import {
    MovieNebula,
    MovieWater,
    MovieStarRing,
} from "./src/components";

import examplePureSky from '@hdr/example_puresky_1k.hdr';

const basicScene = setup.jsVer("three-area", "three-area-css");

const envMap = await basicScene.loadEnvironment(examplePureSky, 0, Math.PI * 5 / 9, 0);


const ocean = new MovieWater(basicScene, envMap);
basicScene.create(ocean);


const nebula = new MovieNebula();
basicScene.create(nebula);

nebula.scaleSet(10, 10, 10);
nebula.positionSet(0, 0, -120);
nebula.rotationSet(Math.PI / 6, 0, -Math.PI / 4);


const starRing = new MovieStarRing();
basicScene.create(starRing);

await starRing.loadModelAsync();
starRing.scaleSet(10, 10, 10);
starRing.positionSet(0, 0, -120);
starRing.rotationSet(Math.PI / 6, 0, -Math.PI / 4);
